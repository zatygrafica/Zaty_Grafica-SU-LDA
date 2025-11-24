import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.');
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const jsonResponse = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { message: 'method_not_allowed' });
  }

  try {
    const payload = JSON.parse(event.body ?? '{}');
    const { name, email, password, role = 'user', permissions = [], photoUrl } = payload;

    if (!name || !password) {
      return jsonResponse(400, { message: 'missing_required_fields' });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        permissions,
        photo_url: photoUrl,
      },
    });

    if (error || !data.user) {
      return jsonResponse(400, { message: error?.message ?? 'auth_create_failed' });
    }

    const authUser = data.user;

    const profilePayload = {
      id: authUser.id,
      email: authUser.email,
      full_name: name,
      role,
      permissions,
      avatar_url: photoUrl,
      created_at: now,
      updated_at: now,
    };
    await supabaseAdmin.from('profiles').upsert(profilePayload, { onConflict: 'id' });

    const userRow = {
      id: authUser.id,
      name,
      email: authUser.email,
      role,
      permissions,
      photo_url: photoUrl,
      is_blocked: false,
      created_at: now,
      updated_at: now,
    };
    await supabaseAdmin.from('users').upsert(userRow, { onConflict: 'id' });

    const clientUser = {
      id: authUser.id,
      name,
      email: authUser.email,
      role,
      permissions,
      photoUrl: photoUrl ?? null,
      isBlocked: false,
      createdAt: now,
      updatedAt: now,
    };

    return jsonResponse(200, { user: clientUser });
  } catch (error) {
    console.error('create-user function failed', error);
    return jsonResponse(500, { message: 'create_user_failed' });
  }
};

