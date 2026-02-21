create extension if not exists pgcrypto;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(lower(trim(auth.jwt() ->> 'email')) = 'dgarciasantillan@gmail.com', false);
$$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  precio_base numeric not null check (precio_base >= 0),
  precio_ars numeric check (precio_ars is null or precio_ars >= 0),
  precio_usd numeric check (precio_usd is null or precio_usd >= 0),
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  cuotas int not null default 1 check (cuotas >= 1),
  interes numeric not null default 0 check (interes >= 0),
  imagenes text[] not null default '{}',
  creado_por uuid not null references auth.users(id) on delete restrict,
  fecha_creacion timestamptz not null default now(),
  estado text not null default 'Disponible' check (estado in ('Disponible', 'Vendido', 'Proximamente')),
  comprador_id uuid references auth.users(id) on delete set null
);

alter table public.products
  add column if not exists precio_ars numeric check (precio_ars is null or precio_ars >= 0),
  add column if not exists precio_usd numeric check (precio_usd is null or precio_usd >= 0),
  add column if not exists moneda text default 'ARS' check (moneda in ('ARS', 'USD')),
  add column if not exists cuotas int default 1 check (cuotas >= 1),
  add column if not exists interes numeric default 0 check (interes >= 0),
  add column if not exists tiempo_uso text,
  add column if not exists cuotas_ars int default 1 check (cuotas_ars >= 1),
  add column if not exists interes_ars numeric default 0 check (interes_ars >= 0),
  add column if not exists cuotas_usd int default 1 check (cuotas_usd >= 1),
  add column if not exists interes_usd numeric default 0 check (interes_usd >= 0);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0 and length(name) <= 60),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null check (length(trim(name)) > 0 and length(name) <= 60),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (category_id, name)
);

alter table public.products
  add column if not exists categoria_id uuid references public.categories(id) on delete set null,
  add column if not exists subcategoria_id uuid references public.subcategories(id) on delete set null;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  texto text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  foto text,
  fecha timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  monto numeric not null check (monto > 0),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  fecha timestamptz not null default now(),
  aceptada boolean not null default false
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null check (length(trim(message)) > 0 and length(message) <= 140),
  tone text not null default 'info' check (tone in ('info', 'success', 'warning')),
  active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists products_fecha_creacion_idx on public.products (fecha_creacion desc);
create index if not exists comments_product_fecha_idx on public.comments (product_id, fecha desc);
create index if not exists offers_product_fecha_idx on public.offers (product_id, fecha desc);
create index if not exists announcements_created_at_idx on public.announcements (created_at desc);
create index if not exists categories_created_at_idx on public.categories (created_at desc);
create index if not exists subcategories_category_idx on public.subcategories (category_id, created_at desc);

alter table public.products enable row level security;
alter table public.comments enable row level security;
alter table public.offers enable row level security;
alter table public.announcements enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;

drop policy if exists products_select_all on public.products;
create policy products_select_all on public.products for select using (true);

drop policy if exists products_insert_admin on public.products;
create policy products_insert_admin on public.products
for insert to authenticated
with check (public.is_admin());

drop policy if exists products_update_admin on public.products;
create policy products_update_admin on public.products
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists products_delete_admin on public.products;
create policy products_delete_admin on public.products
for delete to authenticated
using (public.is_admin());

drop policy if exists comments_select_all on public.comments;
create policy comments_select_all on public.comments for select using (true);

drop policy if exists comments_insert_authenticated on public.comments;
create policy comments_insert_authenticated on public.comments
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists offers_select_all on public.offers;
create policy offers_select_all on public.offers for select using (true);

drop policy if exists offers_insert_authenticated on public.offers;
create policy offers_insert_authenticated on public.offers
for insert to authenticated
with check (auth.uid() = user_id and aceptada = false);

drop policy if exists announcements_select_all on public.announcements;
create policy announcements_select_all on public.announcements for select using (true);

drop policy if exists announcements_insert_admin on public.announcements;
create policy announcements_insert_admin on public.announcements
for insert to authenticated
with check (public.is_admin());

drop policy if exists announcements_update_admin on public.announcements;
create policy announcements_update_admin on public.announcements
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists announcements_delete_admin on public.announcements;
create policy announcements_delete_admin on public.announcements
for delete to authenticated
using (public.is_admin());

drop policy if exists categories_select_all on public.categories;
create policy categories_select_all on public.categories for select using (true);

drop policy if exists categories_insert_admin on public.categories;
create policy categories_insert_admin on public.categories
for insert to authenticated
with check (public.is_admin());

drop policy if exists categories_update_admin on public.categories;
create policy categories_update_admin on public.categories
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists categories_delete_admin on public.categories;
create policy categories_delete_admin on public.categories
for delete to authenticated
using (public.is_admin());

drop policy if exists subcategories_select_all on public.subcategories;
create policy subcategories_select_all on public.subcategories for select using (true);

drop policy if exists subcategories_insert_admin on public.subcategories;
create policy subcategories_insert_admin on public.subcategories
for insert to authenticated
with check (public.is_admin());

drop policy if exists subcategories_update_admin on public.subcategories;
create policy subcategories_update_admin on public.subcategories
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists subcategories_delete_admin on public.subcategories;
create policy subcategories_delete_admin on public.subcategories
for delete to authenticated
using (public.is_admin());

create or replace function public.buy_product(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.products
  set estado = 'Vendido',
      comprador_id = auth.uid()
  where id = p_product_id
    and estado = 'Disponible';

  if not found then
    raise exception 'Product is not available';
  end if;
end;
$$;

revoke all on function public.buy_product(uuid) from public;
grant execute on function public.buy_product(uuid) to authenticated;

create or replace function public.accept_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_offer public.offers;
begin
  if not public.is_admin() then
    raise exception 'Only admin can accept offers';
  end if;

  select * into target_offer
  from public.offers
  where id = p_offer_id;

  if target_offer.id is null then
    raise exception 'Offer not found';
  end if;

  update public.offers
  set aceptada = true
  where id = p_offer_id;

  update public.products
  set estado = 'Vendido',
      comprador_id = target_offer.user_id
  where id = target_offer.product_id
    and estado = 'Disponible';
end;
$$;

revoke all on function public.accept_offer(uuid) from public;
grant execute on function public.accept_offer(uuid) to authenticated;

-- Storage bucket for product images.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update
set public = excluded.public;

-- Storage policies (admin can upload/update/delete, anyone can read public bucket).
drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read
on storage.objects
for select
using (bucket_id = 'product-images');

drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images' and public.is_admin());
