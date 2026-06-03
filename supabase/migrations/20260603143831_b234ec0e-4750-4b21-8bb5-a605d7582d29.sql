
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

revoke execute on function public.is_workspace_member(uuid, uuid) from public, anon;
revoke execute on function public.is_workspace_owner(uuid, uuid) from public, anon;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

grant execute on function public.is_workspace_member(uuid, uuid) to authenticated;
grant execute on function public.is_workspace_owner(uuid, uuid) to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
