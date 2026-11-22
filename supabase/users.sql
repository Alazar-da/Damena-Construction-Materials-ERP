-- Run in the Supabase SQL Editor to enable super-admin staff invitations.
-- Profile writes go through this guarded function instead of direct table upserts.
create or replace function public.owner_assign_admin_profile(
  p_user_id uuid,
  p_display_name text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin' and is_active
  ) then
    raise exception 'owner access required';
  end if;

  if p_user_id is null then
    raise exception 'user id is required';
  end if;

  if exists (
    select 1 from public.profiles
    where id = p_user_id and role = 'super_admin'
  ) then
    raise exception 'cannot change a super-admin profile through staff invitations';
  end if;

  insert into public.profiles(id, display_name, role, is_active)
  values (p_user_id, nullif(trim(p_display_name), ''), 'manager'::public.app_role, true)
  on conflict (id) do update
    set display_name = excluded.display_name,
        role = excluded.role,
        is_active = true;
end;
$$;

revoke all on function public.owner_assign_admin_profile(uuid, text) from public, anon;
grant execute on function public.owner_assign_admin_profile(uuid, text) to authenticated;
