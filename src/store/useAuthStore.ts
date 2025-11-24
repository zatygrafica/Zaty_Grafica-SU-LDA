import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { authService, fetchProfile, upsertProfile } from '../services/authService';
import type { Profile } from '../types/profile';

const buildProfileFromUser = (user: User): Profile => ({
  id: user.id,
  email: user.email ?? '',
  full_name: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? '',
  role: (user.user_metadata?.role as Profile['role']) ?? 'user',
  permissions: (user.user_metadata?.permissions as string[]) ?? [],
  avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
  phone: (user.user_metadata?.phone as string | undefined) ?? null,
});

const ensureProfileForUser = async (user: User): Promise<Profile> => {
  const existing = await fetchProfile(user.id);
  if (existing) return existing;
  const profile = buildProfileFromUser(user);
  await upsertProfile(profile);
  return profile;
};

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

interface AuthActions {
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, profile?: Partial<Profile>): Promise<void>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
}

let authListenerSet = false;

const initializeAuth = (set: (partial: Partial<AuthState>) => void) => {
  if (authListenerSet) return;
  authListenerSet = true;
  void (async () => {
    set({ loading: true });
    try {
      const session = await authService.getSession();
      const profile = session?.user ? await ensureProfileForUser(session.user) : null;
      set({
        session: session ?? null,
        user: session?.user ?? null,
        profile,
        loading: false,
        initialized: true,
        error: null,
      });
    } catch (error) {
      set({ loading: false, initialized: true, error: (error as Error).message });
    }

    authService.onAuthStateChange(async (_event, session) => {
      const profile = session?.user ? await ensureProfileForUser(session.user) : null;
      set({
        session: session ?? null,
        user: session?.user ?? null,
        profile,
        loading: false,
        initialized: true,
        error: null,
      });
    });
  })();
};

export const useAuthStore = create<AuthState & AuthActions>((set, get) => {
  initializeAuth(set);

  return {
    session: null,
    user: null,
    profile: null,
    loading: true,
    initialized: false,
    error: null,

    async signIn(email, password) {
      set({ loading: true, error: null });
      try {
        await authService.signIn({ email, password });
        const session = await authService.getSession();
        const profile = session?.user ? await ensureProfileForUser(session.user) : null;
        set({
          session: session ?? null,
          user: session?.user ?? null,
          profile,
          loading: false,
          initialized: true,
        });
      } catch (error) {
        set({ loading: false, initialized: true, error: (error as Error).message });
        throw error;
      }
    },

    async signUp(email, password, profileInput) {
      void email;
      void password;
      void profileInput;
      set({ loading: false, initialized: true, error: 'Sign up is disabled. Contact an administrator.' });
      throw new Error('Sign up is disabled. Contact an administrator.');
    },

    async signOut() {
      set({ loading: true, error: null });
      await authService.signOut();
      set({
        session: null,
        user: null,
        profile: null,
        loading: false,
        initialized: true,
      });
    },

    async refreshProfile() {
      const user = get().user;
      if (!user) return;
      const profile = await ensureProfileForUser(user);
      set({ profile });
    },
  };
});
