import { create } from 'zustand';
import type { User } from '../types';
import { supabaseAdmin } from '../services/supabaseAdminClient';
import { supabase } from '../services/supabaseClient';
import { convertKeysToCamelCase, convertKeysToSnakeCase } from '../utils/case';
import { useStore } from './useStore';

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
      // Sempre busca todos os perfis direto do Supabase
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      const profiles = convertKeysToCamelCase((data ?? []) as ProfileRecord[]);
      const normalized = profiles.map((profile) => normalizeUser(mapProfileToUser(profile)));
      set({ users: normalized, loading: false, hasLoaded: true });
      return normalized;
    } catch (error) {
      set({ loading: false, hasLoaded: false, error: (error as Error).message });
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
      const now = new Date().toISOString();
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role,
          permissions,
          photo_url: userData.photoUrl,
        },
      });

      if (error || !data.user) {
        return { success: false, message: error?.message ?? 'user_create_failed' };
      }

      const authUser = data.user;

      await supabaseAdmin.from('profiles').upsert(
        {
          id: authUser.id,
          email: authUser.email,
          full_name: userData.name,
          role: userData.role,
          permissions,
          avatar_url: userData.photoUrl,
          created_at: now,
          updated_at: now,
        },
        { onConflict: 'id' }
      );

      const { data: fetchedProfile, error: fetchError } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
      if (fetchError) throw fetchError;
      const createdProfile = fetchedProfile
        ? convertKeysToCamelCase(fetchedProfile as ProfileRecord)
        : undefined;
      const normalized = createdProfile
        ? normalizeUser(mapProfileToUser(createdProfile))
        : normalizeUser({
            id: authUser.id,
            name: userData.name,
            email: authUser.email ?? '',
            role: userData.role,
            permissions,
            photoUrl: userData.photoUrl,
            isBlocked: false,
            createdAt: new Date(now),
            updatedAt: new Date(now),
          } as User);

      set({ users: [...users, normalized], error: null });
      useStore.getState().addAuditLog({ action: 'create', resourceType: 'User', resourceId: normalized.id });
      return { success: true, message: 'user_created_success', user: normalized };
    } catch (error) {
      set({ error: (error as Error).message });
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
    const payload: Partial<User> & { avatarUrl?: string; fullName?: string } = { ...userData, updatedAt: new Date() };
    // Garantir que avatar_url seja preenchido com o path salvo em photoUrl
    if (payload.photoUrl && !payload.avatarUrl) {
      payload.avatarUrl = payload.photoUrl;
      delete (payload as Partial<User>).photoUrl; // evita coluna photo_url inexistente
    }
    // Mapear nome para full_name (coluna existente em profiles)
    if (payload.name) {
      payload.fullName = payload.name;
      delete (payload as Partial<User>).name;
    }

    try {
      const snakePayload = convertKeysToSnakeCase(payload);
      const { data, error } = await supabase.from('profiles').update(snakePayload).eq('id', id).select().maybeSingle();
      if (error) throw error;
      if (!data) return { success: false, message: 'user_not_found' };
      const normalized = normalizeUser(mapProfileToUser(convertKeysToCamelCase(data) as ProfileRecord));
      set((state) => ({
        users: state.users.map((user) => (user.id === id ? normalized : user)),
        error: null,
      }));
      useStore.getState().addAuditLog({ action, resourceType: 'User', resourceId: id });
      return { success: true, message: userData.password ? 'password_changed_success' : 'user_updated_success', user: normalized };
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  toggleUserBlock: async (id) => {
    const user = get().users.find((u) => u.id === id);
    if (!user) return undefined;
    const payload = { isBlocked: !user.isBlocked, updatedAt: new Date() };
    try {
      const snakePayload = convertKeysToSnakeCase(payload);
      const { data, error } = await supabase.from('profiles').update(snakePayload).eq('id', id).select().maybeSingle();
      if (error) throw error;
      if (!data) return undefined;
      const normalized = normalizeUser(mapProfileToUser(convertKeysToCamelCase(data) as ProfileRecord));
      const action = user.isBlocked ? 'unblock' : 'block';
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? normalized : u)),
        error: null,
      }));
      useStore.getState().addAuditLog({ action, resourceType: 'User', resourceId: id });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteUserById: async (id) => {
    try {
      await supabaseAdmin.auth.admin.deleteUser(id);
      await supabaseAdmin.from('profiles').delete().eq('id', id);
      set((state) => ({
        users: state.users.filter((user) => user.id !== id),
        error: null,
      }));
      useStore.getState().addAuditLog({ action: 'delete', resourceType: 'User', resourceId: id });
    } catch (error) {
      set({ error: (error as Error).message });
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
