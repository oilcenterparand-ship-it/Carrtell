-- Carrtell dynamic category tree integrity guard.
-- Prevents an administrator from moving a category below one of its descendants.

create or replace function public.prevent_product_category_cycle()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  cycle_found boolean;
begin
  if new.parent_id is null then
    new.updated_at := now();
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'A category cannot be its own parent';
  end if;

  with recursive ancestors as (
    select id, parent_id
    from public.product_categories
    where id = new.parent_id
    union all
    select category.id, category.parent_id
    from public.product_categories category
    join ancestors on category.id = ancestors.parent_id
  )
  select exists(select 1 from ancestors where id = new.id) into cycle_found;

  if cycle_found then
    raise exception 'Category hierarchy cycle is not allowed';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists product_categories_cycle_guard on public.product_categories;
create trigger product_categories_cycle_guard
before insert or update of parent_id, title, slug, sort_order, is_active, image_url, icon_emoji
on public.product_categories
for each row execute function public.prevent_product_category_cycle();
