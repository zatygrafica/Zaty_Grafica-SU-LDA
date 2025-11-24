import { useSyncStore } from '../store/useSyncStore';
import { SyncOperation } from '../types';
import { supabaseDataProvider, type ResourceName } from './supabaseDataProvider';

let isProcessing = false;

export const enqueueSyncOperation = (operation: Omit<SyncOperation, 'id' | 'timestamp'>) => {
  useSyncStore.getState().addOperation(operation);
  processSyncQueue();
};

const executeRemoteOperation = async (operation: SyncOperation) => {
  const resource = operation.resource as ResourceName;
  const { payload } = operation;
  switch (operation.type) {
    case 'create':
      await supabaseDataProvider.create(resource, payload as Record<string, unknown>);
      break;
    case 'update':
      const { id: updateId, changes } = (payload ?? {}) as { id?: string; changes?: Record<string, unknown> };
      if (!updateId) throw new Error('Missing id for update operation');
      await supabaseDataProvider.update(resource, updateId, changes ?? {});
      break;
    case 'delete':
      const { id: deleteId } = (payload ?? {}) as { id?: string };
      if (!deleteId) throw new Error('Missing id for delete operation');
      await supabaseDataProvider.delete(resource, deleteId);
      break;
    default:
      break;
  }
};

export const processSyncQueue = async () => {
  if (isProcessing) return;

  const { queue, setStatus, processNextOperation } = useSyncStore.getState();

  if (queue.length === 0) {
    if (useSyncStore.getState().status === 'syncing') {
      setStatus('synced');
    }
    return;
  }

  if (!navigator.onLine) {
    setStatus('error');
    return;
  }

  isProcessing = true;
  setStatus('syncing');

  const operation = processNextOperation();

  if (!operation) {
    isProcessing = false;
    return;
  }

  try {
    await executeRemoteOperation(operation);
    isProcessing = false;
    processSyncQueue();
  } catch (error) {
    console.error('Sync failed for operation:', operation, error);
    setStatus('error');
    isProcessing = false;
  }
};

window.addEventListener('online', processSyncQueue);
setInterval(processSyncQueue, 30000);
setTimeout(processSyncQueue, 2000);
