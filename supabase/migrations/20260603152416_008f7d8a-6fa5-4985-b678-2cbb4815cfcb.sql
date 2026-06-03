
-- Status enum
do $$ begin
  create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
exception when duplicate_object then null; end $$;

create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role public.workspace_role not null default 'member',
  token uuid not null default gen_random_uuid() unique,
  invited_by uuid not null,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workspace_invitations_workspace_idx on public.workspace_invitations(workspace_id);
create index workspace_invitations_email_idx on public.workspace_invitations(lower(email));
create unique index workspace_invitations_unique_pending
  on public.workspace_invitations(workspace_id, lower(email))
  where status = 'pending';

grant select, insert, update, delete on public.workspace_invitations to authenticated;
grant all on public.workspace_invitations to service_role;

alter table public.workspace_invitations enable row level security;

create policy "members read invitations"
  on public.workspace_invitations for select
  to authenticated
  using (public.is_workspace_member(workspace_id, auth.uid()));

create policy "owners insert invitations"
  on public.workspace_invitations for insert
  to authenticated
  with check (
    public.is_workspace_owner(workspace_id, auth.uid())
    and invited_by = auth.uid()
  );

create policy "owners update invitations"
  on public.workspace_invitations for update
  to authenticated
  using (public.is_workspace_owner(workspace_id, auth.uid()));

create policy "owners delete invitations"
  on public.workspace_invitations for delete
  to authenticated
  using (public.is_workspace_owner(workspace_id, auth.uid()));

create trigger set_workspace_invitations_updated_at
  before update on public.workspace_invitations
  for each row execute function public.set_updated_at();

-- Members list (with profile join) — bypasses profiles RLS for fellow members.
create or replace function public.get_workspace_members(_workspace_id uuid)
returns table (
  user_id uuid,
  role public.workspace_role,
  joined_at timestamptz,
  full_name text,
  avatar_url text,
  is_owner boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_workspace_member(_workspace_id, auth.uid()) then
    raise exception 'not authorized';
  end if;
  return query
    select
      m.user_id,
      m.role,
      m.created_at as joined_at,
      p.full_name,
      p.avatar_url,
      (w.owner_id = m.user_id) as is_owner
    from public.workspace_members m
    join public.workspaces w on w.id = m.workspace_id
    left join public.profiles p on p.id = m.user_id
    where m.workspace_id = _workspace_id
    order by (w.owner_id = m.user_id) desc, m.created_at asc;
end;
$$;

-- Accept an invitation: validates token, adds membership, marks accepted.
create or replace function public.accept_invitation(_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _inv public.workspace_invitations%rowtype;
  _uid uuid := auth.uid();
  _email text;
begin
  if _uid is null then
    raise exception 'not authenticated';
  end if;

  select email into _email from auth.users where id = _uid;

  select * into _inv from public.workspace_invitations where token = _token;
  if not found then
    raise exception 'invitation not found';
  end if;
  if _inv.status <> 'pending' then
    raise exception 'invitation is %', _inv.status;
  end if;
  if _inv.expires_at < now() then
    update public.workspace_invitations set status = 'expired' where id = _inv.id;
    raise exception 'invitation expired';
  end if;
  if lower(_inv.email) <> lower(_email) then
    raise exception 'invitation email mismatch';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
    values (_inv.workspace_id, _uid, _inv.role)
    on conflict (workspace_id, user_id) do update set role = excluded.role;

  update public.workspace_invitations
    set status = 'accepted', accepted_at = now(), accepted_by = _uid
    where id = _inv.id;

  update public.profiles
    set current_workspace_id = _inv.workspace_id
    where id = _uid;

  return _inv.workspace_id;
end;
$$;

-- Workspace members table needs PK for upsert on conflict.
do $$ begin
  alter table public.workspace_members
    add constraint workspace_members_pkey primary key (workspace_id, user_id);
exception when invalid_table_definition then null; when others then null; end $$;
