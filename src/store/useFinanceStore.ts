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
  setSalaryPayments: (payments: SalaryPayment[]) => void;
  listSalaryPayments: () => Promise<SalaryPayment[]>;
  getSalaryPaymentById: (id: string) => SalaryPayment | undefined;
  createSalaryPayment: (payment: SalaryPaymentInput) => Promise<SalaryPayment>;
  addSalaryPayment: (payment: SalaryPaymentInput) => Promise<SalaryPayment>;
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
}));
