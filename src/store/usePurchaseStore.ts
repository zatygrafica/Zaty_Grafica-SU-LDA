import { create } from 'zustand';
import type { Purchase, Expense } from '../types';
import { supabaseDataProvider as dataProvider } from '../services/supabaseDataProvider';
import { useMaterialStore } from './useMaterialStore';
import { useFinanceStore } from './useFinanceStore';
import { useStore } from './useStore';
import i18n from '../i18n';

type PurchaseInput = Omit<Purchase, 'id' | 'createdAt' | 'createdBy'>;

const normalizePurchase = (purchase: Purchase): Purchase => ({
  ...purchase,
  date: purchase.date ? new Date(purchase.date) : new Date(),
  createdAt: purchase.createdAt ? new Date(purchase.createdAt) : new Date(),
});

interface PurchaseState {
  purchases: Purchase[];
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  setPurchases: (purchases: Purchase[]) => void;
  listPurchases: () => Promise<Purchase[]>;
  loadPurchases: () => Promise<void>;
  getPurchaseById: (id: string) => Purchase | undefined;
  createPurchase: (purchaseData: PurchaseInput) => Promise<Purchase>;
  addPurchase: (purchaseData: PurchaseInput) => Promise<Purchase>;
  deletePurchaseById: (id: string) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
}

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  purchases: [],
  loading: false,
  error: null,
  hasLoaded: false,

  setPurchases: (purchases) => set({ purchases }),

  listPurchases: async () => {
    try {
      const purchases = await dataProvider.list<Purchase>('purchases');
      const normalized = purchases.map(normalizePurchase);
      set({ purchases: normalized });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  loadPurchases: async () => {
    if (get().hasLoaded || get().loading) return;
    set({ loading: true, error: null });
    try {
      await get().listPurchases();
      set({ loading: false, hasLoaded: true });
    } catch (error) {
      set({ loading: false, hasLoaded: false, error: (error as Error).message });
    }
  },

  getPurchaseById: (id) => get().purchases.find((purchase) => purchase.id === id),

  createPurchase: async (purchaseData) => {
    const { currentUser, addAuditLog } = useStore.getState();
    const payload: Purchase = {
      id: crypto.randomUUID(),
      ...purchaseData,
      createdBy: purchaseData.createdBy ?? currentUser?.id,
      createdAt: new Date(),
    };

    try {
      const created = await dataProvider.create<Purchase>('purchases', payload);
      const normalized = normalizePurchase(created);
      set((state) => ({ purchases: [normalized, ...state.purchases] }));
      addAuditLog({ action: 'create', resourceType: 'Purchase', resourceId: normalized.id });

      const materialStore = useMaterialStore.getState();
      const material = materialStore.getMaterialById(normalized.materialId);
      if (material) {
        await materialStore.updateMaterial(material.id, { currentStock: material.currentStock + normalized.quantity });
        await materialStore.addStockMovement({
          materialId: normalized.materialId,
          quantity: normalized.quantity,
          type: 'addition_purchase',
          referenceId: normalized.id,
          createdAt: new Date(),
        });
      }

      const unitLabel = material ? i18n.t(`materials.units.${material.unit}`) : '';
      const newExpense: Omit<Expense, 'id' | 'createdAt'> = {
        description: `Compra de ${normalized.quantity}${unitLabel} de ${normalized.materialName}`,
        amount: normalized.total,
        type: 'purchase',
        date: normalized.date,
        createdBy: currentUser?.id,
        referenceId: normalized.id,
      };
      await useFinanceStore.getState().addExpense(newExpense);

      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addPurchase: async (purchaseData) => get().createPurchase(purchaseData),

  deletePurchaseById: async (id) => {
    const { addAuditLog } = useStore.getState();
    try {
      await dataProvider.delete('purchases', id);
      set((state) => ({
        purchases: state.purchases.filter((purchase) => purchase.id !== id),
      }));
      addAuditLog({ action: 'delete', resourceType: 'Purchase', resourceId: id });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deletePurchase: async (id) => get().deletePurchaseById(id),
}));
