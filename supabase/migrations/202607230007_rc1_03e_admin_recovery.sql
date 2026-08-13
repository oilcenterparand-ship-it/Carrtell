-- RC1-03E: recover a broken first admin installation.
-- Setup remains available while there is no active Super Admin.

create or replace function public.admin_setup_status()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'setup_required', not exists(
      select 1
      from public.admin_accounts
      where is_super_admin = true and is_active = true
    ),
    'admin_count', (select count(*) from public.admin_accounts),
    'active_super_admin_count', (
      select count(*) from public.admin_accounts
      where is_super_admin = true and is_active = true
    ),
    'recovery_mode', exists(select 1 from public.admin_accounts)
      and not exists(
        select 1 from public.admin_accounts
        where is_super_admin = true and is_active = true
      )
  );
$$;

create or replace function public.bootstrap_first_super_admin(
  p_username text,
  p_password text,
  p_full_name text,
  p_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_username text := lower(trim(p_username));
  v_email text;
  v_user_id uuid;
  v_owner_role uuid;
  v_now timestamptz := now();
  v_existing_admin public.admin_accounts%rowtype;
begin
  -- Setup is closed only when a usable active Super Admin exists.
  if exists(
    select 1 from public.admin_accounts
    where is_super_admin = true and is_active = true
  ) then
    raise exception 'راه‌اندازی اولیه قبلاً تکمیل شده است';
  end if;

  if v_username !~ '^[a-z0-9_.\-]{3,40}$' then
    raise exception 'نام کاربری نامعتبر است';
  end if;
  if length(coalesce(p_password, '')) < 10 then
    raise exception 'رمز عبور باید حداقل ۱۰ کاراکتر باشد';
  end if;
  if length(trim(coalesce(p_full_name, ''))) < 2 then
    raise exception 'نام مدیر نامعتبر است';
  end if;

  select id into v_owner_role from public.admin_roles where name = 'owner' limit 1;
  if v_owner_role is null then
    raise exception 'نقش مالک سیستم پیدا نشد؛ Migration نقش‌ها را کامل اجرا کنید';
  end if;

  -- Prefer the existing broken admin account with this username.
  select * into v_existing_admin
  from public.admin_accounts
  where lower(username) = v_username
  limit 1;

  if v_existing_admin.id is not null then
    v_user_id := v_existing_admin.id;
    v_email := coalesce(
      nullif(lower(trim(p_email)), ''),
      nullif(lower(trim(v_existing_admin.email)), ''),
      v_username || '@admin.carrtell.local'
    );

    if not exists(select 1 from auth.users where id = v_user_id) then
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, invited_at, confirmation_token,
        recovery_token, email_change_token_new, email_change,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, is_super_admin
      ) values (
        '00000000-0000-0000-0000-000000000000', v_user_id,
        'authenticated', 'authenticated', v_email,
        crypt(p_password, gen_salt('bf')),
        v_now, v_now, '', '', '', '',
        jsonb_build_object('provider','email','providers',array['email'],'carrtell_admin',true),
        jsonb_build_object('username',v_username,'full_name',trim(p_full_name)),
        v_now, v_now, false
      );
    else
      update auth.users
      set email = v_email,
          encrypted_password = crypt(p_password, gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, v_now),
          raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
            || jsonb_build_object('provider','email','providers',array['email'],'carrtell_admin',true),
          raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
            || jsonb_build_object('username',v_username,'full_name',trim(p_full_name)),
          updated_at = v_now
      where id = v_user_id;
    end if;

    if not exists(select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_user_id,
        jsonb_build_object('sub',v_user_id::text,'email',v_email,'email_verified',true),
        'email', v_user_id::text, v_now, v_now, v_now
      );
    else
      update auth.identities
      set identity_data = jsonb_build_object('sub',v_user_id::text,'email',v_email,'email_verified',true),
          provider_id = v_user_id::text,
          updated_at = v_now
      where user_id = v_user_id and provider = 'email';
    end if;

    update public.admin_accounts
    set full_name = trim(p_full_name),
        email = v_email,
        role_id = v_owner_role,
        is_active = true,
        is_super_admin = true,
        failed_login_attempts = 0,
        locked_until = null,
        updated_at = v_now
    where id = v_user_id;
  else
    v_email := coalesce(nullif(lower(trim(p_email)), ''), v_username || '@admin.carrtell.local');

    select id into v_user_id from auth.users where lower(email) = v_email limit 1;
    if v_user_id is null then
      v_user_id := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, invited_at, confirmation_token,
        recovery_token, email_change_token_new, email_change,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, is_super_admin
      ) values (
        '00000000-0000-0000-0000-000000000000', v_user_id,
        'authenticated', 'authenticated', v_email,
        crypt(p_password, gen_salt('bf')),
        v_now, v_now, '', '', '', '',
        jsonb_build_object('provider','email','providers',array['email'],'carrtell_admin',true),
        jsonb_build_object('username',v_username,'full_name',trim(p_full_name)),
        v_now, v_now, false
      );
    else
      update auth.users
      set encrypted_password = crypt(p_password, gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, v_now),
          raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
            || jsonb_build_object('provider','email','providers',array['email'],'carrtell_admin',true),
          raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
            || jsonb_build_object('username',v_username,'full_name',trim(p_full_name)),
          updated_at = v_now
      where id = v_user_id;
    end if;

    if not exists(select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_user_id,
        jsonb_build_object('sub',v_user_id::text,'email',v_email,'email_verified',true),
        'email', v_user_id::text, v_now, v_now, v_now
      );
    end if;

    insert into public.admin_accounts (
      id, username, full_name, email, role_id, is_active, is_super_admin,
      failed_login_attempts, locked_until
    ) values (
      v_user_id, v_username, trim(p_full_name), v_email, v_owner_role,
      true, true, 0, null
    )
    on conflict (id) do update set
      username = excluded.username,
      full_name = excluded.full_name,
      email = excluded.email,
      role_id = excluded.role_id,
      is_active = true,
      is_super_admin = true,
      failed_login_attempts = 0,
      locked_until = null,
      updated_at = v_now;
  end if;

  insert into public.admin_activity_logs(actor_id, action, entity, entity_id, meta)
  values(v_user_id, 'recover_super_admin', 'admin_account', v_user_id::text,
    jsonb_build_object('username',v_username,'source','carrtell_setup_recovery'));

  return jsonb_build_object(
    'success', true,
    'username', v_username,
    'email', v_email,
    'recovered', v_existing_admin.id is not null,
    'message', 'حساب Super Admin آماده ورود است'
  );
end;
$$;

revoke all on function public.bootstrap_first_super_admin(text,text,text,text) from public;
grant execute on function public.bootstrap_first_super_admin(text,text,text,text) to anon, authenticated;
grant execute on function public.admin_setup_status() to anon, authenticated;
