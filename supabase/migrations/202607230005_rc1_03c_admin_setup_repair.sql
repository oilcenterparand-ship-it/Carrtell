-- Carrtell RC1-03C
-- Repairs first Super Admin setup when a previous patch already created the Auth user.
-- Safe to run multiple times.

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
  v_existing_identity boolean := false;
begin
  -- Bootstrap permanently closes as soon as the first admin exists.
  if exists(select 1 from public.admin_accounts) then
    raise exception 'راه‌اندازی اولیه قبلاً انجام شده است';
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

  v_email := coalesce(nullif(lower(trim(p_email)), ''), v_username || '@admin.carrtell.local');

  select id into v_owner_role from public.admin_roles where name = 'owner' limit 1;
  if v_owner_role is null then
    raise exception 'نقش مالک سیستم پیدا نشد؛ ابتدا Migration را کامل اجرا کنید';
  end if;

  -- Reuse an existing Auth user when a previous patch already created it.
  -- This avoids forcing the owner to visit another dashboard or delete users manually.
  select id into v_user_id
  from auth.users
  where lower(email) = v_email
  order by created_at asc
  limit 1;

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

  select exists(select 1 from auth.identities where user_id = v_user_id and provider = 'email')
  into v_existing_identity;

  if not v_existing_identity then
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
    id, username, full_name, email, role_id, is_active, is_super_admin
  ) values (
    v_user_id, v_username, trim(p_full_name), v_email, v_owner_role, true, true
  )
  on conflict (id) do update set
    username = excluded.username,
    full_name = excluded.full_name,
    email = excluded.email,
    role_id = excluded.role_id,
    is_active = true,
    is_super_admin = true,
    updated_at = now();

  insert into public.admin_activity_logs(actor_id, action, entity, entity_id, meta)
  values(v_user_id, 'bootstrap_super_admin', 'admin_account', v_user_id::text,
    jsonb_build_object('username',v_username,'source','carrtell_first_run_setup'));

  return jsonb_build_object(
    'success', true,
    'username', v_username,
    'email', v_email,
    'message', 'حساب Super Admin آماده شد'
  );
exception
  when unique_violation then
    raise exception 'نام کاربری یا ایمیل با حساب مدیریتی دیگری تداخل دارد';
end;
$$;

revoke all on function public.bootstrap_first_super_admin(text,text,text,text) from public;
grant execute on function public.bootstrap_first_super_admin(text,text,text,text) to anon, authenticated;
grant execute on function public.admin_setup_status() to anon, authenticated;
