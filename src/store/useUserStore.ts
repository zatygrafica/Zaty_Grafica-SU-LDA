import { create } from 'zustand';
import type { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { convertKeysToCamelCase } from '../utils/case';
import { useStore } from './useStore';
import { env } from '../config/env';
import { cacheService } from '../services/cacheService';

type UserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
type UserOperationResult = { success: boolean; message: string; user?: User };

type ProfileRecord = {
  id: string;
  name?: string | null;
  fullName?: string | null;
  email?: string | null;
  role?: User['role'] | null;
  permissions?: string[] | null;
  photoUrl?: string | null;
  avatarUrl?: string | null;
  isBlocked?: boolean | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

const normalizeUser = (user: User): User => ({
  ...user,
  createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
  updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
});

type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: User['role'];
  permissions: string[];
  photoUrl?: string;
  isBlocked?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

type ManageUsersAction = 'list' | 'create' | 'update' | 'delete' | 'impersonate';

const functionsBaseUrl = env.supabase.url ? `${env.supabase.url}/functions/v1/manage-users` : null;

const mapApiUser = (apiUser: ApiUser): User => ({
  id: apiUser.id,
  name: apiUser.name || apiUser.email || 'Unnamed User',
  email: apiUser.email,
  role: apiUser.role ?? 'user',
  permissions: Array.isArray(apiUser.permissions) ? apiUser.permissions : [],
  photoUrl: apiUser.photoUrl,
  isBlocked: apiUser.isBlocked ?? false,
  createdAt: apiUser.createdAt ? new Date(apiUser.createdAt) : new Date(),
  updatedAt: apiUser.updatedAt ? new Date(apiUser.updatedAt) : new Date(),
});

/**
 * Enhanced Edge Function caller with retry logic and better error handling
 */
const callManageUsers = async <T>(
  action: ManageUsersAction,
  payload?: Record<string, unknown>,
  retryCount = 0
): Promise<T> => {
  if (!functionsBaseUrl) {
    console.error('[UserStore] Supabase URL not configured');
    throw new Error('Supabase URL is not configured');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData?.session?.access_token) {
    console.error('[UserStore] Authentication error:', sessionError?.message || 'No access token');
    throw new Error('unauthorized');
  }

  try {
    console.log(`[UserStore] Calling manage-users: ${action} (attempt ${retryCount + 1})`);

    const controller = new AbortController();
    // Shorter timeout on first attempt, longer on retries
    const timeoutMs = retryCount === 0 ? 15000 : 25000; // 15s first, 25s on retry
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(functionsBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify({ action, payload }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const parsed = (await response.json().catch((err) => {
      console.error('[UserStore] Failed to parse JSON:', err);
      return {};
    })) as { data?: T; error?: string };

    if (response.status === 401) {
      throw new Error('unauthorized');
    }
    if (response.status === 403) {
      throw new Error('forbidden');
    }
    if (response.status === 404) {
      throw new Error('Edge Function not deployed or URL misconfigured');
    }

    // Retry on server errors (500, 502, 503, 504)
    if (response.status >= 500 && retryCount < 3) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Faster retry: max 5s
      console.log(`[UserStore] Server error ${response.status}, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callManageUsers<T>(action, payload, retryCount + 1);
    }

    if (!response.ok || parsed.error) {
      throw new Error(parsed.error || `Request failed (${response.status})`);
    }

    return parsed.data as T;
  } catch (error) {
    // Handle timeout
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[UserStore] Request timeout');
      if (retryCount < 2) {
        return callManageUsers<T>(action, payload, retryCount + 1);
      }
      throw new Error('Request timeout');
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[UserStore] Network error');
      if (retryCount < 2) {
        const delay = 1000 * Math.pow(2, retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return callManageUsers<T>(action, payload, retryCount + 1);
      }
      throw new Error('Network error - check connection');
    }

    throw error;
  }
};

const mapProfileToUser = (profile: ProfileRecord): User => ({
  id: profile.id,
  name: profile.name ?? profile.fullName ?? profile.email ?? 'Unnamed User',
  email: profile.email ?? '',
  role: (profile.role as User['role']) ?? 'user',
  permissions: Array.isArray(profile.permissions) ? profile.permissions : [],
  photoUrl:
    profile.photoUrl ??
    profile.avatarUrl ??
    (profile as unknown as { photo_url?: string }).photo_url ??
    (profile as unknown as { avatar_url?: string }).avatar_url ??
    undefined,
  isBlocked: profile.isBlocked ?? false,
  createdAt: profile.createdAt ? new Date(profile.createdAt) : new Date(),
  updatedAt: profile.updatedAt ? new Date(profile.updatedAt) : new Date(),
});

interface UserState {
  users: User[];
  loading: boolean;
  hasLoaded: boolean;
  error: string | null;
  lastFetchTime: number | null;
  listUsers: (force?: boolean) => Promise<User[]>;
  listUsersForChat: () => Promise<User[]>;
  getUserById: (id: string) => User | undefined;
  createUser: (userData: UserInput) => Promise<UserOperationResult>;
  updateUserById: (id: string, userData: Partial<User>) => Promise<UserOperationResult>;
  toggleUserBlock: (id: string) => Promise<User | undefined>;
  deleteUserById: (id: string) => Promise<void>;
  subscribeToRealtime: () => () => void;
  preloadUsers: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,
  hasLoaded: false,
  error: null,
  lastFetchTime: null,

  /**
   * Enhanced listUsers with offline cache and smart refresh
   */
  listUsers: async (force = false) => {
    const state = get();

    // Prevent duplicate requests
    if (state.loading) {
      console.log('[UserStore] Already loading, skipping');
      return state.users;
    }

    // Return cached if fresh (< 5 minutes) and not forced
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    if (
      !force &&
      state.hasLoaded &&
      state.lastFetchTime &&
      now - state.lastFetchTime < CACHE_DURATION
    ) {
      console.log('[UserStore] Returning fresh cached data');
      return state.users;
    }

    set({ loading: true, error: null });

    try {
      // Try to load from IndexedDB cache first for instant display
      if (!state.hasLoaded) {
        const cachedUsers = await cacheService.getCachedUsers();
        if (cachedUsers && cachedUsers.length > 0) {
          const normalized = (cachedUsers as ApiUser[]).map((u) => normalizeUser(mapApiUser(u)));
          set({ users: normalized, hasLoaded: true });
          console.log('[UserStore] Loaded from IndexedDB cache');
        }
      }

      // Fetch fresh data from server
      console.log('[UserStore] Fetching fresh data from server');
      const apiUsers = await callManageUsers<ApiUser[]>('list');
      const normalized = apiUsers.map((u) => normalizeUser(mapApiUser(u)));

      set({
        users: normalized,
        loading: false,
        hasLoaded: true,
        error: null,
        lastFetchTime: now,
      });

      // Cache in IndexedDB for offline use
      void cacheService.cacheUsers(apiUsers);

      console.log(`[UserStore] Successfully loaded ${normalized.length} users`);
      return normalized;
    } catch (error) {
      const message = (error as Error).message;
      console.error('[UserStore] Failed to load users:', message);

      // If we have cached data in state, keep showing it WITHOUT error message
      if (state.users.length > 0) {
        console.log('[UserStore] Using stale in-memory cache (silent fallback)');
        set({ loading: false, error: null }); // Don't show error if we have data

        // Retry in background after 10 seconds
        setTimeout(() => {
          const currentState = get();
          if (!currentState.loading) {
            console.log('[UserStore] Background retry after error');
            void get().listUsers(true).catch(() => {
              // Silent fail - user already has cached data
            });
          }
        }, 10000);

        return state.users;
      }

      // Otherwise try IndexedDB as fallback
      const cachedUsers = await cacheService.getCachedUsers();
      if (cachedUsers && cachedUsers.length > 0) {
        const normalized = (cachedUsers as ApiUser[]).map((u) => normalizeUser(mapApiUser(u)));
        console.log('[UserStore] Falling back to IndexedDB cache (silent fallback)');
        set({ users: normalized, loading: false, hasLoaded: true, error: null }); // Don't show error

        // Retry in background after 10 seconds
        setTimeout(() => {
          const currentState = get();
          if (!currentState.loading) {
            console.log('[UserStore] Background retry after error');
            void get().listUsers(true).catch(() => {
              // Silent fail - user already has cached data
            });
          }
        }, 10000);

        return normalized;
      }

      // Only show error if we have no cached data at all
      set({ loading: false, error: message });
      throw error;
    }
  },

  /**
   * Direct profile query for non-admin users (chat, etc.)
   */
  listUsersForChat: async () => {
    const state = get();

    // Return cached if available and fresh
    if (state.users.length > 0 && state.lastFetchTime) {
      const age = Date.now() - state.lastFetchTime;
      if (age < 5 * 60 * 1000) {
        // 5 minutes
        return state.users;
      }
    }

    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, permissions, avatar_url, created_at, updated_at')
        .order('full_name', { ascending: true });

      if (error) throw error;

      const normalized = (data || []).map((profile) => {
        const raw = convertKeysToCamelCase(profile as Record<string, unknown>);
        return normalizeUser(mapProfileToUser(raw as ProfileRecord));
      });

      set({
        users: normalized,
        loading: false,
        hasLoaded: true,
        error: null,
        lastFetchTime: Date.now(),
      });

      console.log(`[UserStore] Successfully loaded ${normalized.length} users for chat`);
      return normalized;
    } catch (error) {
      const message = (error as Error).message;
      console.error('[UserStore] Failed to load users for chat:', message);
      set({ loading: false, error: message });
      throw error;
    }
  },

  getUserById: (id) => get().users.find((user) => user.id === id),

  createUser: async (userData) => {
    const { users } = get();
    if (userData.email) {
      const emailExists = users.some((u) => u.email === userData.email);
      if (emailExists) {
        return { success: false, message: 'email_exists_error' };
      }
    }

    if (!userData.password) {
      return { success: false, message: 'password_required' };
    }

    try {
      const permissions = userData.permissions ?? (userData.role === 'admin' ? ['*'] : ['read:own']);
      const apiUser = await callManageUsers<ApiUser>('create', {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        permissions,
        photoUrl: userData.photoUrl,
        isBlocked: userData.isBlocked,
      });

      const normalized = normalizeUser(mapApiUser(apiUser));
      set((state) => ({
        users: [...state.users, normalized],
        error: null,
        lastFetchTime: Date.now(),
      }));

      useStore.getState().addAuditLog({ action: 'create', resourceType: 'User', resourceId: normalized.id });
      return { success: true, message: 'user_created_success', user: normalized };
    } catch (error) {
      const message = (error as Error).message;
      set({ error: message });
      if (message === 'unauthorized' || message === 'forbidden') {
        return { success: false, message: 'forbidden' };
      }
      throw error;
    }
  },

  updateUserById: async (id, userData) => {
    const { users } = get();
    const existing = users.find((u) => u.id === id);
    if (!existing) {
      return { success: false, message: 'user_not_found' };
    }

    if (userData.email && userData.email !== existing.email) {
      const emailExists = users.some((u) => u.email === userData.email);
      if (emailExists) {
        return { success: false, message: 'email_exists_error' };
      }
    }

    const action = userData.password ? 'change_password' : 'update';

    try {
      const apiUser = await callManageUsers<ApiUser>('update', { id, ...userData });
      const normalized = normalizeUser(mapApiUser(apiUser));

      set((state) => ({
        users: state.users.map((user) => (user.id === id ? normalized : user)),
        error: null,
        lastFetchTime: Date.now(),
      }));

      useStore.getState().addAuditLog({ action, resourceType: 'User', resourceId: id });
      return {
        success: true,
        message: userData.password ? 'password_changed_success' : 'user_updated_success',
        user: normalized,
      };
    } catch (error) {
      const message = (error as Error).message;
      set({ error: message });
      if (message === 'unauthorized' || message === 'forbidden') {
        return { success: false, message: 'forbidden' };
      }
      throw error;
    }
  },

  toggleUserBlock: async (id) => {
    const user = get().users.find((u) => u.id === id);
    if (!user) return undefined;

    const payload = { isBlocked: !user.isBlocked, updatedAt: new Date() };

    try {
      const apiUser = await callManageUsers<ApiUser>('update', { id, ...payload });
      const normalized = normalizeUser(mapApiUser(apiUser));
      const action = user.isBlocked ? 'unblock' : 'block';

      set((state) => ({
        users: state.users.map((u) => (u.id === id ? normalized : u)),
        error: null,
        lastFetchTime: Date.now(),
      }));

      useStore.getState().addAuditLog({ action, resourceType: 'User', resourceId: id });
      return normalized;
    } catch (error) {
      const message = (error as Error).message;
      set({ error: message });
      throw error;
    }
  },

  deleteUserById: async (id) => {
    try {
      await callManageUsers('delete', { id });
      set((state) => ({
        users: state.users.filter((user) => user.id !== id),
        error: null,
        lastFetchTime: Date.now(),
      }));
      useStore.getState().addAuditLog({ action: 'delete', resourceType: 'User', resourceId: id });
    } catch (error) {
      const message = (error as Error).message;
      set({ error: message });
      throw error;
    }
  },

  subscribeToRealtime: () => {
    const channel = supabase.channel('profiles-realtime');

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles' },
      (payload) => {
        const raw = (payload.new ?? payload.old) as Record<string, unknown>;
        const parsed = convertKeysToCamelCase(raw) as ProfileRecord;
        if (!parsed?.id) return;

        const normalized = normalizeUser(mapProfileToUser(parsed));

        set((state) => {
          if (payload.eventType === 'DELETE') {
            return {
              users: state.users.filter((u) => u.id !== normalized.id),
              hasLoaded: true,
              lastFetchTime: Date.now(),
            };
          }

          const exists = state.users.some((u) => u.id === normalized.id);
          const users = exists
            ? state.users.map((u) => (u.id === normalized.id ? normalized : u))
            : [normalized, ...state.users];

          return { users, hasLoaded: true, lastFetchTime: Date.now() };
        });
      }
    );

    void channel.subscribe();

    return () => {
      void channel.unsubscribe();
    };
  },

  /**
   * Preload users in background without blocking UI
   */
  preloadUsers: async () => {
    const state = get();
    if (state.loading || state.hasLoaded) return;

    // Load from cache first
    const cachedUsers = await cacheService.getCachedUsers();
    if (cachedUsers && cachedUsers.length > 0) {
      const normalized = (cachedUsers as ApiUser[]).map((u) => normalizeUser(mapApiUser(u)));
      set({ users: normalized, hasLoaded: true });
    }

    // Then fetch fresh data in background
    void get().listUsers(true).catch(() => {
      // Silent fail for preload
    });
  },
}));

// Bootstrap realtime subscription
let userRealtimeUnsubscribe: (() => void) | null = null;
const bootstrapUsers = () => {
  if (!userRealtimeUnsubscribe) {
    userRealtimeUnsubscribe = useUserStore.getState().subscribeToRealtime();
  }
};
bootstrapUsers();
