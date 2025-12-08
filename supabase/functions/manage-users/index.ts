// Deno Edge Function: manage-users
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type ManageUsersAction = 'list' | 'create' | 'update' | 'delete' | 'impersonate';

type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  photoUrl?: string;
  isBlocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Em produção, especificar domínio
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

const mapProfileToUser = (profile: Record<string, unknown>): ApiUser => ({
  id: String(profile.id),
  name:
    (profile.full_name as string | undefined) ||
    (profile.name as string | undefined) ||
    (profile.email as string | undefined) ||
    'User',
  email: (profile.email as string | undefined) || '',
  role: (profile.role as string | undefined) || 'user',
  permissions: Array.isArray(profile.permissions) ? (profile.permissions as string[]) : [],
  photoUrl:
    (profile.avatar_url as string | undefined) ||
    (profile.photo_url as string | undefined) ||
    undefined,
  isBlocked:
    (profile.is_blocked as boolean | undefined) ??
    (profile.isBlocked as boolean | undefined) ??
    false,
  createdAt: (profile.created_at as string | undefined) || undefined,
  updatedAt: (profile.updated_at as string | undefined) || undefined,
});

const getSessionUser = async (req: Request) => {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return { error: 'Missing bearer token', status: 401 };
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { error: 'Invalid or expired token', status: 401 };
  }
  return { user: data.user };
};

const ensureAdmin = async (userId: string) => {
  // Primary check: table users (instruction)
  const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (!userErr && userRow?.role === 'admin') return { ok: true };

  // Fallback: profiles table if users row does not exist
  const { data: profileRow, error: profileErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (profileErr) return { error: 'Unable to verify role' };
  if (profileRow?.role !== 'admin') return { error: 'Forbidden', status: 403 };
  return { ok: true };
};

const handleList = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, name, email, role, permissions, avatar_url, photo_url, is_blocked, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[manage-users] List error:', error);
      throw new Error(`Failed to fetch profiles: ${error.message}`);
    }

    if (!data) {
      console.warn('[manage-users] No data returned from profiles table');
      return [];
    }

    console.log(`[manage-users] Successfully fetched ${data.length} profiles`);
    const users = data.map((row) => mapProfileToUser(row as Record<string, unknown>));
    return users;
  } catch (err) {
    console.error('[manage-users] handleList exception:', err);
    throw err;
  }
};

const handleCreate = async (payload: Record<string, unknown>) => {
  const email = (payload.email as string | undefined)?.trim();
  const password = payload.password as string | undefined;
  if (!email || !password) {
    return { error: 'email and password are required', status: 400 };
  }

  const role = (payload.role as string | undefined) ?? 'user';
  const permissions = Array.isArray(payload.permissions)
    ? (payload.permissions as string[])
    : role === 'admin'
      ? ['*']
      : ['read:own'];
  const name = (payload.name as string | undefined) ?? email;
  const photoUrl = payload.photoUrl as string | undefined;
  const isBlocked = (payload.isBlocked as boolean | undefined) ?? false;

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name,
      role,
      permissions,
      avatar_url: photoUrl,
      is_blocked: isBlocked,
    },
  });
  if (createErr || !created?.user) {
    return { error: createErr?.message ?? 'Failed to create user', status: 500 };
  }

  const now = new Date().toISOString();
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .upsert(
      {
        id: created.user.id,
        email,
        full_name: name,
        role,
        permissions,
        avatar_url: photoUrl,
        is_blocked: isBlocked,
        created_at: now,
        updated_at: now,
      },
      { onConflict: 'id' },
    )
    .select()
    .single();

  if (profileErr) {
    return { error: profileErr.message, status: 500 };
  }

  return mapProfileToUser(profile as Record<string, unknown>);
};

const handleUpdate = async (payload: Record<string, unknown>) => {
  const id = payload.id as string | undefined;
  if (!id) return { error: 'id is required', status: 400 };

  const updates: Record<string, unknown> = {};
  if (payload.name !== undefined) updates.full_name = payload.name;
  if (payload.email !== undefined) updates.email = payload.email;
  if (payload.role !== undefined) updates.role = payload.role;
  if (payload.permissions !== undefined) updates.permissions = payload.permissions;
  if (payload.photoUrl !== undefined) updates.avatar_url = payload.photoUrl;
  if (payload.isBlocked !== undefined) updates.is_blocked = payload.isBlocked;
  updates.updated_at = new Date().toISOString();

  // Update auth user if password/email/metadata changed
  const authPayload: Record<string, unknown> = {};
  if (payload.password) authPayload.password = payload.password;
  if (payload.email) authPayload.email = payload.email;
  if (Object.keys(authPayload).length > 0 || updates.full_name || updates.role || updates.permissions || updates.avatar_url) {
    authPayload.user_metadata = {
      full_name: payload.name,
      role: payload.role,
      permissions: payload.permissions,
      avatar_url: payload.photoUrl,
      is_blocked: payload.isBlocked,
    };
    const { error: authErr } = await supabase.auth.admin.updateUserById(id, authPayload);
    if (authErr) return { error: authErr.message, status: 500 };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return { error: error.message, status: 500 };
  if (!data) return { error: 'User not found', status: 404 };

  return mapProfileToUser(data as Record<string, unknown>);
};

const handleDelete = async (payload: Record<string, unknown>) => {
  const id = payload.id as string | undefined;
  if (!id) return { error: 'id is required', status: 400 };

  const { error: deleteErr } = await supabase.auth.admin.deleteUser(id);
  if (deleteErr) return { error: deleteErr.message, status: 500 };

  await supabase.from('profiles').delete().eq('id', id);
  return { success: true };
};

const handleImpersonate = async (payload: Record<string, unknown>) => {
  const id = payload.id as string | undefined;
  if (!id) return { error: 'id is required', status: 400 };
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, name, email, role, permissions, avatar_url, photo_url, is_blocked, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();
  if (error) return { error: error.message, status: 500 };
  if (!data) return { error: 'User not found', status: 404 };
  return mapProfileToUser(data as Record<string, unknown>);
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authResult = await getSessionUser(req);
    if ('error' in authResult) {
      return jsonResponse({ error: authResult.error }, { status: authResult.status ?? 401 });
    }
    const { user } = authResult;

    const roleCheck = await ensureAdmin(user.id);
    if ('error' in roleCheck) {
      return jsonResponse({ error: roleCheck.error }, { status: roleCheck.status ?? 403 });
    }

    const { action, payload } = (await req.json().catch(() => ({}))) as {
      action?: ManageUsersAction;
      payload?: Record<string, unknown>;
    };

    if (!action) {
      return jsonResponse({ error: 'action is required' }, { status: 400 });
    }

    let result: unknown;
    if (action === 'list') {
      result = await handleList();
    } else if (action === 'create') {
      const created = await handleCreate(payload ?? {});
      if ('error' in created) return jsonResponse({ error: created.error }, { status: created.status ?? 500 });
      result = created;
    } else if (action === 'update') {
      const updated = await handleUpdate(payload ?? {});
      if ('error' in updated) return jsonResponse({ error: updated.error }, { status: updated.status ?? 500 });
      result = updated;
    } else if (action === 'delete') {
      const deleted = await handleDelete(payload ?? {});
      if ('error' in deleted) return jsonResponse({ error: deleted.error }, { status: deleted.status ?? 500 });
      result = deleted;
    } else if (action === 'impersonate') {
      const impersonated = await handleImpersonate(payload ?? {});
      if ('error' in impersonated) return jsonResponse({ error: impersonated.error }, { status: impersonated.status ?? 500 });
      result = impersonated;
    } else {
      return jsonResponse({ error: 'Unsupported action' }, { status: 400 });
    }

    return jsonResponse({ data: result });
  } catch (error) {
    console.error('manage-users error', error);
    return jsonResponse({ error: 'Internal server error' }, { status: 500 });
  }
});
