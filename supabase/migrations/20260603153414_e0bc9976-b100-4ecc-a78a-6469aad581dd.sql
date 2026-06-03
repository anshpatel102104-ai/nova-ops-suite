
-- WORKFLOWS
CREATE TABLE public.workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NULL,
  created_by uuid NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  agent_slug text NOT NULL DEFAULT 'nova',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_template boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflows TO authenticated;
GRANT ALL ON public.workflows TO service_role;

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read workspace or template workflows" ON public.workflows
  FOR SELECT TO authenticated
  USING (
    is_template = true
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()))
  );

CREATE POLICY "members create workflows" ON public.workflows
  FOR INSERT TO authenticated
  WITH CHECK (
    is_template = false
    AND workspace_id IS NOT NULL
    AND public.is_workspace_member(workspace_id, auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "owners update workflows" ON public.workflows
  FOR UPDATE TO authenticated
  USING (
    is_template = false
    AND workspace_id IS NOT NULL
    AND (created_by = auth.uid() OR public.is_workspace_owner(workspace_id, auth.uid()))
  );

CREATE POLICY "owners delete workflows" ON public.workflows
  FOR DELETE TO authenticated
  USING (
    is_template = false
    AND workspace_id IS NOT NULL
    AND (created_by = auth.uid() OR public.is_workspace_owner(workspace_id, auth.uid()))
  );

CREATE TRIGGER trg_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- WORKFLOW RUNS
CREATE TYPE public.workflow_run_status AS ENUM ('pending','running','succeeded','failed');

CREATE TABLE public.workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  input text NOT NULL DEFAULT '',
  status public.workflow_run_status NOT NULL DEFAULT 'pending',
  current_step integer NOT NULL DEFAULT 0,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_duration_ms integer NULL,
  error text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_runs TO authenticated;
GRANT ALL ON public.workflow_runs TO service_role;

ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read workflow runs" ON public.workflow_runs
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "members insert workflow runs" ON public.workflow_runs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND user_id = auth.uid());

CREATE POLICY "owner update workflow runs" ON public.workflow_runs
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_workspace_owner(workspace_id, auth.uid()));

CREATE POLICY "owner delete workflow runs" ON public.workflow_runs
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_workspace_owner(workspace_id, auth.uid()));

CREATE TRIGGER trg_workflow_runs_updated_at
  BEFORE UPDATE ON public.workflow_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_workflow_runs_workspace ON public.workflow_runs (workspace_id, created_at DESC);
CREATE INDEX idx_workflow_runs_workflow ON public.workflow_runs (workflow_id, created_at DESC);
CREATE INDEX idx_workflows_workspace ON public.workflows (workspace_id);

-- SEED TEMPLATES
INSERT INTO public.workflows (workspace_id, created_by, name, description, agent_slug, steps, is_template) VALUES
(NULL, NULL, 'Idea → Pitch → GTM', 'Validate your idea, turn it into a pitch, then map a GTM motion.', 'strategos',
 '[
   {"label":"Validate the idea","tool_slug":"idea-validator","prompt_template":"{{input}}"},
   {"label":"Build the pitch","tool_slug":"pitch-generator","prompt_template":"Validated idea brief:\n{{step_1}}\n\nOriginal idea:\n{{input}}\n\nWrite the investor pitch."},
   {"label":"Plan GTM","tool_slug":"gtm-strategy","prompt_template":"Pitch:\n{{step_2}}\n\nDesign a phased GTM plan for this offer."}
 ]'::jsonb, true),
(NULL, NULL, 'ICP → Offer → Messaging', 'Sharpen the customer, build the offer, then derive messaging angles.', 'compass',
 '[
   {"label":"Define the ICP","tool_slug":"icp-builder","prompt_template":"{{input}}"},
   {"label":"Design the offer","tool_slug":"offer-builder","prompt_template":"ICP:\n{{step_1}}\n\nBusiness context:\n{{input}}\n\nDesign the offer."},
   {"label":"Generate messaging","tool_slug":"messaging-angles","prompt_template":"Offer:\n{{step_2}}\n\nICP:\n{{step_1}}\n\nProduce 5 messaging angles."}
 ]'::jsonb, true),
(NULL, NULL, 'Landing → Content Plan → Lead Magnet', 'Ship a landing page, then build the content engine and lead magnet around it.', 'scribe',
 '[
   {"label":"Write landing copy","tool_slug":"landing-copy","prompt_template":"{{input}}"},
   {"label":"Build content plan","tool_slug":"content-strategy","prompt_template":"Landing positioning:\n{{step_1}}\n\nDesign a 30-day content plan."},
   {"label":"Design lead magnet","tool_slug":"lead-magnet","prompt_template":"Positioning + content themes:\n{{step_1}}\n\n{{step_2}}\n\nDesign the lead magnet."}
 ]'::jsonb, true),
(NULL, NULL, 'Sales Script → Cold Email Sequence', 'Build the discovery-to-close script, then turn it into a 3-step cold sequence.', 'closer',
 '[
   {"label":"Sales script","tool_slug":"sales-script","prompt_template":"{{input}}"},
   {"label":"Cold email sequence","tool_slug":"cold-email","prompt_template":"Discovery + close patterns from the script:\n{{step_1}}\n\nWrite the 3-step cold sequence."}
 ]'::jsonb, true),
(NULL, NULL, 'SOP → Automation Plan', 'Document the SOP, then plan the automation that runs it.', 'forge',
 '[
   {"label":"Build the SOP","tool_slug":"sop-builder","prompt_template":"{{input}}"},
   {"label":"Plan the automation","tool_slug":"automation-planner","prompt_template":"Source SOP:\n{{step_1}}\n\nPlan the automation that runs this end-to-end."}
 ]'::jsonb, true),
(NULL, NULL, 'Full Launch Sprint', 'Nova orchestrates: validate → offer → landing → cold sequence.', 'nova',
 '[
   {"label":"Stress-test the idea","tool_slug":"idea-validator","prompt_template":"{{input}}"},
   {"label":"Design the offer","tool_slug":"offer-builder","prompt_template":"Validated idea:\n{{step_1}}\n\nDesign the offer."},
   {"label":"Landing copy","tool_slug":"landing-copy","prompt_template":"Offer:\n{{step_2}}\n\nWrite the landing page."},
   {"label":"Cold email sequence","tool_slug":"cold-email","prompt_template":"Offer + landing positioning:\n{{step_2}}\n\n{{step_3}}\n\nWrite the cold outreach sequence."}
 ]'::jsonb, true);
