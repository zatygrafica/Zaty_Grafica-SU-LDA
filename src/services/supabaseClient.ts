import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

if (!env.supabase.url || !env.supabase.anonKey) {
  throw new Error('Supabase env vars are missing');
}

export const supabase = createClient(env.supabase.url, env.supabase.anonKey);
