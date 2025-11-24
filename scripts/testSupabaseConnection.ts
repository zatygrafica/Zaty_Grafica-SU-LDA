import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data, error } = await supabase.from('profiles').select('id').limit(1);
  if (error) throw error;
  console.log('Supabase connection ok. Sample:', data);
}

main().catch((err) => {
  console.error('Supabase connection failed:', err);
  process.exit(1);
});