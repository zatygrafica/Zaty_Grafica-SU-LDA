import { create } from 'zustand';
import type { Material, StockMovement } from '../types';
import { resilientDataProvider as dataProvider } from '../services/resilientDataProvider';
import { useStore } from './useStore';

type MaterialInput = Omit<Material, 'id' | 'createdAt' | 'updatedAt' | 'currentStock'> & { currentStock?: number };

const normalizeMaterial = (material: Material): Material => ({
  ...material,
  createdAt: material.createdAt ? new Date(material.createdAt) : new Date(),
  updatedAt: material.updatedAt ? new Date(material.updatedAt) : new Date(),
});

const normalizeMovement = (movement: StockMovement): StockMovement => ({
  ...movement,
  type: (movement as any).type ?? (movement as any).movementType ?? movement.type,
  createdAt: movement.createdAt ? new Date(movement.createdAt) : new Date(),
});

interface MaterialState {
  materials: Material[];
  stockMovements: StockMovement[];
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  setMaterials: (materials: Material[]) => void;
  listMaterials: () => Promise<Material[]>;
  loadMaterials: () => Promise<void>;
  getMaterialById: (id: string) => Material | undefined;
  createMaterial: (material: MaterialInput) => Promise<Material>;
  addMaterial: (material: Material) => Promise<Material>;
  updateMaterialById: (id: string, material: Partial<Omit<Material, 'id'>>) => Promise<Material | undefined>;
  updateMaterial: (id: string, material: Partial<Omit<Material, 'id'>>) => Promise<Material | undefined>;
  deleteMaterialById: (id: string) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  zeroStock: (id: string) => Promise<void>;
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'materialName'>) => Promise<StockMovement | undefined>;
  deductStock: (materialId: string, quantity: number, orderId: string, details?: string) => Promise<void>;
}

export const useMaterialStore = create<MaterialState>((set, get) => ({
  materials: [],
  stockMovements: [],
  loading: false,
  error: null,
  hasLoaded: false,

  setMaterials: (materials) => set({ materials }),

  listMaterials: async () => {
    try {
      const materials = await dataProvider.list<Material>('materials');
      const normalized = materials.map(normalizeMaterial);
      set({ materials: normalized });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  loadMaterials: async () => {
    if (get().hasLoaded || get().loading) return;
    set({ loading: true, error: null });
    try {
      await get().listMaterials();
      set({ loading: false, hasLoaded: true });
    } catch (error) {
      set({ loading: false, hasLoaded: false, error: (error as Error).message });
    }
  },

  getMaterialById: (id) => get().materials.find((material) => material.id === id),

  createMaterial: async (materialData) => {
    const { addAuditLog } = useStore.getState();
    const payload: Material = {
      id: crypto.randomUUID(),
      ...materialData,
      currentStock: materialData.currentStock ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const created = await dataProvider.create<Material>('materials', payload);
      const normalized = normalizeMaterial(created);
      set((state) => ({ materials: [normalized, ...state.materials] }));
      addAuditLog({ action: 'create', resourceType: 'Material', resourceId: normalized.id });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addMaterial: async (material) => get().createMaterial(material),

  updateMaterialById: async (id, materialUpdate) => {
    const { addAuditLog } = useStore.getState();
    const payload = { ...materialUpdate, updatedAt: new Date() };
    try {
      const updated = await dataProvider.update<Material>('materials', id, payload);
      if (!updated) return undefined;
      const normalized = normalizeMaterial(updated);
      set((state) => ({
        materials: state.materials.map((material) => (material.id === id ? normalized : material)),
      }));
      addAuditLog({ action: 'update', resourceType: 'Material', resourceId: id });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateMaterial: async (id, materialUpdate) => get().updateMaterialById(id, materialUpdate),

  deleteMaterialById: async (id) => {
    const { addAuditLog } = useStore.getState();
    try {
      await dataProvider.delete('materials', id);
      set((state) => ({
        materials: state.materials.filter((material) => material.id !== id),
      }));
      addAuditLog({ action: 'delete', resourceType: 'Material', resourceId: id });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteMaterial: async (id) => get().deleteMaterialById(id),

  zeroStock: async (id) => {
    await get().updateMaterial(id, { currentStock: 0 });
    useStore.getState().addAuditLog({ action: 'zero_stock', resourceType: 'Material', resourceId: id });
  },

 addStockMovement: async (movementData) => {
    const material = get().materials.find((m) => m.id === movementData.materialId);
    if (!material) return undefined;

    const now = new Date();
    const id = crypto.randomUUID();
    const rawType = movementData.type ?? 'addition_purchase';
    // Compatibiliza com enum/check do banco ('addition' | 'deduction' | 'adjustment')
    const normalizedType =
      rawType.toLowerCase().includes('deduct') ? 'deduction' :
      rawType.toLowerCase().includes('adjust') ? 'adjustment' :
      'addition';

    // payload para o banco (sem materialName, já que a tabela não tem essa coluna; usa movement_type)
    const dbPayload = {
      id,
      materialId: movementData.materialId,
      quantity: movementData.quantity,
      movement_type: normalizedType,
      referenceId: movementData.referenceId,
      details: movementData.details,
      createdAt: movementData.createdAt ?? now,
    };
    try {
      const created = await dataProvider.create<StockMovement>('stockMovements', dbPayload as StockMovement);
      // enriquece em memória com materialName para uso no app
      const normalized = normalizeMovement({ ...created, materialName: material.name, type: normalizedType });
      set((state) => ({ stockMovements: [normalized, ...state.stockMovements] }));
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deductStock: async (materialId, quantity, orderId, details) => {
    const material = get().materials.find((m) => m.id === materialId);
    if (!material) return;

    const newStock = material.currentStock - quantity;
    await get().updateMaterial(material.id, { currentStock: newStock });
    await get().addStockMovement({
      materialId,
      quantity: -quantity,
      type: 'deduction_order',
      referenceId: orderId,
      details,
      createdAt: new Date(),
    });

    if (newStock < 10 && material.currentStock >= 10) {
      useStore.getState().addNotification({
        id: crypto.randomUUID(),
        type: 'warning',
        title: 'Estoque Baixo',
        message: `O material "${material.name}" está com estoque baixo (${newStock.toFixed(2)}).`,
        read: false,
        createdAt: new Date(),
      });
    }
  },
}));
