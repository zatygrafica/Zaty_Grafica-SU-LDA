import { cleanupStorage } from './storageCleanup';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length' | 'clear'>;

const createMemoryStorage = (): StorageLike => {
  let memory: Record<string, string> = {};

  return {
    get length() {
      return Object.keys(memory).length;
    },
    clear() {
      memory = {};
    },
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
    },
    key(index: number) {
      return Object.keys(memory)[index] ?? null;
    },
    removeItem(key: string) {
      delete memory[key];
    },
    setItem(key: string, value: string) {
      memory[key] = value;
    },
  };
};

const isWritable = (storage: StorageLike): boolean => {
  const testKey = '__sb_storage_test__';
  try {
    storage.setItem(testKey, 'ok');
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('[Storage] Storage provider is not writable, falling back.', error);
    return false;
  }
};

/**
 * Resilient storage used by Supabase auth:
 * - Prefers localStorage
 * - Falls back to sessionStorage if localStorage is blocked/cheio
 * - Falls back to in-memory storage as last resort (no persistence across reload)
 */
export const createResilientStorage = (): StorageLike => {
  if (typeof window === 'undefined') {
    return createMemoryStorage();
  }

  const memoryStorage = createMemoryStorage();
  const providers: { name: string; storage: StorageLike }[] = [];

  try {
    providers.push({ name: 'localStorage', storage: window.localStorage });
  } catch {
    /* ignore */
  }

  try {
    providers.push({ name: 'sessionStorage', storage: window.sessionStorage });
  } catch {
    /* ignore */
  }

  let active: StorageLike = memoryStorage;

  for (const candidate of providers) {
    if (isWritable(candidate.storage)) {
      active = candidate.storage;
      break;
    }

    if (candidate.name === 'localStorage') {
      // Se o localStorage estiver cheio, tente limpar e testar novamente
      cleanupStorage();
      if (isWritable(candidate.storage)) {
        active = candidate.storage;
        break;
      }
    }
  }

  const trySet = (target: StorageLike, name: string, key: string, value: string): boolean => {
    try {
      target.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`[Storage] Failed to write on ${name}`, error);
      return false;
    }
  };

  const fallbackAndPersist = (key: string, value: string) => {
    for (const candidate of providers) {
      if (candidate.storage === active) continue;

      // Try to write to this candidate
      if (trySet(candidate.storage, candidate.name, key, value)) {
        console.warn(`[Storage] Switching to ${candidate.name} fallback for Supabase auth.`);
        active = candidate.storage;
        return;
      }

      // If candidate is sessionStorage and it's full, try clearing it
      if (candidate.name === 'sessionStorage') {
        console.warn('[Storage] sessionStorage full, clearing it...');
        try {
          sessionStorage.clear();
          if (trySet(candidate.storage, candidate.name, key, value)) {
            console.log('[Storage] Successfully saved after clearing sessionStorage');
            active = candidate.storage;
            return;
          }
        } catch (clearError) {
          console.error('[Storage] Even clearing sessionStorage failed:', clearError);
        }
      }
    }

    console.warn('[Storage] Falling back to in-memory storage for Supabase auth (no persistence across reload).');
    active = memoryStorage;
    active.setItem(key, value);
  };

  const setItemSafe = (key: string, value: string) => {
    try {
      active.setItem(key, value);
      return;
    } catch (error) {
      // If localStorage is active, try to clean it up and retry once
      if (providers.find((candidate) => candidate.storage === active && candidate.name === 'localStorage')) {
        console.warn('[Storage] localStorage full, attempting cleanup...');
        cleanupStorage();
        if (trySet(active, 'localStorage', key, value)) {
          return;
        }

        // If still failing, clear EVERYTHING and retry
        console.error('[Storage] Cleanup failed, clearing ALL localStorage');
        try {
          localStorage.clear();
          if (trySet(active, 'localStorage', key, value)) {
            console.log('[Storage] Successfully saved after clearing localStorage');
            return;
          }
        } catch (clearError) {
          console.error('[Storage] Even clearing localStorage failed:', clearError);
        }
      }

      console.error('[Storage] Failed to persist auth token, using fallback storage.', error);
      fallbackAndPersist(key, value);
      return;
    }
  };

  return {
    get length() {
      return active.length;
    },
    clear() {
      try {
        active.clear();
      } catch (error) {
        console.warn('[Storage] Clear failed, switching to memory storage.', error);
        active = memoryStorage;
        active.clear();
      }
    },
    getItem(key: string) {
      try {
        return active.getItem(key);
      } catch (error) {
        console.warn('[Storage] Read failed, switching to memory storage.', error);
        active = memoryStorage;
        return active.getItem(key);
      }
    },
    key(index: number) {
      try {
        return active.key(index);
      } catch (error) {
        console.warn('[Storage] key() failed, switching to memory storage.', error);
        active = memoryStorage;
        return active.key(index);
      }
    },
    removeItem(key: string) {
      try {
        active.removeItem(key);
      } catch (error) {
        console.warn('[Storage] removeItem failed, switching to memory storage.', error);
        active = memoryStorage;
        active.removeItem(key);
      }
    },
    setItem: setItemSafe,
  };
};
