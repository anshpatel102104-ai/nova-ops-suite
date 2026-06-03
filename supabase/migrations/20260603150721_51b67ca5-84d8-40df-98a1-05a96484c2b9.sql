
create type public.asset_type as enum ('offer','script','proposal','campaign','content','workflow','other');

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_run_id uuid references public.tool_runs(id) on delete set null,
  name text not null,
  type public.asset_type not null default 'other',
  body text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_assets_workspace on public.assets (workspace_id, created_at desc);

grant select, insert, update, delete on public.assets to authenticated;
grant all on public.assets to service_role;
alter table public.assets enable row level security;

create policy "members read assets" on public.assets for select to authenticated
  using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "members insert assets" on public.assets for insert to authenticated
  with check (public.is_workspace_member(workspace_id, auth.uid()) and user_id = auth.uid());
create policy "owner update assets" on public.assets for update to authenticated
  using (user_id = auth.uid() or public.is_workspace_owner(workspace_id, auth.uid()));
create policy "owner delete assets" on public.assets for delete to authenticated
  using (user_id = auth.uid() or public.is_workspace_owner(workspace_id, auth.uid()));

create trigger assets_set_updated_at before update on public.assets
  for each row execute function public.set_updated_at();

-- Nova OS system per-workspace configs
create table public.nova_system_configs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  system_slug text not null,
  active boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, system_slug)
);
create index idx_system_configs_ws on public.nova_system_configs (workspace_id);

grant select, insert, update, delete on public.nova_system_configs to authenticated;
grant all on public.nova_system_configs to service_role;
alter table public.nova_system_configs enable row level security;

create policy "members read system configs" on public.nova_system_configs for select to authenticated
  using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "members insert system configs" on public.nova_system_configs for insert to authenticated
  with check (public.is_workspace_member(workspace_id, auth.uid()));
create policy "members update system configs" on public.nova_system_configs for update to authenticated
  using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "owners delete system configs" on public.nova_system_configs for delete to authenticated
  using (public.is_workspace_owner(workspace_id, auth.uid()));

create trigger nova_system_configs_set_updated_at before update on public.nova_system_configs
  for each row execute function public.set_updated_at();
