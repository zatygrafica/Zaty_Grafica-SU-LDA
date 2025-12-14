import { supabase } from './supabaseClient';
import type { Attachment } from '../types';
import { convertKeysToCamelCase } from '../utils/case';

const DEFAULT_BUCKET = 'app-files';
const signedUrlCache: Record<string, { url: string; expiresAt: number }> = {};

const cacheKey = (bucket: string, path: string) => `${bucket}:${path}`;
const nowSec = () => Math.floor(Date.now() / 1000);
const loadPersistedCache = () => {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem('storage_signed_urls');
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, { url: string; expiresAt: number }>;
      // Remove entradas expiradas ao carregar
      const now = nowSec();
      Object.entries(parsed).forEach(([key, entry]) => {
        if (entry.expiresAt > now) {
          signedUrlCache[key] = entry;
        }
      });
    }
  } catch {
    /* ignore */
  }
};

const persistCache = () => {
  if (typeof localStorage === 'undefined') return;
  try {
    // Remove entradas expiradas antes de persistir
    const now = nowSec();
    const validEntries = Object.entries(signedUrlCache)
      .filter(([, entry]) => entry.expiresAt > now)
      .reduce((acc, [key, entry]) => ({ ...acc, [key]: entry }), {});
    localStorage.setItem('storage_signed_urls', JSON.stringify(validEntries));
  } catch (error) {
    // Se erro de quota, limpa o cache e tenta novamente com dados reduzidos
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('[StorageService] Quota exceeded, clearing old cache...');
      try {
        localStorage.removeItem('storage_signed_urls');
        // Mantém apenas as 10 URLs mais recentes
        const now = nowSec();
        const recentEntries = Object.entries(signedUrlCache)
          .filter(([, entry]) => entry.expiresAt > now)
          .sort(([, a], [, b]) => b.expiresAt - a.expiresAt)
          .slice(0, 10)
          .reduce((acc, [key, entry]) => ({ ...acc, [key]: entry }), {});
        localStorage.setItem('storage_signed_urls', JSON.stringify(recentEntries));
      } catch (retryError) {
        // Se ainda falhar, apenas limpa o cache
        console.error('[StorageService] Failed to persist cache even after cleanup');
        localStorage.removeItem('storage_signed_urls');
      }
    }
  }
};

loadPersistedCache();

const sanitizePath = (path: string) => path.replace(/\/\/+/g, '/').replace(/^\//, '');

const buildObjectPath = (resourceType: string, resourceId: string | undefined, filename: string) => {
  const cleaned = sanitizePath(filename);
  const resourcePart = resourceId ? `${resourceType}/${resourceId}` : resourceType;
  return `${resourcePart}/${Date.now()}-${cleaned}`;
};

export const storageService = {
  async upload(
    file: File | Blob,
    filename: string,
    resourceType: string,
    resourceId?: string,
    metadata?: Record<string, unknown>,
    bucket: string = DEFAULT_BUCKET,
  ): Promise<{ path: string; attachment: Attachment }> {
    const objectPath = buildObjectPath(resourceType, resourceId, filename);
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectPath, file, {
        // Permite substituir arquivo com mesmo nome, evitando erros de conflito
        upsert: true,
        cacheControl: '3600',
        contentType: (file as File).type || 'application/octet-stream',
      });

    if (uploadError) {
      throw uploadError;
    }

    // registra metadados na tabela attachments
    const payload = {
      bucket,
      path: objectPath,
      resource_type: resourceType,
      resource_id: resourceId ?? null,
      uploaded_by: supabase.auth.getUser ? (await supabase.auth.getUser()).data.user?.id ?? null : null,
      metadata: metadata ?? {},
    };

    const { data, error } = await supabase
      .from('attachments')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      path: objectPath,
      attachment: convertKeysToCamelCase(data) as Attachment,
    };
  },

  async getSignedUrl(path: string, expiresInSeconds = 60, bucket: string = DEFAULT_BUCKET) {
    const sanitized = sanitizePath(path);
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(sanitized, expiresInSeconds);
    if (error) throw error;
    return data.signedUrl;
  },

  async getSignedUrlCached(path: string, expiresInSeconds = 300, bucket: string = DEFAULT_BUCKET) {
    const sanitized = sanitizePath(path);
    const key = cacheKey(bucket, sanitized);
    const entry = signedUrlCache[key];
    const now = nowSec();
    if (entry && entry.expiresAt > now + 30) {
      return entry.url;
    }
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(sanitized, expiresInSeconds);
    if (error) throw error;
    signedUrlCache[key] = { url: data.signedUrl, expiresAt: now + expiresInSeconds };
    persistCache();
    return data.signedUrl;
  },

  getCachedSignedUrl(path: string, bucket: string = DEFAULT_BUCKET): string | undefined {
    const sanitized = sanitizePath(path);
    const key = cacheKey(bucket, sanitized);
    const entry = signedUrlCache[key];
    const now = nowSec();
    if (entry && entry.expiresAt > now + 30) {
      return entry.url;
    }
    return undefined;
  },

  async remove(path: string, bucket: string = DEFAULT_BUCKET) {
    const sanitized = sanitizePath(path);
    const { error } = await supabase.storage.from(bucket).remove([sanitized]);
    if (error) throw error;

    // limpa o registro de attachment, se existir
    await supabase.from('attachments').delete().eq('path', sanitized);
  },
};
