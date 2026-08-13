-- Carrtell RC1-03F: complete self-contained roles and admin account management
-- Run once in Supabase SQL Editor. Safe to run again.

begin;

create extension if not exists pgcrypto;

-- Ensure required built-in roles exist.
insert into public.admin_roles(name,title,description,permissions,is_system)
values
('owner','مالک سیستم','دسترسی کامل و غیرقابل محدودسازی',array['*'],true),
('manager','مدیر فروشگاه','مدیریت فروشگاه، سفارش‌ها و مشتریان',array['dashboard.view','orders.view','orders.manage','products.view','products.manage','inventory.view','inventory.manage','customers.view','customers.manage','support.view','support.manage','content.view','content.manage','dispatch.view','dispatch.manage','staff.view'],true),
('warehouse','انباردار','محصولات و موجودی',array['dashboard.view','products.view','inventory.view','inventory.manage'],true),
('support','پشتیبان','مشتریان، سفارش‌ها و پشتیبانی',array['dashboard.view','orders.view','customers.view','support.view','support.manage'],true),
('accountant','حسابدار','مالی و گزارش‌ها',array['dashboard.view','orders.view','finance.view','finance.manage','audit.view'],true)
on conflict (name) do update set
  title=excluded.title,
  description=excluded.description,
  permissions=excluded.permissions,
  is_system=true,
  updated_at=now();

create or replace function public.admin_list_roles()
returns setof public.admin_roles
language plpgsql
stable
security definer
set search_path=public
as $$
begin
  if not public.is_admin() then raise exception 'دسترسی مدیر لازم است'; end if;
  return query select * from public.admin_roles order by is_system desc, created_at asc;
end;
$$;

create or replace function public.admin_save_role(
  p_id uuid,
  p_name text,
  p_title text,
  p_description text,
  p_permissions text[]
)
returns setof public.admin_roles
language plpgsql
security definer
set search_path=public
as $$
declare
  v_id uuid;
  v_name text := lower(trim(coalesce(p_name,'')));
  v_title text := trim(coalesce(p_title,''));
  v_existing public.admin_roles%rowtype;
begin
  if not public.admin_has_permission('roles.manage') then raise exception 'مجوز مدیریت نقش‌ها را ندارید'; end if;
  if v_name !~ '^[a-z0-9_-]{2,50}$' then raise exception 'کلید نقش نامعتبر است'; end if;
  if length(v_title) < 2 then raise exception 'عنوان نقش نامعتبر است'; end if;

  if p_id is not null then
    select * into v_existing from public.admin_roles where id=p_id;
    if not found then raise exception 'نقش پیدا نشد'; end if;
    if v_existing.is_system then raise exception 'نقش سیستمی قابل ویرایش نیست'; end if;
    update public.admin_roles
      set name=v_name,title=v_title,description=nullif(trim(coalesce(p_description,'')),''),permissions=coalesce(p_permissions,'{}'),updated_at=now()
      where id=p_id returning id into v_id;
  else
    insert into public.admin_roles(name,title,description,permissions,is_system)
      values(v_name,v_title,nullif(trim(coalesce(p_description,'')),''),coalesce(p_permissions,'{}'),false)
      returning id into v_id;
  end if;

  perform public.admin_log_event(case when p_id is null then 'role_create' else 'role_update' end,'admin_role',v_id::text,jsonb_build_object('name',v_name));
  return query select * from public.admin_roles where id=v_id;
exception when unique_violation then
  raise exception 'کلید نقش تکراری است';
end;
$$;

create or replace function public.admin_delete_role(p_id uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare v_role public.admin_roles%rowtype;
begin
  if not public.admin_has_permission('roles.manage') then raise exception 'مجوز مدیریت نقش‌ها را ندارید'; end if;
  select * into v_role from public.admin_roles where id=p_id;
  if not found then raise exception 'نقش پیدا نشد'; end if;
  if v_role.is_system then raise exception 'نقش سیستمی قابل حذف نیست'; end if;
  update public.admin_accounts set role_id=null,updated_at=now() where role_id=p_id;
  delete from public.admin_roles where id=p_id;
  perform public.admin_log_event('role_delete','admin_role',p_id::text,jsonb_build_object('name',v_role.name));
end;
$$;

create or replace function public.admin_list_accounts()
returns table(
  id uuid,
  username text,
  full_name text,
  email text,
  role_id uuid,
  role_title text,
  is_active boolean,
  is_super_admin boolean,
  last_login_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path=public
as $$
begin
  if not (public.admin_has_permission('staff.view') or public.admin_has_permission('staff.manage')) then
    raise exception 'مجوز مشاهده کاربران پنل را ندارید';
  end if;
  return query
    select a.id,a.username,a.full_name,a.email,a.role_id,r.title,a.is_active,a.is_super_admin,a.last_login_at,a.created_at
    from public.admin_accounts a
    left join public.admin_roles r on r.id=a.role_id
    order by a.is_super_admin desc,a.created_at desc;
end;
$$;

create or replace function public.admin_manage_account(
  p_action text,
  p_user_id uuid default null,
  p_username text default null,
  p_password text default null,
  p_full_name text default null,
  p_role_id uuid default null,
  p_is_active boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,auth,extensions
as $$
declare
  v_username text := lower(trim(coalesce(p_username,'')));
  v_email text;
  v_user_id uuid;
  v_now timestamptz := now();
  v_target public.admin_accounts%rowtype;
begin
  if not public.admin_has_permission('staff.manage') then raise exception 'مجوز مدیریت کاربران پنل را ندارید'; end if;

  if p_action='create' then
    if v_username !~ '^[a-z0-9_.-]{3,40}$' then raise exception 'نام کاربری نامعتبر است'; end if;
    if length(coalesce(p_password,'')) < 10 then raise exception 'رمز عبور باید حداقل ۱۰ کاراکتر باشد'; end if;
    if length(trim(coalesce(p_full_name,''))) < 2 then raise exception 'نام کاربر نامعتبر است'; end if;
    if p_role_id is null or not exists(select 1 from public.admin_roles where id=p_role_id) then raise exception 'نقش انتخاب‌شده معتبر نیست'; end if;

    v_email := v_username || '@admin.carrtell.local';
    if exists(select 1 from auth.users where lower(email)=v_email) or exists(select 1 from public.admin_accounts where lower(username)=v_username) then
      raise exception 'این نام کاربری قبلاً استفاده شده است';
    end if;

    v_user_id := gen_random_uuid();
    insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,invited_at,confirmation_token,recovery_token,email_change_token_new,email_change,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,is_super_admin)
    values('00000000-0000-0000-0000-000000000000',v_user_id,'authenticated','authenticated',v_email,crypt(p_password,gen_salt('bf')),v_now,v_now,'','','','',jsonb_build_object('provider','email','providers',array['email'],'carrtell_admin',true),jsonb_build_object('username',v_username,'full_name',trim(p_full_name)),v_now,v_now,false);

    insert into auth.identities(id,user_id,identity_data,provider,provider_id,last_sign_in_at,created_at,updated_at)
    values(gen_random_uuid(),v_user_id,jsonb_build_object('sub',v_user_id::text,'email',v_email,'email_verified',true),'email',v_user_id::text,v_now,v_now,v_now);

    insert into public.admin_accounts(id,username,full_name,email,role_id,is_active,is_super_admin)
    values(v_user_id,v_username,trim(p_full_name),v_email,p_role_id,coalesce(p_is_active,true),false);

    perform public.admin_log_event('admin_account_create','admin_account',v_user_id::text,jsonb_build_object('username',v_username));
    return jsonb_build_object('success',true,'id',v_user_id,'message','حساب ساخته شد');

  elsif p_action='update' then
    if p_user_id is null then raise exception 'شناسه کاربر لازم است'; end if;
    select * into v_target from public.admin_accounts where id=p_user_id;
    if not found then raise exception 'حساب پیدا نشد'; end if;
    if v_target.is_super_admin then raise exception 'حساب Super Admin از این بخش قابل تغییر نیست'; end if;
    if p_role_id is not null and not exists(select 1 from public.admin_roles where id=p_role_id) then raise exception 'نقش انتخاب‌شده معتبر نیست'; end if;

    update public.admin_accounts set
      full_name=coalesce(nullif(trim(coalesce(p_full_name,'')),''),full_name),
      role_id=coalesce(p_role_id,role_id),
      is_active=coalesce(p_is_active,is_active),
      updated_at=now()
    where id=p_user_id;
    perform public.admin_log_event('admin_account_update','admin_account',p_user_id::text,'{}');
    return jsonb_build_object('success',true,'message','حساب ویرایش شد');

  elsif p_action='reset_password' then
    if p_user_id is null then raise exception 'شناسه کاربر لازم است'; end if;
    if length(coalesce(p_password,'')) < 10 then raise exception 'رمز عبور باید حداقل ۱۰ کاراکتر باشد'; end if;
    if not exists(select 1 from public.admin_accounts where id=p_user_id) then raise exception 'حساب پیدا نشد'; end if;
    update auth.users set encrypted_password=crypt(p_password,gen_salt('bf')),updated_at=now() where id=p_user_id;
    perform public.admin_log_event('admin_password_reset','admin_account',p_user_id::text,'{}');
    return jsonb_build_object('success',true,'message','رمز تغییر کرد');

  elsif p_action='delete' then
    if p_user_id is null then raise exception 'شناسه کاربر لازم است'; end if;
    select * into v_target from public.admin_accounts where id=p_user_id;
    if not found then raise exception 'حساب پیدا نشد'; end if;
    if v_target.is_super_admin then raise exception 'حساب Super Admin قابل حذف نیست'; end if;
    perform public.admin_log_event('admin_account_delete','admin_account',p_user_id::text,jsonb_build_object('username',v_target.username));
    delete from auth.users where id=p_user_id;
    return jsonb_build_object('success',true,'message','حساب حذف شد');
  else
    raise exception 'عملیات نامعتبر است';
  end if;
exception when unique_violation then
  raise exception 'نام کاربری تکراری است';
end;
$$;

revoke all on function public.admin_list_roles() from public;
revoke all on function public.admin_save_role(uuid,text,text,text,text[]) from public;
revoke all on function public.admin_delete_role(uuid) from public;
revoke all on function public.admin_list_accounts() from public;
revoke all on function public.admin_manage_account(text,uuid,text,text,text,uuid,boolean) from public;

grant execute on function public.admin_list_roles() to authenticated;
grant execute on function public.admin_save_role(uuid,text,text,text,text[]) to authenticated;
grant execute on function public.admin_delete_role(uuid) to authenticated;
grant execute on function public.admin_list_accounts() to authenticated;
grant execute on function public.admin_manage_account(text,uuid,text,text,text,uuid,boolean) to authenticated;

commit;
