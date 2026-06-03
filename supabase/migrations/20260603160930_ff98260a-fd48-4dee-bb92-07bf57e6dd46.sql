-- =========================================================
-- Backend hardening: indexes + Nova Operator schema
-- =========================================================

-- ---------- Indexes for production read patterns ----------
CREATE INDEX IF NOT EXISTS idx_assets_workspace_created   ON public.assets(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_user                ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_source_run          ON public.assets(source_run_id);

CREATE INDEX IF NOT EXISTS idx_tool_runs_ws_created       ON public.tool_runs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_runs_ws_slug_created  ON public.tool_runs(workspace_id, tool_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_runs_user             ON public.tool_runs(user_id);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_ws_created   ON public.workflow_runs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow     ON public.workflow_runs(workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_user         ON public.workflow_runs(user_id);

CREATE INDEX IF NOT EXISTS idx_workflows_ws               ON public.workflows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflows_created_by       ON public.workflows(created_by);
CREATE INDEX IF NOT EXISTS idx_workflows_template         ON public.workflows(is_template) WHERE is_template = true;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread  ON public.notifications(user_id, workspace_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_all     ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_members_user               ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email          ON public.workspace_invitations(lower(email));
CREATE INDEX IF NOT EXISTS idx_invitations_ws_status      ON public.workspace_invitations(workspace_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_invitations_token    ON public.workspace_invitations(token);

CREATE INDEX IF NOT EXISTS idx_profiles_current_ws        ON public.profiles(current_workspace_id);
CREATE INDEX IF NOT EXISTS idx_nova_cfg_ws                ON public.nova_system_configs(workspace_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_nova_cfg_ws_slug     ON public.nova_system_configs(workspace_id, system_slug);

-- ---------- Nova Operator tables ----------
CREATE TABLE IF NOT EXISTS public.operator_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New session',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operator_sessions TO authenticated;
GRANT ALL ON public.operator_sessions TO service_role;
ALTER TABLE public.operator_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read op sessions" ON public.operator_sessions
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members insert own op sessions" ON public.operator_sessions
  FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND user_id = auth.uid());
CREATE POLICY "owner update op sessions" ON public.operator_sessions
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_workspace_owner(workspace_id, auth.uid()));
CREATE POLICY "owner delete op sessions" ON public.operator_sessions
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_workspace_owner(workspace_id, auth.uid()));
CREATE INDEX IF NOT EXISTS idx_op_sessions_ws ON public.operator_sessions(workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_op_sessions_user ON public.operator_sessions(user_id);
CREATE TRIGGER tg_op_sessions_updated BEFORE UPDATE ON public.operator_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.operator_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.operator_sessions(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  specialist text,
  provider text,
  model text,
  status text NOT NULL DEFAULT 'completed',
  error text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operator_messages TO authenticated;
GRANT ALL ON public.operator_messages TO service_role;
ALTER TABLE public.operator_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read op messages" ON public.operator_messages
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members insert own op messages" ON public.operator_messages
  FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_op_messages_session ON public.operator_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_op_messages_ws ON public.operator_messages(workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.operator_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.operator_messages(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.operator_sessions(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  label text NOT NULL,
  description text,
  action_kind text NOT NULL,
  target text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  dismissed_at timestamptz,
  acted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operator_recommendations TO authenticated;
GRANT ALL ON public.operator_recommendations TO service_role;
ALTER TABLE public.operator_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read op recs" ON public.operator_recommendations
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members insert op recs" ON public.operator_recommendations
  FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members update op recs" ON public.operator_recommendations
  FOR UPDATE TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE INDEX IF NOT EXISTS idx_op_recs_session ON public.operator_recommendations(session_id, created_at);

CREATE TABLE IF NOT EXISTS public.operator_actions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  session_id uuid REFERENCES public.operator_sessions(id) ON DELETE SET NULL,
  recommendation_id uuid REFERENCES public.operator_recommendations(id) ON DELETE SET NULL,
  action_kind text NOT NULL,
  target text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operator_actions_log TO authenticated;
GRANT ALL ON public.operator_actions_log TO service_role;
ALTER TABLE public.operator_actions_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read op actions" ON public.operator_actions_log
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members insert own op actions" ON public.operator_actions_log
  FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_op_actions_ws ON public.operator_actions_log(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_op_actions_session ON public.operator_actions_log(session_id);
