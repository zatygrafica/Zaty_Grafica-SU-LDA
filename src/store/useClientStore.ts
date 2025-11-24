import { create } from 'zustand';
import type { Client } from '../types';
import { supabaseDataProvider as dataProvider } from '../services/supabaseDataProvider';
import { useStore } from './useStore';

type ClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;

const normalizeClient = (client: Client): Client => ({
  ...client,
  createdAt: client.createdAt ? new Date(client.createdAt) : new Date(),
  updatedAt: client.updatedAt ? new Date(client.updatedAt) : new Date(),
});

interface ClientState {
  clients: Client[];
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  setClients: (clients: Client[]) => void;
  listClients: () => Promise<Client[]>;
  loadClients: () => Promise<void>;
  getClientById: (id: string) => Client | undefined;
  createClient: (client: ClientInput) => Promise<Client>;
  addClient: (client: ClientInput) => Promise<Client>;
  updateClientById: (id: string, client: Partial<Client>) => Promise<Client | undefined>;
  updateClient: (id: string, client: Partial<Client>) => Promise<Client | undefined>;
  deleteClientById: (id: string) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  transferClients: (
    fromUserId: string,
    fromUserName: string,
    toUserId: string,
    options: { onProgress: (progress: number) => void; signal: AbortSignal }
  ) => Promise<{ success: boolean; transferredCount: number }>;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  loading: false,
  error: null,
  hasLoaded: false,

  setClients: (clients) => set({ clients }),

  listClients: async () => {
    try {
      const clients = await dataProvider.list<Client>('clients');
      const normalized = clients.map(normalizeClient);
      set({ clients: normalized });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  loadClients: async () => {
    if (get().loading || get().hasLoaded) return;
    set({ loading: true, error: null });
    try {
      await get().listClients();
      set({ loading: false, hasLoaded: true });
    } catch (error) {
      set({ loading: false, hasLoaded: false, error: (error as Error).message });
    }
  },

  getClientById: (id) => get().clients.find((client) => client.id === id),

  createClient: async (clientData) => {
    const { addAuditLog, currentUser } = useStore.getState();
    const payload = {
      ...clientData,
      createdBy: clientData.createdBy ?? currentUser?.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Client;

    try {
      const created = await dataProvider.create<Client>('clients', payload);
      const normalized = normalizeClient(created);
      set((state) => ({ clients: [normalized, ...state.clients] }));
      addAuditLog({ action: 'create', resourceType: 'Client', resourceId: normalized.id });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addClient: async (clientData) => get().createClient(clientData),

  updateClientById: async (id, clientUpdate) => {
    const { addAuditLog } = useStore.getState();
    const action = clientUpdate.transferredFrom ? 'transfer' : 'update';
    const payload = { ...clientUpdate, updatedAt: new Date() };

    try {
      const updated = await dataProvider.update<Client>('clients', id, payload);
      if (!updated) return undefined;
      const normalized = normalizeClient(updated);
      set((state) => ({
        clients: state.clients.map((client) => (client.id === id ? normalized : client)),
      }));
      addAuditLog({ action, resourceType: 'Client', resourceId: id });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateClient: async (id, clientUpdate) => get().updateClientById(id, clientUpdate),

  deleteClientById: async (id) => {
    const { addAuditLog } = useStore.getState();
    try {
      await dataProvider.delete('clients', id);
      set((state) => ({
        clients: state.clients.filter((client) => client.id !== id),
      }));
      addAuditLog({ action: 'delete', resourceType: 'Client', resourceId: id });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteClient: async (id) => get().deleteClientById(id),

  transferClients: async (fromUserId, fromUserName, toUserId, { onProgress, signal }) => {
    try {
      await get().loadClients();
      const clientsToTransfer = get().clients.filter((c) => c.createdBy === fromUserId);
      if (clientsToTransfer.length === 0) {
        onProgress(100);
        return { success: true, transferredCount: 0 };
      }

      let transferredCount = 0;

      for (let i = 0; i < clientsToTransfer.length; i++) {
        if (signal.aborted) {
          throw new Error('Cancelled');
        }

        const clientToUpdate = clientsToTransfer[i];
        const updatePayload = {
          createdBy: toUserId,
          transferredFrom: fromUserName,
          transferredAt: new Date(),
        } as Partial<Client>;

        await get().updateClient(clientToUpdate.id, updatePayload);
        transferredCount++;

        await new Promise((resolve) => setTimeout(resolve, 50));
        onProgress(((i + 1) / clientsToTransfer.length) * 100);
      }

      return { success: true, transferredCount };
    } catch (error) {
      if ((error as Error).message === 'Cancelled') {
        return { success: false, transferredCount: 0 };
      }
      set({ error: (error as Error).message });
      throw error;
    }
  },
}));
