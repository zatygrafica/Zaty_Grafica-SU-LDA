import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { authService, fetchProfile, upsertProfile } from '../services/authService';
import type { Profile } from '../types/profile';
import { cleanupStorage } from '../utils/storageCleanup';

const buildProfileFromUser = (user: User): Profile => ({
  id: user.id,
  email: user.email ?? '',
  full_name: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? '',
  role: (user.user_metadata?.role as Profile['role']) ?? 'user',
  permissions: (user.user_metadata?.permissions as string[]) ?? [],
  avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
  phone: (user.user_metadata?.phone as string | undefined) ?? null,
});

const ensureProfileForUser = async (user: User, retryCount = 0): Promise<Profile> => {
  try {
    console.log(`[Auth] ensureProfileForUser attempt ${retryCount + 1} for user:`, user.email);
    const existing = await fetchProfile(user.id);
    if (existing) {
      console.log('[Auth] Profile found:', existing);
      return existing;
    }

    console.log('[Auth] No profile found, creating new profile...');
    const profile = buildProfileFromUser(user);
    await upsertProfile(profile);
    console.log('[Auth] Profile created successfully');
    return profile;
  } catch (error) {
    console.error('[Auth] ensureProfileForUser error:', error);

    // Retry once if it's a network/fetch error and we haven't retried yet
    if (retryCount === 0 && (error instanceof TypeError || (error as Error).message?.includes('fetch'))) {
      console.warn('[Auth] Retrying profile fetch after 500ms...');
      await new Promise(resolve => setTimeout(resolve, 500));
      return ensureProfileForUser(user, retryCount + 1);
    }

    throw error;
  }
};

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  isLocked: boolean; // Bloqueado por inatividade
  lockReason: 'idle' | 'session_expired' | null;
}

interface AuthActions {
  signIn(email: string, password: string): Promise<{ success: boolean; error?: string }>;
  signUp(email: string, password: string, profile?: Partial<Profile>): Promise<void>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
  lockSession(reason: 'idle' | 'session_expired'): void;
  unlockSession(): void;
}

let authListenerSet = false;

const initializeAuth = (set: (partial: Partial<AuthState>) => void) => {
  if (authListenerSet) return;
  authListenerSet = true;
  void (async () => {
    set({ loading: true });
    try {
      // Clean up old storage on app initialization
      cleanupStorage();

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
    isLocked: false,
    lockReason: null,

    async signIn(email, password) {
      set({ loading: true, error: null });
      try {
        // Clean up old storage before login to prevent quota errors
        cleanupStorage();

        await authService.signIn({ email, password });
        console.log('[Auth] Sign in completed, waiting for session to be saved...');

        // Wait for session to be fully saved and token to be set in headers
        // Increased from 150ms to 300ms for more reliability
        await new Promise(resolve => setTimeout(resolve, 300));

        // Verify session is available
        const session = await authService.getSession();
        if (!session) {
          throw new Error('Sessão não foi criada após login. Tente novamente.');
        }

        console.log('[Auth] Session confirmed, fetching profile...');
        const profile = session.user ? await ensureProfileForUser(session.user) : null;

        set({
          session: session ?? null,
          user: session?.user ?? null,
          profile,
          loading: false,
          initialized: true,
          isLocked: false,
          lockReason: null,
        });

        console.log('[Auth] Login successful for:', session.user?.email);
        return { success: true };
      } catch (error) {
        // Log the actual error for debugging
        console.error('[Auth] Login error:', error);

        // Check if error is SPECIFICALLY storage quota related (QuotaExceededError)
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error('[Auth] Storage quota exceeded during login');

          // Limpa storage antigo e permite nova tentativa sem loop de reload
          cleanupStorage();
          set({
            loading: false,
            initialized: true,
            error: 'Armazenamento do navegador cheio ou bloqueado. Limpe os dados do site e tente novamente.',
          });
          return { success: false, error: 'Armazenamento do navegador cheio ou bloqueado. Limpe os dados do site e tente novamente.' };
        }

        const errorMessage = (error as Error).message;
        set({ loading: false, initialized: true, error: errorMessage });
        return { success: false, error: errorMessage };
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

    lockSession(reason) {
      console.log('[Auth] Locking session:', reason);
      set({ isLocked: true, lockReason: reason });
    },

    unlockSession() {
      console.log('[Auth] Unlocking session');
      set({ isLocked: false, lockReason: null });
    },
  };
});
