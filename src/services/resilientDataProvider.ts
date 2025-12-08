/**
 * Resilient Data Provider
 *
 * Wrapper around supabaseDataProvider que adiciona:
 * - Retry automático com exponential backoff
 * - Tratamento de sessões expiradas
 * - Cache inteligente para fallback
 * - Timeout configurável
 * - Controle de concorrência
 * - Logging detalhado para diagnóstico
 */

import { supabase } from './supabaseClient';
import { supabaseDataProvider, type DataProvider, type ResourceName, type ListOptions, type ListResponse, type SelectOptions } from './supabaseDataProvider';

interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // ms
  maxDelay: number; // ms
  timeout: number; // ms
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1s
  maxDelay: 10000, // 10s
  timeout: 30000, // 30s
};

// Cache simples em memória para fallback
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Controle de concorrência - evita múltiplas requisições simultâneas para o mesmo recurso
const ongoingRequests = new Map<string, Promise<unknown>>();

/**
 * Gera chave única para cache baseada no recurso e opções
 */
function getCacheKey(resource: ResourceName, options?: unknown): string {
  return `${resource}:${JSON.stringify(options || {})}`;
}

/**
 * Obtém dados do cache se válidos
 */
function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  console.log(`[ResilientDataProvider] Cache hit for ${key} (age: ${Math.round(age/1000)}s)`);
  return cached.data as T;
}

/**
 * Salva dados no cache
 */
function saveToCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Verifica se a sessão está expirada e tenta renovar
 */
async function ensureValidSession(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[ResilientDataProvider] Session error:', error.message);
      return false;
    }

    if (!session) {
      console.warn('[ResilientDataProvider] No active session');
      return false;
    }

    // Verifica se o token está próximo de expirar (dentro de 5 minutos)
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (expiresAt - now < fiveMinutes) {
      console.log('[ResilientDataProvider] Token expiring soon, refreshing...');
      const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError || !newSession) {
        console.error('[ResilientDataProvider] Failed to refresh session:', refreshError?.message);
        return false;
      }

      console.log('[ResilientDataProvider] Session refreshed successfully');
    }

    return true;
  } catch (error) {
    console.error('[ResilientDataProvider] Error checking session:', error);
    return false;
  }
}

/**
 * Executa uma função com retry e tratamento de erros
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  resource: ResourceName,
  operation: string,
  config: RetryConfig = DEFAULT_CONFIG
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Verifica sessão antes de cada tentativa
      const sessionValid = await ensureValidSession();
      if (!sessionValid && attempt === 0) {
        throw new Error('Session expired or invalid');
      }

      // Cria promise com timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), config.timeout);
      });

      // Executa a operação com timeout
      console.log(`[ResilientDataProvider] ${operation} ${resource} (attempt ${attempt + 1}/${config.maxRetries + 1})`);
      const result = await Promise.race([fn(), timeoutPromise]);

      console.log(`[ResilientDataProvider] ${operation} ${resource} succeeded`);
      return result;

    } catch (error) {
      lastError = error as Error;
      const errorMessage = lastError.message || 'Unknown error';

      console.error(
        `[ResilientDataProvider] ${operation} ${resource} failed (attempt ${attempt + 1}/${config.maxRetries + 1}):`,
        errorMessage
      );

      // Não faz retry em erros específicos
      if (
        errorMessage.includes('Row not found') ||
        errorMessage.includes('duplicate key') ||
        errorMessage.includes('violates foreign key') ||
        errorMessage.includes('permission denied')
      ) {
        console.log(`[ResilientDataProvider] Non-retryable error, throwing immediately`);
        throw lastError;
      }

      // Se não é a última tentativa, aguarda antes de tentar novamente
      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.initialDelay * Math.pow(2, attempt),
          config.maxDelay
        );
        console.log(`[ResilientDataProvider] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Todas as tentativas falharam
  console.error(`[ResilientDataProvider] All ${config.maxRetries + 1} attempts failed for ${operation} ${resource}`);
  throw lastError || new Error('Operation failed after all retries');
}

/**
 * Provider resiliente com retry, cache e tratamento de sessão
 */
export const resilientDataProvider: DataProvider = {
  async list<T>(resource: ResourceName, options?: ListOptions): Promise<T[]> {
    const cacheKey = getCacheKey(resource, options);

    // Verifica se já há uma requisição em andamento para evitar duplicatas
    const ongoing = ongoingRequests.get(cacheKey);
    if (ongoing) {
      console.log(`[ResilientDataProvider] Reusing ongoing request for ${cacheKey}`);
      return ongoing as Promise<T[]>;
    }

    // Cria a promise da requisição
    const requestPromise = withRetry(
      () => supabaseDataProvider.list<T>(resource, options),
      resource,
      'list',
    ).then(result => {
      // Salva no cache em caso de sucesso
      saveToCache(cacheKey, result);
      ongoingRequests.delete(cacheKey);
      return result;
    }).catch(error => {
      ongoingRequests.delete(cacheKey);

      // Tenta retornar do cache em caso de erro
      const cached = getFromCache<T[]>(cacheKey);
      if (cached) {
        console.warn(`[ResilientDataProvider] Using cached data for ${cacheKey} after error:`, error.message);
        return cached;
      }

      throw error;
    });

    ongoingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  },

  async listWithCount<T>(resource: ResourceName, options?: ListOptions): Promise<ListResponse<T>> {
    const cacheKey = getCacheKey(resource, { ...options, withCount: true });

    const ongoing = ongoingRequests.get(cacheKey);
    if (ongoing) {
      console.log(`[ResilientDataProvider] Reusing ongoing request for ${cacheKey}`);
      return ongoing as Promise<ListResponse<T>>;
    }

    const requestPromise = withRetry(
      () => supabaseDataProvider.listWithCount<T>(resource, options),
      resource,
      'listWithCount',
    ).then(result => {
      saveToCache(cacheKey, result);
      ongoingRequests.delete(cacheKey);
      return result;
    }).catch(error => {
      ongoingRequests.delete(cacheKey);

      const cached = getFromCache<ListResponse<T>>(cacheKey);
      if (cached) {
        console.warn(`[ResilientDataProvider] Using cached data for ${cacheKey} after error:`, error.message);
        return cached;
      }

      throw error;
    });

    ongoingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  },

  async getById<T>(resource: ResourceName, id: string, options?: SelectOptions): Promise<T | undefined> {
    const cacheKey = getCacheKey(resource, { id, ...options });

    const ongoing = ongoingRequests.get(cacheKey);
    if (ongoing) {
      return ongoing as Promise<T | undefined>;
    }

    const requestPromise = withRetry(
      () => supabaseDataProvider.getById<T>(resource, id, options),
      resource,
      'getById',
    ).then(result => {
      if (result) {
        saveToCache(cacheKey, result);
      }
      ongoingRequests.delete(cacheKey);
      return result;
    }).catch(error => {
      ongoingRequests.delete(cacheKey);

      const cached = getFromCache<T>(cacheKey);
      if (cached) {
        console.warn(`[ResilientDataProvider] Using cached data for ${cacheKey} after error:`, error.message);
        return cached;
      }

      throw error;
    });

    ongoingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  },

  async create<T>(resource: ResourceName, payload: T): Promise<T> {
    return withRetry(
      async () => {
        const result = await supabaseDataProvider.create<T>(resource, payload);
        // Invalida cache de listagem
        Array.from(cache.keys())
          .filter(key => key.startsWith(`${resource}:`))
          .forEach(key => cache.delete(key));
        return result;
      },
      resource,
      'create',
    );
  },

  async update<T>(resource: ResourceName, id: string, payload: Partial<T>): Promise<T | undefined> {
    return withRetry(
      async () => {
        const result = await supabaseDataProvider.update<T>(resource, id, payload);
        if (result) {
          // Invalida cache relacionado
          Array.from(cache.keys())
            .filter(key => key.startsWith(`${resource}:`))
            .forEach(key => cache.delete(key));
        }
        return result;
      },
      resource,
      'update',
    );
  },

  async delete(resource: ResourceName, id: string): Promise<void> {
    return withRetry(
      async () => {
        await supabaseDataProvider.delete(resource, id);
        // Invalida cache relacionado
        Array.from(cache.keys())
          .filter(key => key.startsWith(`${resource}:`))
          .forEach(key => cache.delete(key));
      },
      resource,
      'delete',
    );
  },
};

/**
 * Função utilitária para limpar cache manualmente se necessário
 */
export function clearCache(resource?: ResourceName): void {
  if (resource) {
    Array.from(cache.keys())
      .filter(key => key.startsWith(`${resource}:`))
      .forEach(key => cache.delete(key));
    console.log(`[ResilientDataProvider] Cache cleared for ${resource}`);
  } else {
    cache.clear();
    console.log(`[ResilientDataProvider] All cache cleared`);
  }
}
