/**
 * Enhanced Storage Service with Image Preloading
 * Optimized for immediate avatar display and offline capability
 */

import { supabase } from './supabaseClient';

const DEFAULT_BUCKET = 'profile_photos';
const CACHE_EXPIRY_BUFFER = 30; // seconds buffer before expiry
const DEFAULT_EXPIRY = 3600; // 1 hour for images (longer than original 300s)

type SignedUrlEntry = {
  url: string;
  expiresAt: number;
  blob?: Blob; // Store blob for instant offline access
};

type PriorityLevel = 'high' | 'medium' | 'low';

interface PreloadTask {
  path: string;
  bucket: string;
  priority: PriorityLevel;
}

class StorageServiceOptimized {
  private signedUrlCache: Record<string, SignedUrlEntry> = {};
  private preloadQueue: PreloadTask[] = [];
  private isProcessingQueue = false;
  private blobCache: Map<string, string> = new Map(); // blob URL cache
  private pendingRequests: Map<string, Promise<string>> = new Map(); // Dedup concurrent requests

  constructor() {
    this.loadCacheFromStorage();
    this.startQueueProcessor();
  }

  /**
   * Load persisted cache from localStorage on initialization
   */
  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem('signedUrlCache');
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, SignedUrlEntry>;
        const now = this.nowSec();

        // Only restore non-expired entries
        Object.entries(parsed).forEach(([key, entry]) => {
          if (entry.expiresAt > now + CACHE_EXPIRY_BUFFER) {
            this.signedUrlCache[key] = entry;
          }
        });

        console.log('[StorageService] Loaded cache from localStorage:', Object.keys(this.signedUrlCache).length, 'entries');
      }
    } catch (error) {
      console.warn('[StorageService] Failed to load cache from localStorage:', error);
      localStorage.removeItem('signedUrlCache');
    }
  }

  /**
   * Persist cache to localStorage (with quota handling)
   */
  private persistCache(): void {
    try {
      const toStore: Record<string, Omit<SignedUrlEntry, 'blob'>> = {};

      // Only persist URLs, not blobs (too large for localStorage)
      Object.entries(this.signedUrlCache).forEach(([key, entry]) => {
        toStore[key] = {
          url: entry.url,
          expiresAt: entry.expiresAt,
        };
      });

      localStorage.setItem('signedUrlCache', JSON.stringify(toStore));
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('[StorageService] localStorage quota exceeded, clearing old cache');
        this.clearExpiredCache();
        try {
          const toStore: Record<string, Omit<SignedUrlEntry, 'blob'>> = {};
          Object.entries(this.signedUrlCache).forEach(([key, entry]) => {
            toStore[key] = { url: entry.url, expiresAt: entry.expiresAt };
          });
          localStorage.setItem('signedUrlCache', JSON.stringify(toStore));
        } catch {
          console.error('[StorageService] Still quota exceeded after cleanup');
        }
      } else {
        console.warn('[StorageService] Failed to persist cache:', error);
      }
    }
  }

  /**
   * Clear expired entries from cache
   */
  private clearExpiredCache(): void {
    const now = this.nowSec();
    const before = Object.keys(this.signedUrlCache).length;

    Object.keys(this.signedUrlCache).forEach((key) => {
      if (this.signedUrlCache[key].expiresAt <= now) {
        delete this.signedUrlCache[key];
      }
    });

    const after = Object.keys(this.signedUrlCache).length;
    console.log(`[StorageService] Cleared ${before - after} expired entries`);
  }

  private nowSec(): number {
    return Math.floor(Date.now() / 1000);
  }

  private cacheKey(bucket: string, path: string): string {
    return `${bucket}:${path}`;
  }

  private sanitizePath(path: string): string {
    return path.replace(/^\/+/, '');
  }

  /**
   * Get cached signed URL immediately (synchronous)
   * Returns undefined if not cached or expired
   */
  getCachedSignedUrl(path: string, bucket: string = DEFAULT_BUCKET): string | undefined {
    const sanitized = this.sanitizePath(path);
    const key = this.cacheKey(bucket, sanitized);
    const entry = this.signedUrlCache[key];
    const now = this.nowSec();

    if (entry && entry.expiresAt > now + CACHE_EXPIRY_BUFFER) {
      // Return blob URL if available (instant offline access)
      if (entry.blob) {
        const blobUrl = this.blobCache.get(key);
        if (blobUrl) return blobUrl;

        // Create blob URL if not yet created
        const newBlobUrl = URL.createObjectURL(entry.blob);
        this.blobCache.set(key, newBlobUrl);
        return newBlobUrl;
      }

      return entry.url;
    }

    return undefined;
  }

  /**
   * Get signed URL with caching (async)
   * Deduplicates concurrent requests for the same path
   */
  async getSignedUrlCached(
    path: string,
    expiresInSeconds: number = DEFAULT_EXPIRY,
    bucket: string = DEFAULT_BUCKET
  ): Promise<string> {
    const sanitized = this.sanitizePath(path);
    const key = this.cacheKey(bucket, sanitized);

    // Check cache first
    const cached = this.getCachedSignedUrl(path, bucket);
    if (cached) return cached;

    // Check if already fetching
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log('[StorageService] Deduplicating request for:', key);
      return pending;
    }

    // Fetch new signed URL
    const promise = this.fetchSignedUrl(bucket, sanitized, expiresInSeconds, key);
    this.pendingRequests.set(key, promise);

    try {
      const url = await promise;
      return url;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  private async fetchSignedUrl(
    bucket: string,
    sanitized: string,
    expiresInSeconds: number,
    key: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(sanitized, expiresInSeconds);

      if (error) throw error;

      const now = this.nowSec();
      this.signedUrlCache[key] = {
        url: data.signedUrl,
        expiresAt: now + expiresInSeconds,
      };

      this.persistCache();

      // Start background blob fetch for offline capability
      void this.fetchAndCacheBlob(key, data.signedUrl);

      return data.signedUrl;
    } catch (error) {
      console.error('[StorageService] Failed to get signed URL:', error);
      throw error;
    }
  }

  /**
   * Fetch image blob and cache for offline access
   */
  private async fetchAndCacheBlob(key: string, url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();

      // Store blob in memory cache
      if (this.signedUrlCache[key]) {
        this.signedUrlCache[key].blob = blob;
      }

      // Create and cache blob URL
      const blobUrl = URL.createObjectURL(blob);
      this.blobCache.set(key, blobUrl);

      console.log('[StorageService] Cached blob for offline access:', key);
    } catch (error) {
      console.warn('[StorageService] Failed to cache blob:', error);
    }
  }

  /**
   * Preload images with priority queue
   * High priority: visible avatars
   * Medium priority: just off-screen
   * Low priority: background preload
   */
  preloadImages(paths: string[], priority: PriorityLevel = 'medium', bucket: string = DEFAULT_BUCKET): void {
    const tasks: PreloadTask[] = paths.map((path) => ({
      path,
      bucket,
      priority,
    }));

    // Add to queue based on priority
    if (priority === 'high') {
      this.preloadQueue.unshift(...tasks);
    } else {
      this.preloadQueue.push(...tasks);
    }

    // Sort queue by priority
    this.preloadQueue.sort((a, b) => {
      const priorityMap = { high: 0, medium: 1, low: 2 };
      return priorityMap[a.priority] - priorityMap[b.priority];
    });

    // Start processing if not already running
    if (!this.isProcessingQueue) {
      void this.processPreloadQueue();
    }
  }

  /**
   * Process preload queue with concurrency limit
   */
  private async processPreloadQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    const CONCURRENCY = 3; // Load 3 images at a time

    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, CONCURRENCY);

      await Promise.all(
        batch.map(async (task) => {
          try {
            // Skip if already cached
            if (this.getCachedSignedUrl(task.path, task.bucket)) {
              return;
            }

            await this.getSignedUrlCached(task.path, DEFAULT_EXPIRY, task.bucket);
          } catch (error) {
            console.warn('[StorageService] Preload failed for:', task.path, error);
          }
        })
      );
    }

    this.isProcessingQueue = false;
  }

  /**
   * Batch preload for user avatars with intelligent priority
   */
  async preloadUserAvatars(
    users: Array<{ id: string; photoUrl?: string }>,
    visibleIds: string[] = []
  ): Promise<void> {
    const highPriority: string[] = [];
    const lowPriority: string[] = [];

    users.forEach((user) => {
      if (!user.photoUrl) return;

      if (visibleIds.includes(user.id)) {
        highPriority.push(user.photoUrl);
      } else {
        lowPriority.push(user.photoUrl);
      }
    });

    // Preload visible avatars first
    if (highPriority.length > 0) {
      this.preloadImages(highPriority, 'high', DEFAULT_BUCKET);
    }

    // Then preload others in background
    if (lowPriority.length > 0) {
      this.preloadImages(lowPriority, 'low', DEFAULT_BUCKET);
    }
  }

  /**
   * Start background queue processor
   */
  private startQueueProcessor(): void {
    // Process queue every 100ms if there are pending tasks
    setInterval(() => {
      if (this.preloadQueue.length > 0 && !this.isProcessingQueue) {
        void this.processPreloadQueue();
      }
    }, 100);
  }

  /**
   * Upload file to storage
   */
  async uploadFile(
    path: string,
    file: File,
    bucket: string = DEFAULT_BUCKET
  ): Promise<{ path: string; url: string }> {
    const sanitized = this.sanitizePath(path);

    const { error } = await supabase.storage.from(bucket).upload(sanitized, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (error) throw error;

    // Invalidate cache for this path
    const key = this.cacheKey(bucket, sanitized);
    delete this.signedUrlCache[key];
    this.persistCache();

    // Get new signed URL
    const url = await this.getSignedUrlCached(sanitized, DEFAULT_EXPIRY, bucket);

    return { path: sanitized, url };
  }

  /**
   * Delete file from storage
   */
  async deleteFile(path: string, bucket: string = DEFAULT_BUCKET): Promise<void> {
    const sanitized = this.sanitizePath(path);

    const { error } = await supabase.storage.from(bucket).remove([sanitized]);

    if (error) throw error;

    // Invalidate cache
    const key = this.cacheKey(bucket, sanitized);
    delete this.signedUrlCache[key];

    // Revoke blob URL
    const blobUrl = this.blobCache.get(key);
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      this.blobCache.delete(key);
    }

    this.persistCache();
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    // Revoke all blob URLs
    this.blobCache.forEach((blobUrl) => URL.revokeObjectURL(blobUrl));
    this.blobCache.clear();

    // Clear caches
    this.signedUrlCache = {};
    this.preloadQueue = [];
    this.pendingRequests.clear();

    // Clear localStorage
    localStorage.removeItem('signedUrlCache');

    console.log('[StorageService] All caches cleared');
  }
}

export const storageService = new StorageServiceOptimized();
