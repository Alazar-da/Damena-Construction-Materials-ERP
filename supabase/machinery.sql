-- Machinery inventory for admins and the owner portal.
-- Run once in the Supabase SQL editor for existing installations.

create table if not exists public.machinery (
  id uuid primary key default gen_random_uuid(),
  name text not null check (nullif(trim(name), '') is not null),
  category text not null default 'other',
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  status text not null default 'available' check (status in ('available','in_use','maintenance','out_of_service')),
  location text,
  notes text,
  photo_path text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.machinery add column if not exists photo_path text;

alter table public.machinery enable row level security;

drop policy if exists machinery_read on public.machinery;
create policy machinery_read on public.machinery for select to authenticated using (public.is_admin());

drop policy if exists machinery_insert on public.machinery;
create policy machinery_insert on public.machinery for insert to authenticated
  with check (public.is_admin() and (created_by is null or created_by = auth.uid()));

grant select, insert on public.machinery to authenticated;

insert into storage.buckets (id, name, public)
values ('machinery-photos', 'machinery-photos', false)
on conflict (id) do update set public = false;

drop policy if exists machinery_photos_read on storage.objects;
create policy machinery_photos_read on storage.objects for select to authenticated
  using (bucket_id = 'machinery-photos' and public.is_admin());

drop policy if exists machinery_photos_insert on storage.objects;
create policy machinery_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'machinery-photos' and public.is_admin());
