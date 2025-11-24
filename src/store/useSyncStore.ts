import { create } from 'zustand';
import { SyncOperation, SyncStatus } from '../types';
import { generateId } from '../utils/id';

interface SyncState {
  queue: SyncOperation[];
  status: SyncStatus;
  lastSync: Date | null;
  addOperation: (operation: Omit<SyncOperation, 'id' | 'timestamp'>) => void;
  processNextOperation: () => SyncOperation | undefined;
  setStatus: (status: SyncStatus) => void;
}

let syncTimeout: NodeJS.Timeout | null = null;

export const useSyncStore = create<SyncState>((set, get) => ({
  queue: [],
  status: 'idle',
  lastSync: null,
  addOperation: (operation) => {
    const newOp: SyncOperation = {
      ...operation,
      id: generateId(),
      timestamp: new Date(),
    };
    set((state) => ({
      queue: [...state.queue, newOp],
      status: 'syncing',
    }));
  },
  processNextOperation: () => {
    const queue = get().queue;
    if (queue.length === 0) {
      return undefined;
    }
    const [nextOperation, ...rest] = queue;
    set({ queue: rest });
    return nextOperation;
  },
  setStatus: (status) => {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
      syncTimeout = null;
    }

    if (status === 'synced' && get().queue.length === 0) {
      set({ status, lastSync: new Date() });
      syncTimeout = setTimeout(() => {
        set({ status: 'idle' });
      }, 3000);
    } else {
      set({ status });
    }
  },
}));
