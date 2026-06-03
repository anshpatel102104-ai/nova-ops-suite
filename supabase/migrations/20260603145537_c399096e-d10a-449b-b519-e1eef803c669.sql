create or replace function public.get_provider_key_plaintext(
  _workspace_id uuid,
  _provider public.ai_provider
) returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  _sid uuid;
  _plain text;
begin
  select vault_secret_id into _sid
  from public.workspace_provider_keys
  where workspace_id = _workspace_id and provider = _provider;
  if _sid is null then return null; end if;
  select decrypted_secret into _plain from vault.decrypted_secrets where id = _sid;
  return _plain;
end;
$$;

revoke all on function public.get_provider_key_plaintext(uuid, public.ai_provider) from public, anon, authenticated;
grant execute on function public.get_provider_key_plaintext(uuid, public.ai_provider) to service_role;