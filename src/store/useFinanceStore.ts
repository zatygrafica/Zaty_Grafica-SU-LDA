import { create } from 'zustand';
import type { Expense, SalaryPayment } from '../types';
import { supabaseDataProvider as dataProvider } from '../services/supabaseDataProvider';
import { useStore } from './useStore';

type ExpenseInput = Omit<Expense, 'id' | 'createdAt'>;
type SalaryPaymentInput = Omit<SalaryPayment, 'id' | 'createdAt'>;

const normalizeExpense = (expense: Expense): Expense => ({
  ...expense,
  date: expense.date ? new Date(expense.date) : new Date(),
  createdAt: expense.createdAt ? new Date(expense.createdAt) : new Date(),
});

const normalizeSalaryPayment = (payment: SalaryPayment): SalaryPayment => ({
  ...payment,
  paidAt: payment.paidAt ? new Date(payment.paidAt) : undefined,
  createdAt: payment.createdAt ? new Date(payment.createdAt) : new Date(),
});

interface FinanceState {
  expenses: Expense[];
  salaryPayments: SalaryPayment[];
  setExpenses: (expenses: Expense[]) => void;
  listExpenses: () => Promise<Expense[]>;
  getExpenseById: (id: string) => Expense | undefined;
  createExpense: (expense: ExpenseInput) => Promise<Expense>;
  addExpense: (expense: ExpenseInput) => Promise<Expense>;
  updateExpenseById: (id: string, expense: Partial<Expense>) => Promise<Expense | undefined>;
  deleteExpenseById: (id: string) => Promise<void>;
  setSalaryPayments: (payments: SalaryPayment[]) => void;
  listSalaryPayments: () => Promise<SalaryPayment[]>;
  getSalaryPaymentById: (id: string) => SalaryPayment | undefined;
  createSalaryPayment: (payment: SalaryPaymentInput) => Promise<SalaryPayment>;
  addSalaryPayment: (payment: SalaryPaymentInput) => Promise<SalaryPayment>;
  updateSalaryPaymentById: (id: string, payment: Partial<SalaryPayment>) => Promise<SalaryPayment | undefined>;
  deleteSalaryPaymentById: (id: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  expenses: [],
  salaryPayments: [],

  setExpenses: (expenses) => set({ expenses }),

  listExpenses: async () => {
    try {
      const expenses = await dataProvider.list<Expense>('expenses');
      const normalized = expenses.map(normalizeExpense);
      set({ expenses: normalized });
      return normalized;
    } catch (error) {
      set({ expenses: [], error: (error as Error).message });
      throw error;
    }
  },

  getExpenseById: (id) => get().expenses.find((expense) => expense.id === id),

  createExpense: async (expenseData) => {
    const payload: Expense = {
      id: crypto.randomUUID(),
      ...expenseData,
      createdAt: new Date(),
    };
    try {
      const created = await dataProvider.create<Expense>('expenses', payload);
      const normalized = normalizeExpense(created);
      set((state) => ({ expenses: [normalized, ...state.expenses] }));
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addExpense: async (expenseData) => get().createExpense(expenseData),

  updateExpenseById: async (id, expenseUpdate) => {
    try {
      const updated = await dataProvider.update<Expense>('expenses', id, expenseUpdate);
      if (!updated) return undefined;
      const normalized = normalizeExpense(updated);
      set((state) => ({
        expenses: state.expenses.map((expense) => (expense.id === id ? normalized : expense)),
      }));
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteExpenseById: async (id) => {
    try {
      await dataProvider.delete('expenses', id);
      set((state) => ({
        expenses: state.expenses.filter((expense) => expense.id !== id),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  setSalaryPayments: (payments) => set({ salaryPayments: payments }),

  listSalaryPayments: async () => {
    try {
      const payments = await dataProvider.list<SalaryPayment>('salaryPayments');
      const normalized = payments.map(normalizeSalaryPayment);
      set({ salaryPayments: normalized });
      return normalized;
    } catch (error) {
      set({ salaryPayments: [], error: (error as Error).message });
      throw error;
    }
  },

  getSalaryPaymentById: (id) => get().salaryPayments.find((payment) => payment.id === id),

  createSalaryPayment: async (paymentData) => {
    const { currentUser, addAuditLog } = useStore.getState();
    const payload: SalaryPayment = {
      id: crypto.randomUUID(),
      ...paymentData,
      createdAt: new Date(),
    };

    try {
      const created = await dataProvider.create<SalaryPayment>('salaryPayments', payload);
      const normalized = normalizeSalaryPayment(created);
      set((state) => ({ salaryPayments: [normalized, ...state.salaryPayments] }));

      const expensePayload: ExpenseInput = {
        description: `Salário de ${normalized.employeeName} (${normalized.month + 1}/${normalized.year})`,
        amount: normalized.amount,
        type: 'salary',
        date: normalized.date,
        createdBy: currentUser?.id,
        referenceId: normalized.id,
      };
      await get().addExpense(expensePayload);
      addAuditLog({ action: 'pay_salary', resourceType: 'Employee', resourceId: normalized.employeeId });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addSalaryPayment: async (paymentData) => get().createSalaryPayment(paymentData),

  updateSalaryPaymentById: async (id, paymentUpdate) => {
    try {
      const updated = await dataProvider.update<SalaryPayment>('salaryPayments', id, paymentUpdate);
      if (!updated) return undefined;
      const normalized = normalizeSalaryPayment(updated);
      set((state) => ({
        salaryPayments: state.salaryPayments.map((payment) => (payment.id === id ? normalized : payment)),
      }));
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteSalaryPaymentById: async (id) => {
    try {
      await dataProvider.delete('salaryPayments', id);
      set((state) => ({
        salaryPayments: state.salaryPayments.filter((payment) => payment.id !== id),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },
}));
