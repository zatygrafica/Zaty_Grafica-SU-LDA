/**
 * IndexedDB Cache Service
 * Provides offline-first caching for users and other data
 */

const DB_NAME = 'zaty-cache';
const DB_VERSION = 1;
const USERS_STORE = 'users';
const METADATA_STORE = 'metadata';

interface CacheMetadata {
  key: string;
  timestamp: number;
  expiresAt: number;
}

interface CachedUser {
  id: string;
  data: unknown;
  timestamp: number;
}

class CacheService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[CacheService] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create users store
        if (!db.objectStoreNames.contains(USERS_STORE)) {
          const usersStore = db.createObjectStore(USERS_STORE, { keyPath: 'id' });
          usersStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
        }
      };
    });

    return this.dbPromise;
  }

  async cacheUsers(users: unknown[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction([USERS_STORE, METADATA_STORE], 'readwrite');
      const usersStore = tx.objectStore(USERS_STORE);
      const metadataStore = tx.objectStore(METADATA_STORE);

      const timestamp = Date.now();

      // Clear old users
      await new Promise<void>((resolve, reject) => {
        const clearRequest = usersStore.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });

      // Store new users
      for (const user of users) {
        const cachedUser: CachedUser = {
          id: (user as { id: string }).id,
          data: user,
          timestamp,
        };
        usersStore.put(cachedUser);
      }

      // Update metadata
      const metadata: CacheMetadata = {
        key: 'users_last_update',
        timestamp,
        expiresAt: timestamp + 24 * 60 * 60 * 1000, // 24 hours
      };
      metadataStore.put(metadata);

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      console.log(`[CacheService] Successfully cached ${users.length} users`);
    } catch (error) {
      console.error('[CacheService] Failed to cache users:', error);
      // Don't throw - caching is optional
    }
  }

  async getCachedUsers(): Promise<unknown[] | null> {
    try {
      const db = await this.getDB();
      const tx = db.transaction([USERS_STORE, METADATA_STORE], 'readonly');
      const usersStore = tx.objectStore(USERS_STORE);
      const metadataStore = tx.objectStore(METADATA_STORE);

      // Check if cache is still valid
      const metadataRequest = metadataStore.get('users_last_update');
      const metadata = await new Promise<CacheMetadata | undefined>((resolve) => {
        metadataRequest.onsuccess = () => resolve(metadataRequest.result);
        metadataRequest.onerror = () => resolve(undefined);
      });

      if (!metadata || metadata.expiresAt < Date.now()) {
        console.log('[CacheService] Cache expired or missing');
        return null;
      }

      // Get all users
      const usersRequest = usersStore.getAll();
      const cachedUsers = await new Promise<CachedUser[]>((resolve, reject) => {
        usersRequest.onsuccess = () => resolve(usersRequest.result || []);
        usersRequest.onerror = () => reject(usersRequest.error);
      });

      const users = cachedUsers.map((cu) => cu.data);
      console.log(`[CacheService] Retrieved ${users.length} users from cache`);
      return users;
    } catch (error) {
      console.error('[CacheService] Failed to get cached users:', error);
      return null;
    }
  }

  async clearCache(): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction([USERS_STORE, METADATA_STORE], 'readwrite');

      await Promise.all([
        new Promise<void>((resolve, reject) => {
          const request = tx.objectStore(USERS_STORE).clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
        new Promise<void>((resolve, reject) => {
          const request = tx.objectStore(METADATA_STORE).clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
      ]);

      console.log('[CacheService] Cache cleared successfully');
    } catch (error) {
      console.error('[CacheService] Failed to clear cache:', error);
    }
  }
}

export const cacheService = new CacheService();
