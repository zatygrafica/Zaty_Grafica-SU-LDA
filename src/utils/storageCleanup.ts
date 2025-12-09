/**
 * Storage Cleanup Utility
 *
 * Prevents localStorage quota exceeded errors by cleaning up old/unnecessary data
 * See: docs/STORAGE_QUOTA_FIX.md for full documentation
 */

/**
 * Calculate the current size of localStorage in KB
 */
export const getLocalStorageSize = (): number => {
  let totalSize = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const value = localStorage.getItem(key);
      if (value) {
        // 2 bytes per character in UTF-16
        totalSize += (key.length + value.length) * 2;
      }
    }
  } catch (error) {
    console.error('[StorageCleanup] Error calculating size:', error);
  }

  return totalSize / 1024; // Return in KB
};

/**
 * Clean up old and unnecessary keys from localStorage
 *
 * This function:
 * 1. Removes old Supabase keys that are not the current auth token
 * 2. Removes temporary/cache keys
 * 3. Logs what was cleaned up
 */
export const cleanupStorage = (): void => {
  try {
    const keysToRemove: string[] = [];
    const sizeBefore = getLocalStorageSize();

    // Identify keys to remove
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Remove old Supabase keys that are not the current auth token
      if (key.startsWith('sb-') && !key.includes('auth-token')) {
        keysToRemove.push(key);
      }

      // Remove temporary data
      if (key.startsWith('temp-') || key.startsWith('cache-')) {
        keysToRemove.push(key);
      }
    }

    // Remove identified keys
    keysToRemove.forEach(key => {
      console.log('[StorageCleanup] Removing old key:', key);
      localStorage.removeItem(key);
    });

    const sizeAfter = getLocalStorageSize();
    const savedKB = sizeBefore - sizeAfter;

    console.log(`[StorageCleanup] Cleaned up ${keysToRemove.length} keys, freed ${savedKB.toFixed(2)} KB`);
    console.log(`[StorageCleanup] Storage usage: ${sizeAfter.toFixed(2)} KB / ~5120 KB limit (${((sizeAfter / 5120) * 100).toFixed(1)}%)`);

    // Warn if still above 80%
    if (sizeAfter > 4096) {
      console.warn('[StorageCleanup] ⚠️ Storage usage above 80%! Consider clearing all storage.');
    }
  } catch (error) {
    console.error('[StorageCleanup] Cleanup failed:', error);
  }
};

/**
 * Emergency cleanup: clear all storage and reload
 * Only use when quota is exceeded and normal cleanup doesn't work
 */
export const emergencyStorageClear = (): void => {
  console.warn('[StorageCleanup] Emergency cleanup initiated - clearing all storage');
  try {
    localStorage.clear();
    sessionStorage.clear();
    console.log('[StorageCleanup] Storage cleared, reloading page...');
    window.location.reload();
  } catch (error) {
    console.error('[StorageCleanup] Emergency cleanup failed:', error);
    alert('Erro crítico de armazenamento. Por favor, limpe o cache do navegador manualmente.');
  }
};

/**
 * Safe storage setter with quota error handling
 * Wraps localStorage.setItem with automatic cleanup on quota errors
 */
export const safeStorageSet = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error instanceof Error &&
        (error.message.includes('quota') || error.message.includes('Storage'))) {
      console.error('[StorageCleanup] Quota exceeded, attempting cleanup...');

      // Try cleanup first
      cleanupStorage();

      // Try again
      try {
        localStorage.setItem(key, value);
        console.log('[StorageCleanup] Successfully saved after cleanup');
        return true;
      } catch (retryError) {
        console.error('[StorageCleanup] Still failing after cleanup, emergency clear needed');
        emergencyStorageClear();
        return false;
      }
    }

    console.error('[StorageCleanup] Storage error:', error);
    return false;
  }
};

/**
 * Monitor storage usage (useful for debugging)
 * Call this in development to track storage growth
 */
export const monitorStorage = (intervalSeconds: number = 5): () => void => {
  const intervalId = setInterval(() => {
    const usedKB = getLocalStorageSize();
    const limitKB = 5120; // ~5MB
    const percent = (usedKB / limitKB) * 100;

    console.log(`[Storage Monitor] ${usedKB.toFixed(2)} KB / ${limitKB} KB (${percent.toFixed(1)}%)`);

    if (percent > 80) {
      console.warn('[Storage Monitor] ⚠️ Storage usage above 80%! Consider cleanup.');
    }
  }, intervalSeconds * 1000);

  // Return cleanup function
  return () => clearInterval(intervalId);
};
