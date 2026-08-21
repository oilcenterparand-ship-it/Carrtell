-- Carrtell: optional username/password after verified phone login.
begin;

alter table public.profiles add column if not exists username text;

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null and length(trim(username)) > 0;

alter table public.profiles drop constraint if exists profiles_username_format_check;
alter table public.profiles add constraint profiles_username_format_check
  check (username is null or username ~ '^[a-z0-9_.-]{3,32}$');

commit;
