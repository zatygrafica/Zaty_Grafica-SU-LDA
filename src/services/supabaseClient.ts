import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { createResilientStorage } from '../utils/resilientStorage';

if (!env.supabase.url || !env.supabase.anonKey) {
  throw new Error('Supabase env vars are missing');
}

// Deixe o supabase-js gerenciar o token da sessão do usuário.
// Só passamos a anon key; o Authorization será o access_token da sessão.
export const supabase = createClient(env.supabase.url, env.supabase.anonKey, {
  auth: {
    storage: createResilientStorage(),
    autoRefreshToken: true,
    persistSession: true,
  },
});
