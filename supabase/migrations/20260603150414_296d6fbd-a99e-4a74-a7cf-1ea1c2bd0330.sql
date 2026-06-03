
create type public.tool_run_status as enum ('pending','running','succeeded','failed');

create table public.tool_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_slug text not null,
  agent_slug text,
  provider public.ai_provider,
  model text,
  input text not null,
  output text,
  error text,
  status public.tool_run_status not null default 'pending',
  duration_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tool_runs_workspace_tool on public.tool_runs (workspace_id, tool_slug, created_at desc);
create index idx_tool_runs_user on public.tool_runs (user_id, created_at desc);

grant select, insert, update, delete on public.tool_runs to authenticated;
grant all on public.tool_runs to service_role;

alter table public.tool_runs enable row level security;

create policy "members read tool runs"
on public.tool_runs for select to authenticated
using (public.is_workspace_member(workspace_id, auth.uid()));

create policy "members insert own tool runs"
on public.tool_runs for insert to authenticated
with check (public.is_workspace_member(workspace_id, auth.uid()) and user_id = auth.uid());

create policy "owner update tool runs"
on public.tool_runs for update to authenticated
using (user_id = auth.uid());

create policy "owner delete tool runs"
on public.tool_runs for delete to authenticated
using (user_id = auth.uid() or public.is_workspace_owner(workspace_id, auth.uid()));

create trigger tool_runs_set_updated_at
before update on public.tool_runs
for each row execute function public.set_updated_at();
