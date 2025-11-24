import { create } from 'zustand';
import type { Invoice, Order } from '../types';
import { supabaseDataProvider as dataProvider } from '../services/supabaseDataProvider';
import { useStore } from './useStore';
import { useOrderStore } from './useOrderStore';

type InvoiceInput = Omit<Invoice, 'id' | 'createdAt'>;

const normalizeOrder = (order?: Order): Order | undefined => {
  if (!order) return undefined;
  return {
    ...order,
    items: order.items?.map((item) => ({ ...item })) ?? [],
    createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
    updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),
  };
};

const normalizeInvoice = (invoice: Invoice): Invoice => {
  const existingOrder =
    invoice.order ??
    useOrderStore
      .getState()
      .orders.find((o) => o.id === invoice.orderId);
  return {
    ...invoice,
    order: normalizeOrder(existingOrder) as Order,
    createdAt: invoice.createdAt ? new Date(invoice.createdAt) : new Date(),
  };
};

interface InvoiceState {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  setInvoices: (invoices: Invoice[]) => void;
  listInvoices: () => Promise<Invoice[]>;
  loadInvoices: () => Promise<void>;
  getInvoiceById: (id: string) => Invoice | undefined;
  createInvoice: (invoice: InvoiceInput) => Promise<Invoice>;
  addInvoice: (invoice: InvoiceInput) => Promise<Invoice>;
  deleteInvoiceById: (id: string) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  loading: false,
  error: null,
  hasLoaded: false,

  setInvoices: (invoices) => set({ invoices }),

  listInvoices: async () => {
    try {
      const invoices = await dataProvider.list<Invoice>('invoices');
      const normalized = invoices.map(normalizeInvoice);
      set({ invoices: normalized });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  loadInvoices: async () => {
    if (get().hasLoaded || get().loading) return;
    set({ loading: true, error: null });
    try {
      await get().listInvoices();
      set({ loading: false, hasLoaded: true });
    } catch (error) {
      set({ loading: false, hasLoaded: false, error: (error as Error).message });
    }
  },

  getInvoiceById: (id) => get().invoices.find((invoice) => invoice.id === id),

  createInvoice: async (invoiceData) => {
    const { addAuditLog } = useStore.getState();
    const { order: orderPayload, ...rest } = invoiceData;
    const payload = { ...rest, createdAt: new Date() } as Invoice;
    try {
      const created = await dataProvider.create<Invoice>('invoices', payload);
      const normalized = normalizeInvoice({ ...created, order: orderPayload });
      set((state) => ({ invoices: [normalized, ...state.invoices] }));
      addAuditLog({ action: 'generate_invoice', resourceType: 'Invoice', resourceId: normalized.id });
      await useOrderStore.getState().markOrderAsInvoiced?.(normalized.orderId);
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addInvoice: async (invoiceData) => get().createInvoice(invoiceData),

  deleteInvoiceById: async (id) => {
    const { addAuditLog } = useStore.getState();
    try {
      await dataProvider.delete('invoices', id);
      set((state) => ({
        invoices: state.invoices.filter((invoice) => invoice.id !== id),
      }));
      addAuditLog({ action: 'delete', resourceType: 'Invoice', resourceId: id });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteInvoice: async (id) => get().deleteInvoiceById(id),
}));
