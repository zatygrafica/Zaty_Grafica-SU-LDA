import { create } from 'zustand';
import type { Order } from '../types';
import { supabaseDataProvider as dataProvider } from '../services/supabaseDataProvider';
import { useStore } from './useStore';

type OrderInput = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;

const normalizeOrder = (order: Order): Order => ({
  ...order,
  items: order.items?.map((item) => ({ ...item })) ?? [],
  createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
  updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),
});

interface OrderState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  setOrders: (orders: Order[]) => void;
  listOrders: () => Promise<Order[]>;
  loadOrders: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  createOrder: (order: OrderInput) => Promise<Order>;
  addOrder: (order: OrderInput) => Promise<Order>;
  updateOrderById: (id: string, order: Partial<Omit<Order, 'id'>>) => Promise<Order | undefined>;
  updateOrder: (id: string, order: Partial<Omit<Order, 'id'>>) => Promise<Order | undefined>;
  deleteOrderById: (id: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  markOrderAsInvoiced: (id: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,
  hasLoaded: false,

  setOrders: (orders) => set({ orders }),

  listOrders: async () => {
    try {
      const orders = await dataProvider.list<Order>('orders');
      const normalized = orders.map(normalizeOrder);
      set({ orders: normalized });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  loadOrders: async () => {
    if (get().hasLoaded || get().loading) return;
    set({ loading: true, error: null });
    try {
      await get().listOrders();
      set({ loading: false, hasLoaded: true });
    } catch (error) {
      set({ loading: false, hasLoaded: false, error: (error as Error).message });
    }
  },

  getOrderById: (id) => get().orders.find((order) => order.id === id),

  createOrder: async (orderData) => {
    const { currentUser, addAuditLog } = useStore.getState();
    const payload = {
      ...orderData,
      createdBy: orderData.createdBy ?? currentUser?.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Order;

    try {
      const created = await dataProvider.create<Order>('orders', payload);
      const normalized = normalizeOrder(created);
      set((state) => ({ orders: [normalized, ...state.orders] }));
      addAuditLog({ action: 'create', resourceType: 'Order', resourceId: normalized.id });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addOrder: async (orderData) => get().createOrder(orderData),

  updateOrderById: async (id, orderUpdate) => {
    const { addAuditLog } = useStore.getState();
    const payload = { ...orderUpdate, updatedAt: new Date() };
    try {
      const updated = await dataProvider.update<Order>('orders', id, payload);
      if (!updated) return undefined;
      const normalized = normalizeOrder(updated);
      set((state) => ({
        orders: state.orders.map((order) => (order.id === id ? normalized : order)),
      }));
      addAuditLog({ action: 'update', resourceType: 'Order', resourceId: id });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateOrder: async (id, orderUpdate) => get().updateOrderById(id, orderUpdate),

  deleteOrderById: async (id) => {
    const { addAuditLog } = useStore.getState();
    try {
      await dataProvider.delete('orders', id);
      set((state) => ({
        orders: state.orders.filter((order) => order.id !== id),
      }));
      addAuditLog({ action: 'delete', resourceType: 'Order', resourceId: id });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteOrder: async (id) => get().deleteOrderById(id),

  markOrderAsInvoiced: async (id) => {
    await get().updateOrder(id, { invoiceGenerated: true });
  },
}));
