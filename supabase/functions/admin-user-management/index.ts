import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status=200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') || '';
    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: allowed } = await caller.rpc('admin_has_permission', { p_permission: 'staff.manage' });
    if (!allowed) return json({ error: 'دسترسی مدیریت کاربران پنل را ندارید.' }, 403);
    const body = await req.json();
    if (body.action === 'create') {
      const username = String(body.username||'').trim().toLowerCase();
      if (!/^[a-z0-9_.-]{3,40}$/.test(username)) return json({ error: 'نام کاربری معتبر نیست.' }, 400);
      if (String(body.password||'').length < 8) return json({ error: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' }, 400);
      const email = `${username}@admin.carrtell.local`;
      const { data: created, error } = await admin.auth.admin.createUser({ email, password: body.password, email_confirm: true, user_metadata: { account_type: 'admin', username } });
      if (error || !created.user) return json({ error: error?.message || 'ساخت کاربر ناموفق بود.' }, 400);
      const { error: insertError } = await admin.from('admin_accounts').insert({ id: created.user.id, username, full_name: String(body.fullName||username), email, role_id: body.roleId || null, is_active: body.isActive !== false });
      if (insertError) { await admin.auth.admin.deleteUser(created.user.id); return json({ error: insertError.message }, 400); }
      await caller.rpc('admin_log_event', { p_action:'admin_account.create',p_entity:'admin_account',p_entity_id:created.user.id,p_meta:{ username } });
      return json({ ok:true,id:created.user.id });
    }
    const userId = String(body.userId||'');
    if (!userId) return json({ error:'شناسه کاربر الزامی است.' },400);
    const { data: target } = await admin.from('admin_accounts').select('is_super_admin,username').eq('id',userId).maybeSingle();
    if (!target) return json({ error:'حساب پیدا نشد.' },404);
    if (target.is_super_admin && body.action !== 'reset_password') return json({ error:'حساب Super Admin قابل حذف یا غیرفعال‌سازی نیست.' },403);
    if (body.action === 'update') {
      const changes: Record<string,unknown> = { updated_at:new Date().toISOString() };
      if ('fullName' in body) changes.full_name=body.fullName;
      if ('roleId' in body) changes.role_id=body.roleId||null;
      if ('isActive' in body) changes.is_active=Boolean(body.isActive);
      const { error } = await admin.from('admin_accounts').update(changes).eq('id',userId); if (error) return json({error:error.message},400);
    } else if (body.action === 'reset_password') {
      if (String(body.password||'').length < 8) return json({error:'رمز عبور باید حداقل ۸ کاراکتر باشد.'},400);
      const { error } = await admin.auth.admin.updateUserById(userId,{password:body.password}); if (error) return json({error:error.message},400);
    } else if (body.action === 'delete') {
      const { error } = await admin.auth.admin.deleteUser(userId); if (error) return json({error:error.message},400);
    } else return json({error:'عملیات نامعتبر است.'},400);
    await caller.rpc('admin_log_event',{p_action:`admin_account.${body.action}`,p_entity:'admin_account',p_entity_id:userId,p_meta:{username:target.username}});
    return json({ok:true});
  } catch (e) { return json({ error: e instanceof Error ? e.message : 'خطای داخلی' },500); }
});
