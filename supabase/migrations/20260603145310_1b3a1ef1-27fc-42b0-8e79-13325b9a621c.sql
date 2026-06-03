-- Provider enum
create type public.ai_provider as enum ('anthropic', 'openai');

-- Add defaults to workspaces
alter table public.workspaces
  add column default_provider public.ai_provider,
  add column default_model text;

-- Provider keys table (vault stores the actual secret)
create table public.workspace_provider_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider public.ai_provider not null,
  vault_secret_id uuid not null,
  key_hint text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider)
);

grant select, insert, update, delete on public.workspace_provider_keys to authenticated;
grant all on public.workspace_provider_keys to service_role;

alter table public.workspace_provider_keys enable row level security;

-- Members can see which providers are configured (but never the secret value)
create policy "members read provider keys"
on public.workspace_provider_keys for select to authenticated
using (public.is_workspace_member(workspace_id, auth.uid()));

-- Only owners can configure keys
create policy "owners insert provider keys"
on public.workspace_provider_keys for insert to authenticated
with check (public.is_workspace_owner(workspace_id, auth.uid()) and created_by = auth.uid());

create policy "owners update provider keys"
on public.workspace_provider_keys for update to authenticated
using (public.is_workspace_owner(workspace_id, auth.uid()));

create policy "owners delete provider keys"
on public.workspace_provider_keys for delete to authenticated
using (public.is_workspace_owner(workspace_id, auth.uid()));

create trigger workspace_provider_keys_updated_at
before update on public.workspace_provider_keys
for each row execute function public.set_updated_at();

-- Helper: store a provider key in Vault and upsert the row. SECURITY DEFINER so it
-- can write to vault.secrets; permission checked via is_workspace_owner.
create or replace function public.set_provider_key(
  _workspace_id uuid,
  _provider public.ai_provider,
  _plaintext text
) returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  _existing uuid;
  _new_secret uuid;
  _hint text;
begin
  if not public.is_workspace_owner(_workspace_id, auth.uid()) then
    raise exception 'not authorized';
  end if;
  if _plaintext is null or length(_plaintext) < 8 then
    raise exception 'invalid key';
  end if;

  _hint := right(_plaintext, 4);

  select vault_secret_id into _existing
  from public.workspace_provider_keys
  where workspace_id = _workspace_id and provider = _provider;

  if _existing is not null then
    perform vault.update_secret(_existing, _plaintext);
    update public.workspace_provider_keys
      set key_hint = _hint, updated_at = now()
      where workspace_id = _workspace_id and provider = _provider;
  else
    _new_secret := vault.create_secret(
      _plaintext,
      'wpk_' || _workspace_id::text || '_' || _provider::text,
      'Provider API key for workspace ' || _workspace_id::text
    );
    insert into public.workspace_provider_keys
      (workspace_id, provider, vault_secret_id, key_hint, created_by)
    values (_workspace_id, _provider, _new_secret, _hint, auth.uid());
  end if;
end;
$$;

revoke all on function public.set_provider_key(uuid, public.ai_provider, text) from public;
grant execute on function public.set_provider_key(uuid, public.ai_provider, text) to authenticated;

-- Helper: delete a provider key (and its vault secret)
create or replace function public.delete_provider_key(
  _workspace_id uuid,
  _provider public.ai_provider
) returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare _sid uuid;
begin
  if not public.is_workspace_owner(_workspace_id, auth.uid()) then
    raise exception 'not authorized';
  end if;
  select vault_secret_id into _sid
  from public.workspace_provider_keys
  where workspace_id = _workspace_id and provider = _provider;
  if _sid is not null then
    delete from vault.secrets where id = _sid;
    delete from public.workspace_provider_keys
      where workspace_id = _workspace_id and provider = _provider;
  end if;
end;
$$;

revoke all on function public.delete_provider_key(uuid, public.ai_provider) from public;
grant execute on function public.delete_provider_key(uuid, public.ai_provider) to authenticated;