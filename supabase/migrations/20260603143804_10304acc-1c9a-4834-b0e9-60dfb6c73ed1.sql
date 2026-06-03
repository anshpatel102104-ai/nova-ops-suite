
-- Enums
create type public.app_role as enum ('admin', 'moderator', 'user');
create type public.workspace_role as enum ('owner', 'admin', 'member');
create type public.workspace_plan as enum ('starter', 'launch', 'scale', 'enterprise');

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  onboarded boolean not null default false,
  current_workspace_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- WORKSPACES
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan public.workspace_plan not null default 'starter',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.workspaces to authenticated;
grant all on public.workspaces to service_role;
alter table public.workspaces enable row level security;
create trigger workspaces_set_updated_at before update on public.workspaces for each row execute function public.set_updated_at();

-- WORKSPACE MEMBERS
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
grant select, insert, update, delete on public.workspace_members to authenticated;
grant all on public.workspace_members to service_role;
alter table public.workspace_members enable row level security;

-- security definer helpers (avoid recursive RLS)
create or replace function public.is_workspace_member(_workspace_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspace_members where workspace_id = _workspace_id and user_id = _user_id);
$$;

create or replace function public.is_workspace_owner(_workspace_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspaces where id = _workspace_id and owner_id = _user_id);
$$;

-- Workspace policies
create policy "members read workspace" on public.workspaces for select to authenticated
  using (public.is_workspace_member(id, auth.uid()));
create policy "authenticated create workspace" on public.workspaces for insert to authenticated
  with check (owner_id = auth.uid());
create policy "owner update workspace" on public.workspaces for update to authenticated
  using (owner_id = auth.uid());
create policy "owner delete workspace" on public.workspaces for delete to authenticated
  using (owner_id = auth.uid());

-- Member policies
create policy "members read members" on public.workspace_members for select to authenticated
  using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "owner insert members" on public.workspace_members for insert to authenticated
  with check (public.is_workspace_owner(workspace_id, auth.uid()) or user_id = auth.uid());
create policy "owner update members" on public.workspace_members for update to authenticated
  using (public.is_workspace_owner(workspace_id, auth.uid()));
create policy "owner delete members" on public.workspace_members for delete to authenticated
  using (public.is_workspace_owner(workspace_id, auth.uid()) or user_id = auth.uid());

-- USER ROLES (global app-level)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create policy "users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Trigger: new user -> profile + default workspace + owner membership
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ws_id uuid;
  ws_name text;
  full_name text;
begin
  full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  ws_name := coalesce(new.raw_user_meta_data->>'company', full_name || '''s Workspace');

  insert into public.workspaces (name, owner_id) values (ws_name, new.id) returning id into ws_id;
  insert into public.workspace_members (workspace_id, user_id, role) values (ws_id, new.id, 'owner');
  insert into public.profiles (id, full_name, current_workspace_id) values (new.id, full_name, ws_id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
