import { create } from 'zustand';
import type { Employee, EmployeeDocument } from '../types';
import { supabaseDataProvider as dataProvider } from '../services/supabaseDataProvider';
import { useStore } from './useStore';

type EmployeeInput = Omit<Employee, 'id' | 'documents' | 'createdAt' | 'updatedAt'> & { documents?: EmployeeDocument[] };

const defaultWorkSchedule = { start: '08:00', end: '18:00', totalHours: 10 };

const normalizeEmployee = (employee: Employee): Employee => ({
  ...employee,
  workSchedule: employee.workSchedule ?? defaultWorkSchedule,
  documents: employee.documents ?? [],
  createdAt: employee.createdAt ? new Date(employee.createdAt) : new Date(),
  updatedAt: employee.updatedAt ? new Date(employee.updatedAt) : new Date(),
});

interface EmployeeState {
  employees: Employee[];
  loading: boolean;
  hasLoaded: boolean;
  error: string | null;
  setEmployees: (employees: Employee[]) => void;
  listEmployees: (force?: boolean) => Promise<Employee[]>;
  loadEmployees: (force?: boolean) => Promise<void>;
  getEmployeeById: (id: string) => Employee | undefined;
  createEmployee: (employee: EmployeeInput) => Promise<Employee>;
  addEmployee: (employee: EmployeeInput) => Promise<Employee>;
  updateEmployeeById: (id: string, employee: Partial<Employee>) => Promise<Employee | undefined>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<Employee | undefined>;
  deleteEmployeeById: (id: string) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addDocumentToEmployee: (employeeId: string, document: EmployeeDocument) => Promise<Employee | undefined>;
  addDocument: (employeeId: string, document: EmployeeDocument) => Promise<Employee | undefined>;
  deleteDocumentFromEmployee: (employeeId: string, documentId: string) => Promise<Employee | undefined>;
  deleteDocument: (employeeId: string, documentId: string) => Promise<Employee | undefined>;
  updateCustomTerm: (employeeId: string, term: string | undefined) => Promise<Employee | undefined>;
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  loading: false,
  hasLoaded: false,
  error: null,

  setEmployees: (employees) => set({ employees }),

  listEmployees: async (force = false) => {
    if (!force && (get().loading || get().hasLoaded)) {
      return get().employees;
    }
    set({ loading: true, hasLoaded: false, error: null });
    try {
      const employees = await dataProvider.list<Employee>('employees');
      const normalized = employees.map(normalizeEmployee);
      set({ employees: normalized, loading: false, hasLoaded: true });
      return normalized;
    } catch (error) {
      set({ loading: false, hasLoaded: false, error: (error as Error).message });
      throw error;
    }
  },

  loadEmployees: async (force = false) => {
    if (get().loading) return;
    if (!force && get().hasLoaded) return;
    await get().listEmployees(force);
  },

  getEmployeeById: (id) => get().employees.find((employee) => employee.id === id),

  createEmployee: async (employeeData) => {
    const { addAuditLog } = useStore.getState();
    const payload: Employee = {
      id: crypto.randomUUID(),
      ...employeeData,
      workSchedule: employeeData.workSchedule ?? defaultWorkSchedule,
      documents: employeeData.documents ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    try {
      const created = await dataProvider.create<Employee>('employees', payload);
      const normalized = normalizeEmployee(created);
      set((state) => ({ employees: [...state.employees, normalized] }));
      addAuditLog({ action: 'create', resourceType: 'Employee', resourceId: normalized.id });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addEmployee: async (employeeData) => get().createEmployee(employeeData),

  updateEmployeeById: async (id, employeeUpdate) => {
    const { addAuditLog } = useStore.getState();
    const payload = { ...employeeUpdate, updatedAt: new Date() };
    try {
      const updated = await dataProvider.update<Employee>('employees', id, payload);
      if (!updated) return undefined;
      const normalized = normalizeEmployee(updated);
      set((state) => ({
        employees: state.employees.map((employee) => (employee.id === id ? normalized : employee)),
      }));
      addAuditLog({ action: 'update', resourceType: 'Employee', resourceId: id });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateEmployee: async (id, employeeUpdate) => get().updateEmployeeById(id, employeeUpdate),

  deleteEmployeeById: async (id) => {
    const { addAuditLog } = useStore.getState();
    try {
      await dataProvider.delete('employees', id);
      set((state) => ({
        employees: state.employees.filter((employee) => employee.id !== id),
      }));
      addAuditLog({ action: 'delete', resourceType: 'Employee', resourceId: id });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteEmployee: async (id) => get().deleteEmployeeById(id),

  addDocumentToEmployee: async (employeeId, document) => {
    const employee = get().getEmployeeById(employeeId);
    if (!employee) return undefined;
    const updatedDocs = [...employee.documents, document];
    try {
      const updated = await dataProvider.update<Employee>('employees', employeeId, { documents: updatedDocs });
      if (!updated) return undefined;
      const normalized = normalizeEmployee(updated);
      set((state) => ({
        employees: state.employees.map((emp) => (emp.id === employeeId ? normalized : emp)),
      }));
      useStore.getState().addAuditLog({ action: 'add_document', resourceType: 'Employee', resourceId: employeeId });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addDocument: async (employeeId, document) => get().addDocumentToEmployee(employeeId, document),

  deleteDocumentFromEmployee: async (employeeId, documentId) => {
    const employee = get().getEmployeeById(employeeId);
    if (!employee) return undefined;
    const updatedDocs = employee.documents.filter((doc) => doc.id !== documentId);
    try {
      const updated = await dataProvider.update<Employee>('employees', employeeId, { documents: updatedDocs });
      if (!updated) return undefined;
      const normalized = normalizeEmployee(updated);
      set((state) => ({
        employees: state.employees.map((emp) => (emp.id === employeeId ? normalized : emp)),
      }));
      useStore.getState().addAuditLog({
        action: 'delete_document',
        resourceType: 'Employee',
        resourceId: employeeId,
        changes: { documentId },
      });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteDocument: async (employeeId, documentId) => get().deleteDocumentFromEmployee(employeeId, documentId),

  updateCustomTerm: async (employeeId, term) => {
    const payload = { customTerm: term, updatedAt: new Date() };
    try {
      const updated = await dataProvider.update<Employee>('employees', employeeId, payload);
      if (!updated) return undefined;
      const normalized = normalizeEmployee(updated);
      set((state) => ({
        employees: state.employees.map((employee) => (employee.id === employeeId ? normalized : employee)),
      }));
      useStore.getState().addAuditLog({ action: 'update_term', resourceType: 'Employee', resourceId: employeeId });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },
}));
