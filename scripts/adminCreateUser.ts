import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment');
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type CreateUserInput = {
  email: string;
  password: string;
  full_name?: string;
  role?: 'admin' | 'user';
  permissions?: string[];
  avatar_url?: string;
  phone?: string;
};

export async function createUserWithProfile(input: CreateUserInput) {
  const { email, password, full_name, role = 'user', permissions = [], avatar_url, phone } = input;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name,
      role,
      permissions,
      avatar_url,
      phone,
    },
  });
  if (error) throw error;
  const user = data.user;
  if (!user) throw new Error('User creation failed: no user returned');

  const { error: upsertError } = await supabaseAdmin.from('profiles').upsert(
    {
      id: user.id,
      email,
      full_name,
      role,
      permissions,
      avatar_url,
      phone,
    },
    { onConflict: 'id' }
  );
  if (upsertError) throw upsertError;

  return user;
}

// Optional CLI usage: node --loader ts-node/esm scripts/adminCreateUser.ts email pass
if (require.main === module) {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: node scripts/adminCreateUser.ts <email> <password>');
    process.exit(1);
  }
  createUserWithProfile({ email, password })
    .then((user) => {
      console.log(`Created user ${user.email} with id ${user.id}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
