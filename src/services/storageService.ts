import { supabase } from './supabaseClient';
import type { Attachment } from '../types';
import { convertKeysToCamelCase } from '../utils/case';

const DEFAULT_BUCKET = 'app-files';

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
        upsert: false,
        cacheControl: '3600',
        contentType: (file as File).type || undefined,
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

  async remove(path: string, bucket: string = DEFAULT_BUCKET) {
    const sanitized = sanitizePath(path);
    const { error } = await supabase.storage.from(bucket).remove([sanitized]);
    if (error) throw error;

    // limpa o registro de attachment, se existir
    await supabase.from('attachments').delete().eq('path', sanitized);
  },
};
