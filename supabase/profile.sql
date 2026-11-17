-- Personal profile updates for signed-in users.
-- Run once in the Supabase SQL editor for existing installations.

create or replace function public.update_my_profile(p_display_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if nullif(trim(p_display_name), '') is null then
    raise exception 'name is required';
  end if;

  update public.profiles
  set display_name = trim(p_display_name)
  where id = auth.uid() and is_active;

  if not found then
    raise exception 'profile not found';
  end if;
end;
$$;

revoke all on function public.update_my_profile(text) from public, anon;
grant execute on function public.update_my_profile(text) to authenticated;
