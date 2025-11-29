import { create } from 'zustand';
import type { Expense, SalaryPayment } from '../types';
import { supabaseDataProvider as dataProvider } from '../services/supabaseDataProvider';
import { useStore } from './useStore';
import { useEmployeeStore } from './useEmployeeStore';
import { supabase } from '../services/supabaseClient';
import { convertKeysToCamelCase } from '../utils/case';

type ExpenseInput = Omit<Expense, 'id' | 'createdAt'>;
type SalaryPaymentInput = Omit<SalaryPayment, 'id' | 'createdAt'>;

const normalizeExpense = (expense: Expense): Expense => ({
  ...expense,
  date: expense.date ? new Date(expense.date) : new Date(),
  createdAt: expense.createdAt ? new Date(expense.createdAt) : new Date(),
});

const normalizeSalaryPayment = (payment: SalaryPayment): SalaryPayment => ({
  ...payment,
  paidAt: payment.paidAt ? new Date(payment.paidAt) : payment.date ? new Date(payment.date) : undefined,
  date: payment.date ? new Date(payment.date) : payment.paidAt ? new Date(payment.paidAt) : new Date(),
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
  subscribeToSalaryPayments: () => () => void;
  subscribeToExpenses: () => () => void;
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

  subscribeToExpenses: () => {
    const channel = supabase.channel('expenses-realtime');
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'expenses' },
      (payload) => {
        const raw = (payload.new ?? payload.old) as Record<string, unknown>;
        if (!raw?.id) return;
        const parsed = convertKeysToCamelCase(raw) as Expense;
        const normalized = normalizeExpense(parsed);

        set((state) => {
          if (payload.eventType === 'DELETE') {
            return { expenses: state.expenses.filter((e) => e.id !== normalized.id) };
          }
          const exists = state.expenses.some((e) => e.id === normalized.id);
          const expenses = exists
            ? state.expenses.map((e) => (e.id === normalized.id ? normalized : e))
            : [normalized, ...state.expenses];
          return { expenses };
        });
      }
    );

    void channel.subscribe();
    return () => {
      void channel.unsubscribe();
    };
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

  hasSalaryPaymentForMonth: (employeeId: string, month: number, year: number) => {
    return get().salaryPayments.some(
      (p) => p.employeeId === employeeId && p.month === month && p.year === year
    );
  },

  getSalaryPaymentById: (id) => get().salaryPayments.find((payment) => payment.id === id),

  

  createSalaryPayment: async (paymentData) => {
    if (!paymentData.employeeId || !paymentData.employeeName) {
      throw new Error('Funcionário inválido para pagamento');
    }
    if (!paymentData.method) {
      throw new Error('Método de pagamento é obrigatório');
    }
    if (!Number.isFinite(paymentData.amount) || paymentData.amount <= 0) {
      throw new Error('Valor de pagamento inválido');
    }
    if (!Number.isInteger(paymentData.month) || !Number.isInteger(paymentData.year)) {
      throw new Error('Mês/ano de pagamento inválidos');
    }

    if (get().hasSalaryPaymentForMonth(paymentData.employeeId, paymentData.month, paymentData.year)) {
      throw new Error('Funcionário já possui pagamento registrado neste mês/ano');
    }

    const { currentUser, addAuditLog } = useStore.getState();
    const paidAt = paymentData.paidAt ?? paymentData.date ?? new Date();
    const payload: SalaryPayment = {
      id: crypto.randomUUID(),
      ...paymentData,
      paidAt,
      date: paidAt,
      createdBy: currentUser?.id,
      createdAt: new Date(),
    };

    const insertPayload = { ...payload } as Partial<SalaryPayment>;
    delete (insertPayload as Record<string, unknown>).date;
    delete (insertPayload as Record<string, unknown>).employeeName;

    try {
      const created = await dataProvider.create<SalaryPayment>('salaryPayments', insertPayload as SalaryPayment);
      const normalized = normalizeSalaryPayment({
        ...created,
        employeeName: paymentData.employeeName,
        createdBy: payload.createdBy,
      } as SalaryPayment);
      set((state) => ({ salaryPayments: [normalized, ...state.salaryPayments] }));

      // Registra também como despesa (folha) para aparecer no financeiro
      try {
        const expensePayload: ExpenseInput = {
          description: `Salário de ${normalized.employeeName} (${normalized.month + 1}/${normalized.year})`,
          amount: normalized.amount,
          type: 'salary',
          date: normalized.date,
          createdBy: payload.createdBy,
        };
        await get().createExpense(expensePayload);
      } catch (err) {
        console.error('Falha ao registrar despesa de salário:', err);
      }

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

  subscribeToSalaryPayments: () => {
    const channel = supabase.channel('salary-payments-realtime');
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'salary_payments' },
      (payload) => {
        const raw = (payload.new ?? payload.old) as Record<string, unknown>;
        if (!raw?.id) return;
        const parsed = convertKeysToCamelCase(raw) as SalaryPayment;

        const employeeName =
          parsed.employeeName ||
          useEmployeeStore.getState().getEmployeeById(parsed.employeeId)?.name ||
          parsed.employeeId;

        const normalized = normalizeSalaryPayment({ ...parsed, employeeName } as SalaryPayment);

        set((state) => {
          if (payload.eventType === 'DELETE') {
            return { salaryPayments: state.salaryPayments.filter((p) => p.id !== normalized.id) };
          }
          const exists = state.salaryPayments.some((p) => p.id === normalized.id);
          const salaryPayments = exists
            ? state.salaryPayments.map((p) => (p.id === normalized.id ? normalized : p))
            : [normalized, ...state.salaryPayments];
          return { salaryPayments };
        });
      }
    );

    void channel.subscribe();
    return () => {
      void channel.unsubscribe();
    };
  },
}));

// Bootstrap realtime + carga inicial para pagamentos de salário
let salaryPaymentsRealtimeUnsubscribe: (() => void) | null = null;
let expensesRealtimeUnsubscribe: (() => void) | null = null;

const bootstrapFinance = () => {
  const state = useFinanceStore.getState();
  void state.listExpenses().catch((error) => console.error('Failed to load expenses:', error));
  void state.listSalaryPayments().catch((error) => console.error('Failed to load salary payments:', error));
  if (!expensesRealtimeUnsubscribe) expensesRealtimeUnsubscribe = state.subscribeToExpenses();
  if (!salaryPaymentsRealtimeUnsubscribe) salaryPaymentsRealtimeUnsubscribe = state.subscribeToSalaryPayments();
};
bootstrapFinance();
