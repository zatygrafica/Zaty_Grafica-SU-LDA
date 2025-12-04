import { supabase } from './supabaseClient';
import type { Profile } from '../types/profile';
import type { Session, User } from '@supabase/supabase-js';

type SignInParams = { email: string; password: string };

export const authService = {
  async signIn({ email, password }: SignInParams) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      await ensureProfile(data.user);
    }
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session ?? null;
  },

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => callback(event, session));
  },

  async signUp() {
    throw new Error('Sign up is disabled. Use an admin-provisioned account.');
  },
};

async function ensureProfile(user: User) {
  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (existing) return existing as Profile;

  const profile: Profile = {
    id: user.id,
    email: user.email ?? '',
    full_name: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? '',
    role: (user.user_metadata?.role as Profile['role']) ?? 'user',
    permissions: (user.user_metadata?.permissions as string[]) ?? [],
    avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    phone: (user.user_metadata?.phone as string | undefined) ?? null,
  };

  const { error: upsertError } = await supabase.from('profiles').upsert(profile, { onConflict: 'id' });
  if (upsertError) throw upsertError;
  return profile;
}

export async function upsertProfile(profile: Profile) {
  const { error } = await supabase.from('profiles').upsert(profile, { onConflict: 'id' });
  if (error) throw error;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export function mapProfileToUser(profile: Profile): {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  permissions: string[];
  photoUrl?: string;
  isBlocked?: boolean;
  createdAt: Date;
  updatedAt: Date;
} {
  // cobre chaves snake e camel que podem vir do Supabase ou do convertKeysToCamelCase
  const avatarUrl =
    (profile as unknown as { avatarUrl?: string }).avatarUrl ??
    (profile as unknown as { photoUrl?: string }).photoUrl ??
    (profile as unknown as { photo_url?: string }).photo_url ??
    profile.avatar_url ??
    undefined;

  return {
    id: profile.id,
    name: profile.full_name || profile.email,
    email: profile.email,
    role: profile.role ?? 'user',
    permissions: profile.permissions ?? [],
    photoUrl: avatarUrl,
    isBlocked: false,
    createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
    updatedAt: profile.updated_at ? new Date(profile.updated_at) : new Date(),
  };
}
