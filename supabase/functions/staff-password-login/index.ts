import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const allowedOrigins = new Set([
  'https://carrtell.ir','https://www.carrtell.ir',
  'http://localhost:5173','http://127.0.0.1:5173',
  'http://localhost:4173','http://127.0.0.1:4173',
]);
function cors(req: Request) {
  const origin = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://carrtell.ir',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}
function json(req: Request, body: unknown, status=200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'content-type': 'application/json; charset=utf-8' } });
}
async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return json(req, { ok:false, error:'method_not_allowed' }, 405);
  const origin = req.headers.get('origin') || '';
  if (origin && !allowedOrigins.has(origin)) return json(req, { ok:false, error:'origin_not_allowed' }, 403);

  const url = Deno.env.get('SUPABASE_URL') || '';
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !service) return json(req, { ok:false, error:'server_configuration_missing' }, 500);
  const admin = createClient(url, service, { auth: { persistSession:false, autoRefreshToken:false } });

  try {
    const body = await req.json();
    const action = String(body?.action || 'login');
    const role = String(body?.role || '');
    if (role !== 'admin' && role !== 'technician') return json(req, { ok:false, error:'invalid_role' }, 400);

    if (action === 'technician_upsert' || action === 'technician_set_active') {
      const authHeader = req.headers.get('authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (!token) return json(req, { ok:false, error:'unauthorized' }, 401);
      const { data: caller } = await admin.auth.getUser(token);
      if (!caller?.user) return json(req, { ok:false, error:'unauthorized' }, 401);
      const { data: adminAccount } = await admin.from('admin_accounts').select('id,is_active').eq('id', caller.user.id).maybeSingle();
      if (!adminAccount?.is_active) return json(req, { ok:false, error:'forbidden' }, 403);

      if (action === 'technician_set_active') {
        const id = String(body?.id || '');
        if (!id) return json(req, { ok:false, error:'technician_id_required' }, 400);
        const isActive = Boolean(body?.is_active);
        const { error } = await admin.from('service_technicians').update({ is_active:isActive, updated_at:new Date().toISOString() }).eq('id', id);
        if (error) return json(req, { ok:false, error:error.message }, 500);
        return json(req, { ok:true });
      }

      const id = String(body?.id || '').trim();
      const username = String(body?.username || '').trim().toLowerCase();
      const password = String(body?.password || '');
      const fullName = String(body?.full_name || '').trim();
      const phone = String(body?.phone || '').trim();
      if (!/^[a-z0-9_.-]{3,40}$/.test(username)) return json(req, { ok:false, error:'نام کاربری معتبر نیست.' }, 400);
      if (!fullName) return json(req, { ok:false, error:'نام سرویس‌کار الزامی است.' }, 400);
      if (!id && password.length < 8) return json(req, { ok:false, error:'رمز سرویس‌کار جدید حداقل ۸ کاراکتر باشد.' }, 400);
      if (password && password.length < 8) return json(req, { ok:false, error:'رمز جدید حداقل ۸ کاراکتر باشد.' }, 400);

      let userId = id;
      let email = '';
      if (userId) {
        const { data: existingAuth, error: existingAuthError } = await admin.auth.admin.getUserById(userId);
        if (existingAuthError || !existingAuth.user) return json(req, { ok:false, error:'حساب سرویس‌کار پیدا نشد.' }, 404);
        email = existingAuth.user.email || `tech-${userId}@staff.carrtell.local`;
        if (password) {
          const { error: passwordError } = await admin.auth.admin.updateUserById(userId, { password, user_metadata:{ account_type:'technician', full_name:fullName } });
          if (passwordError) return json(req, { ok:false, error:passwordError.message }, 500);
        } else {
          await admin.auth.admin.updateUserById(userId, { user_metadata:{ account_type:'technician', full_name:fullName } });
        }
      } else {
        email = `tech-${crypto.randomUUID()}@staff.carrtell.local`;
        const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm:true, user_metadata:{ account_type:'technician', full_name:fullName } });
        if (createError || !created.user) return json(req, { ok:false, error:createError?.message || 'technician_user_create_failed' }, 500);
        userId = created.user.id;
      }

      const passwordHash = password ? await sha256(password) : undefined;
      const technicianPayload: Record<string, unknown> = {
        id:userId, username, full_name:fullName, phone:phone || null,
        is_active: body?.is_active !== false, service_area:String(body?.service_area || '').trim() || null,
        notes:String(body?.notes || '').trim() || null, updated_at:new Date().toISOString(),
      };
      if (passwordHash) technicianPayload.password_hash = passwordHash;
      const { data: technician, error: technicianError } = await admin.from('service_technicians').upsert(technicianPayload, { onConflict:'id' }).select('id,username,full_name,phone,is_active,service_area,notes,created_at,updated_at').single();
      if (technicianError) return json(req, { ok:false, error:technicianError.message }, 500);
      const { error: profileError } = await admin.from('profiles').upsert({ id:userId, email, full_name:fullName, phone:phone || null, role:'technician', is_active:body?.is_active !== false, updated_at:new Date().toISOString() });
      if (profileError) return json(req, { ok:false, error:profileError.message }, 500);
      return json(req, { ok:true, technician });
    }

    if (action === 'update') {
      const authHeader = req.headers.get('authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (!token) return json(req, { ok:false, error:'unauthorized' }, 401);
      const { data: caller } = await admin.auth.getUser(token);
      if (!caller?.user) return json(req, { ok:false, error:'unauthorized' }, 401);
      const { data: adminAccount } = await admin.from('admin_accounts').select('id,is_active').eq('id', caller.user.id).maybeSingle();
      if (!adminAccount?.is_active) return json(req, { ok:false, error:'forbidden' }, 403);
      const username = String(body?.username || '').trim().toLowerCase();
      const password = String(body?.password || '');
      if (!/^[a-z0-9_.-]{3,40}$/.test(username)) return json(req, { ok:false, error:'نام کاربری معتبر نیست.' }, 400);
      if (password.length < 5) return json(req, { ok:false, error:'رمز عبور حداقل ۵ کاراکتر باشد.' }, 400);
      const passwordHash = await sha256(password);
      const { error: settingsUpdateError } = await admin.from('staff_login_settings').upsert({
        role,
        username,
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      });
      if (settingsUpdateError) return json(req, { ok:false, error:`staff_settings_update_failed: ${settingsUpdateError.message}` }, 500);

      // Keep the real Supabase Auth credential in sync at the moment the admin
      // changes it. Previously only staff_login_settings changed; the browser
      // auth user could drift and the next login depended on a later self-heal.
      if (role === 'admin') {
        const { error: authUpdateError } = await admin.auth.admin.updateUserById(caller.user.id, {
          password,
          user_metadata:{ ...(caller.user.user_metadata || {}), account_type:'admin', full_name:'مدیر Carrtell' },
        });
        if (authUpdateError) return json(req, { ok:false, error:`admin_auth_password_update_failed: ${authUpdateError.message}` }, 500);
        const { error: adminUsernameError } = await admin.from('admin_accounts').update({ username, updated_at:new Date().toISOString() }).eq('id', caller.user.id);
        if (adminUsernameError) return json(req, { ok:false, error:`admin_username_update_failed: ${adminUsernameError.message}` }, 500);
      }

      return json(req, { ok:true });
    }

    const username = String(body?.username || '').trim().toLowerCase();
    const password = String(body?.password || '');

    // V4.7.1: keep the already-proven V4.6 admin login path isolated from
    // technician provisioning. V4.7 added multi-technician logic; admin auth
    // must remain deterministic and must not share technician fallback state.
    if (role === 'admin') {
      const { data: setting, error: settingError } = await admin
        .from('staff_login_settings')
        .select('username,password_hash')
        .eq('role', 'admin')
        .maybeSingle();
      if (settingError || !setting || username !== setting.username) {
        return json(req, { ok:false, error:'نام کاربری یا رمز عبور صحیح نیست.' }, 401);
      }

      const submittedHash = await sha256(password);
      let credentialValidated = submittedHash === setting.password_hash;
      let userId = '';
      let email = 'carrtell-temp-admin@staff.carrtell.local';

      const { data: existingAdmin, error: existingAdminError } = await admin
        .from('admin_accounts')
        .select('id,username,email,is_active')
        .eq('username', setting.username)
        .maybeSingle();
      if (existingAdminError) return json(req, { ok:false, error:`admin_account_lookup_failed: ${existingAdminError.message}` }, 500);

      if (existingAdmin?.id) {
        const { data: existingAuth, error: existingAuthError } = await admin.auth.admin.getUserById(existingAdmin.id);
        if (existingAuthError || !existingAuth?.user) {
          return json(req, { ok:false, error:`admin_auth_user_missing: ${existingAuthError?.message || 'user_not_found'}` }, 500);
        }
        userId = existingAuth.user.id;
        email = existingAuth.user.email || existingAdmin.email || email;
      }

      if (!userId) {
        const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page:1, perPage:1000 });
        if (usersError) return json(req, { ok:false, error:`staff_user_list_failed: ${usersError.message}` }, 500);
        const existing = users.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
        if (existing) userId = existing.id;
      }

      // If staff_login_settings drifted from Supabase Auth, validate against the
      // real Auth account and repair the hash instead of locking the owner out.
      // This only runs for the already-known admin username and existing auth user.
      if (!credentialValidated && userId) {
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
        if (anonKey) {
          const verifier = createClient(url, anonKey, { auth:{ persistSession:false, autoRefreshToken:false } });
          const { error: passwordCheckError } = await verifier.auth.signInWithPassword({ email, password });
          if (!passwordCheckError) {
            credentialValidated = true;
            await admin.from('staff_login_settings').update({ password_hash:submittedHash, updated_at:new Date().toISOString() }).eq('role','admin');
          }
        }
      }

      if (!credentialValidated) {
        return json(req, { ok:false, error:'نام کاربری یا رمز عبور صحیح نیست.' }, 401);
      }

      // First-time bootstrap is allowed only after the Carrtell credential was
      // validated by its stored hash.
      if (!userId) {
        const { data: created, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm:true,
          user_metadata:{ account_type:'admin', full_name:'مدیر Carrtell' },
        });
        if (error || !created.user) return json(req, { ok:false, error:error?.message || 'staff_user_create_failed' }, 500);
        userId = created.user.id;
      }

      const { data: ownerRole, error: ownerRoleError } = await admin.from('admin_roles').select('id').eq('name','owner').maybeSingle();
      if (ownerRoleError || !ownerRole?.id) {
        return json(req, { ok:false, error:`owner_role_missing: ${ownerRoleError?.message || 'owner role not found'}` }, 500);
      }

      const { error: adminAccountError } = await admin.from('admin_accounts').upsert({
        id:userId, username:setting.username, full_name:'مدیر Carrtell', email,
        role_id:ownerRole.id, is_active:true, is_super_admin:true, updated_at:new Date().toISOString(),
      }, { onConflict:'id' });
      if (adminAccountError) return json(req, { ok:false, error:`admin_account_upsert_failed: ${adminAccountError.message}` }, 500);

      const { error: profileError } = await admin.from('profiles').upsert({
        id:userId, email, full_name:'مدیر Carrtell', role:'admin', is_active:true, updated_at:new Date().toISOString(),
      });
      if (profileError) return json(req, { ok:false, error:`admin_profile_upsert_failed: ${profileError.message}` }, 500);

      const { error: authSyncError } = await admin.auth.admin.updateUserById(userId, {
        email, password, email_confirm:true, user_metadata:{ account_type:'admin', full_name:'مدیر Carrtell' },
      });
      if (authSyncError) return json(req, { ok:false, error:`staff_auth_sync_failed: ${authSyncError.message}` }, 500);

      const { data: verifiedAdmin, error: verifyAdminError } = await admin
        .from('admin_accounts').select('id,is_active,is_super_admin').eq('id', userId).maybeSingle();
      if (verifyAdminError || !verifiedAdmin?.is_active) {
        return json(req, { ok:false, error:`admin_access_provision_failed: ${verifyAdminError?.message || 'inactive_or_missing'}` }, 500);
      }

      const { data: loginLink, error: loginLinkError } = await admin.auth.admin.generateLink({
        type:'magiclink',
        email,
      });
      const tokenHash = loginLink?.properties?.hashed_token;
      if (loginLinkError || !tokenHash) {
        return json(req, { ok:false, error:`admin_session_issue_failed: ${loginLinkError?.message || 'token_missing'}` }, 500);
      }

      // Return a one-time token after server-side credential validation. This
      // creates the same independent session on every browser/device and does
      // not depend on a password or an existing Google/Chrome session.
      return json(req, { ok:true, token_hash:tokenHash, role:'admin' });
    }

    let setting: { username:string; password_hash:string } | null = null;
    let technicianRecord: { id:string; username:string; password_hash:string; full_name:string; phone?:string|null; is_active:boolean } | null = null;

    if (role === 'technician') {
      const { data: technician, error: technicianError } = await admin
        .from('service_technicians')
        .select('id,username,password_hash,full_name,phone,is_active')
        .eq('username', username)
        .maybeSingle();
      if (technicianError) return json(req, { ok:false, error:`technician_lookup_failed: ${technicianError.message}` }, 500);
      if (technician && technician.is_active && await sha256(password) === technician.password_hash) technicianRecord = technician;
    }

    if (!technicianRecord) {
      const { data: legacySetting, error: settingError } = await admin.from('staff_login_settings').select('username,password_hash').eq('role', role).maybeSingle();
      if (settingError || !legacySetting || username !== legacySetting.username || await sha256(password) !== legacySetting.password_hash) {
        return json(req, { ok:false, error:'نام کاربری یا رمز عبور صحیح نیست.' }, 401);
      }
      setting = legacySetting;
    }

    let userId = technicianRecord?.id || '';
    let email = role === 'admin' ? 'carrtell-temp-admin@staff.carrtell.local' : 'carrtell-temp-technician@staff.carrtell.local';

    if (role === 'technician' && technicianRecord?.id) {
      const { data: technicianAuth, error: technicianAuthError } = await admin.auth.admin.getUserById(technicianRecord.id);
      if (technicianAuthError || !technicianAuth.user) return json(req, { ok:false, error:'technician_auth_user_missing' }, 500);
      email = technicianAuth.user.email || email;
    }

    if (role === 'admin') {
      // Prefer the already-existing admin account for this username. Carrtell may
      // already have an admin auth user from earlier RBAC/bootstrap migrations.
      // Creating a second auth user and then upserting username="admin" can hit
      // admin_accounts.username UNIQUE and leave the new session without admin access.
      const { data: existingAdmin, error: existingAdminError } = await admin
        .from('admin_accounts')
        .select('id,username,email,is_active')
        .eq('username', setting?.username || username)
        .maybeSingle();
      if (existingAdminError) return json(req, { ok:false, error:`admin_account_lookup_failed: ${existingAdminError.message}` }, 500);

      if (existingAdmin?.id) {
        const { data: existingAuth, error: existingAuthError } = await admin.auth.admin.getUserById(existingAdmin.id);
        if (existingAuthError || !existingAuth?.user) {
          return json(req, { ok:false, error:`admin_auth_user_missing: ${existingAuthError?.message || 'user_not_found'}` }, 500);
        }
        userId = existingAuth.user.id;
        email = existingAuth.user.email || existingAdmin.email || email;
      }
    }

    if (!userId) {
      const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page:1, perPage:1000 });
      if (usersError) return json(req, { ok:false, error:`staff_user_list_failed: ${usersError.message}` }, 500);
      const existing = users.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
      if (existing) userId = existing.id;
      else {
        const { data: created, error } = await admin.auth.admin.createUser({
          email,
          email_confirm:true,
          user_metadata:{ account_type:role, full_name: role === 'admin' ? 'مدیر Carrtell' : (technicianRecord?.full_name || 'سرویس‌کار Carrtell') },
        });
        if (error || !created.user) return json(req, { ok:false, error:error?.message || 'staff_user_create_failed' }, 500);
        userId = created.user.id;
      }
    }

    if (role === 'admin') {
      const { data: ownerRole, error: ownerRoleError } = await admin.from('admin_roles').select('id').eq('name','owner').maybeSingle();
      if (ownerRoleError || !ownerRole?.id) {
        return json(req, { ok:false, error:`owner_role_missing: ${ownerRoleError?.message || 'owner role not found'}` }, 500);
      }

      const { error: adminAccountError } = await admin.from('admin_accounts').upsert({
        id:userId,
        username:setting?.username || username,
        full_name:'مدیر Carrtell',
        email,
        role_id:ownerRole.id,
        is_active:true,
        is_super_admin:true,
        updated_at:new Date().toISOString(),
      }, { onConflict:'id' });
      if (adminAccountError) return json(req, { ok:false, error:`admin_account_upsert_failed: ${adminAccountError.message}` }, 500);

      const { error: profileError } = await admin.from('profiles').upsert({
        id:userId,
        email,
        full_name:'مدیر Carrtell',
        role:'admin',
        is_active:true,
        updated_at:new Date().toISOString(),
      });
      if (profileError) return json(req, { ok:false, error:`admin_profile_upsert_failed: ${profileError.message}` }, 500);

      // Verify the exact account that the browser session will use really has
      // active admin access before issuing the magic-link token.
      const { data: verifiedAdmin, error: verifyAdminError } = await admin
        .from('admin_accounts')
        .select('id,is_active,is_super_admin')
        .eq('id', userId)
        .maybeSingle();
      if (verifyAdminError || !verifiedAdmin?.is_active) {
        return json(req, { ok:false, error:`admin_access_provision_failed: ${verifyAdminError?.message || 'inactive_or_missing'}` }, 500);
      }
    } else {
      const { error: profileError } = await admin.from('profiles').upsert({
        id:userId,
        email,
        full_name:technicianRecord?.full_name || 'سرویس‌کار Carrtell',
        phone:technicianRecord?.phone || null,
        role:'technician',
        is_active:true,
        updated_at:new Date().toISOString(),
      });
      if (profileError) return json(req, { ok:false, error:`technician_profile_upsert_failed: ${profileError.message}` }, 500);
    }

    // Keep the Supabase Auth credential synchronized with Carrtell's staff
    // credential only after the temporary username/password has been validated.
    // The browser then uses a normal password sign-in, which produces a stable
    // refreshable session and keeps auth.uid() aligned with admin_accounts.id.
    const { error: authSyncError } = await admin.auth.admin.updateUserById(userId, {
      email,
      password,
      email_confirm:true,
      user_metadata:{ account_type:role, full_name: role === 'admin' ? 'مدیر Carrtell' : (technicianRecord?.full_name || 'سرویس‌کار Carrtell') },
    });
    if (authSyncError) return json(req, { ok:false, error:`staff_auth_sync_failed: ${authSyncError.message}` }, 500);

    const { data: loginLink, error: loginLinkError } = await admin.auth.admin.generateLink({ type:'magiclink', email });
    const tokenHash = loginLink?.properties?.hashed_token;
    if (loginLinkError || !tokenHash) return json(req, { ok:false, error:`staff_session_issue_failed: ${loginLinkError?.message || 'token_missing'}` }, 500);
    return json(req, { ok:true, token_hash:tokenHash, role });
  } catch (error) {
    console.error('staff-password-login', error);
    return json(req, { ok:false, error:error instanceof Error ? error.message : 'unknown_error' }, 500);
  }
});
