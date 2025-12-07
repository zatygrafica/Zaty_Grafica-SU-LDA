import { create } from 'zustand';
import type { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { convertKeysToCamelCase } from '../utils/case';
import { useStore } from './useStore';
import { env } from '../config/env';

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

const callManageUsers = async <T>(action: ManageUsersAction, payload?: Record<string, unknown>): Promise<T> => {
  if (!functionsBaseUrl) {
    throw new Error('Supabase URL is not configured');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData?.session?.access_token) {
    throw new Error('unauthorized');
  }

  const response = await fetch(functionsBaseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionData.session.access_token}`,
    },
    body: JSON.stringify({ action, payload }),
  });

  const parsed = (await response.json().catch(() => ({}))) as { data?: T; error?: string };

  if (response.status === 401) throw new Error('unauthorized');
  if (response.status === 403) throw new Error('forbidden');
  if (!response.ok || parsed.error) {
    throw new Error(parsed.error || 'User function failed');
  }

  return parsed.data as T;
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
  listUsers: (force?: boolean) => Promise<User[]>;
  getUserById: (id: string) => User | undefined;
  createUser: (userData: UserInput) => Promise<UserOperationResult>;
  updateUserById: (id: string, userData: Partial<User>) => Promise<UserOperationResult>;
  toggleUserBlock: (id: string) => Promise<User | undefined>;
  deleteUserById: (id: string) => Promise<void>;
  subscribeToRealtime: () => () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,
  hasLoaded: false,
  error: null,

  listUsers: async (_force = false) => {
    if (get().loading) return get().users;
    set({ loading: true, hasLoaded: false, error: null });
    try {
      const apiUsers = await callManageUsers<ApiUser[]>('list');
      const normalized = apiUsers.map((u) => normalizeUser(mapApiUser(u)));
      set({ users: normalized, loading: false, hasLoaded: true });
      return normalized;
    } catch (error) {
      const message = (error as Error).message;
      set({ loading: false, hasLoaded: false, error: message });
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
      set({ users: [...users, normalized], error: null });
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
      const apiUser = await callManageUsers<ApiUser>('update', {
        id,
        ...userData,
      });
      const normalized = normalizeUser(mapApiUser(apiUser));
      set((state) => ({
        users: state.users.map((user) => (user.id === id ? normalized : user)),
        error: null,
      }));
      useStore.getState().addAuditLog({ action, resourceType: 'User', resourceId: id });
      return { success: true, message: userData.password ? 'password_changed_success' : 'user_updated_success', user: normalized };
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
            };
          }
          const exists = state.users.some((u) => u.id === normalized.id);
          const users = exists
            ? state.users.map((u) => (u.id === normalized.id ? normalized : u))
            : [normalized, ...state.users];
          return { users, hasLoaded: true };
        });
      }
    );

    void channel.subscribe();

    return () => {
      void channel.unsubscribe();
    };
  },
}));

// Bootstrap: ensure users are loaded once on app start and realtime is attached
let userRealtimeUnsubscribe: (() => void) | null = null;
const bootstrapUsers = () => {
  const state = useUserStore.getState();
  // Load immediately from Supabase profiles
  void state.listUsers(true).catch((error) => console.error('Failed to load users on bootstrap:', error));
  // Attach realtime only once
  if (!userRealtimeUnsubscribe) {
    userRealtimeUnsubscribe = state.subscribeToRealtime();
  }
};
bootstrapUsers();
