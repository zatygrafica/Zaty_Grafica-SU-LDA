import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { createResilientStorage } from '../utils/resilientStorage';

if (!env.supabase.url || !env.supabase.anonKey) {
  throw new Error('Supabase env vars are missing');
}

// SECURITY: Sessão NÃO é persistida para forçar reautenticação a cada acesso
// Isso previne acesso não autorizado após fechar o aplicativo
export const supabase = createClient(env.supabase.url, env.supabase.anonKey, {
  auth: {
    storage: createResilientStorage(),
    autoRefreshToken: true,
    persistSession: false, // IMPORTANTE: Não persistir sessão para segurança
  },
});
