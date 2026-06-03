
CREATE TABLE public.workspace_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  period_start date NOT NULL,
  tool_runs integer NOT NULL DEFAULT 0,
  workflow_runs integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, period_start)
);

GRANT SELECT ON public.workspace_usage TO authenticated;
GRANT ALL ON public.workspace_usage TO service_role;

ALTER TABLE public.workspace_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read workspace usage"
  ON public.workspace_usage FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE TRIGGER trg_workspace_usage_updated_at
  BEFORE UPDATE ON public.workspace_usage
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Plan limits
CREATE OR REPLACE FUNCTION public.get_plan_limits(_plan workspace_plan)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _plan
    WHEN 'pro'::workspace_plan THEN jsonb_build_object(
      'tool_runs', 1000, 'workflow_runs', 200, 'members', 10, 'custom_playbooks', -1)
    WHEN 'business'::workspace_plan THEN jsonb_build_object(
      'tool_runs', 10000, 'workflow_runs', 2000, 'members', -1, 'custom_playbooks', -1)
    ELSE jsonb_build_object(
      'tool_runs', 50, 'workflow_runs', 10, 'members', 2, 'custom_playbooks', 3)
  END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_plan_limits(workspace_plan) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_plan_limits(workspace_plan) TO authenticated, service_role;

-- Atomic check-and-increment
CREATE OR REPLACE FUNCTION public.check_and_increment_usage(_workspace_id uuid, _kind text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan workspace_plan;
  _limits jsonb;
  _limit int;
  _period date := date_trunc('month', now())::date;
  _current int;
BEGIN
  IF NOT public.is_workspace_member(_workspace_id, auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _kind NOT IN ('tool_runs','workflow_runs') THEN
    RAISE EXCEPTION 'invalid kind';
  END IF;

  SELECT plan INTO _plan FROM public.workspaces WHERE id = _workspace_id;
  _limits := public.get_plan_limits(_plan);
  _limit := (_limits->>_kind)::int;

  INSERT INTO public.workspace_usage (workspace_id, period_start)
    VALUES (_workspace_id, _period)
    ON CONFLICT (workspace_id, period_start) DO NOTHING;

  IF _kind = 'tool_runs' THEN
    UPDATE public.workspace_usage
      SET tool_runs = tool_runs + 1
      WHERE workspace_id = _workspace_id AND period_start = _period
      RETURNING tool_runs INTO _current;
  ELSE
    UPDATE public.workspace_usage
      SET workflow_runs = workflow_runs + 1
      WHERE workspace_id = _workspace_id AND period_start = _period
      RETURNING workflow_runs INTO _current;
  END IF;

  IF _limit >= 0 AND _current > _limit THEN
    -- rollback the increment
    IF _kind = 'tool_runs' THEN
      UPDATE public.workspace_usage SET tool_runs = tool_runs - 1
        WHERE workspace_id = _workspace_id AND period_start = _period;
    ELSE
      UPDATE public.workspace_usage SET workflow_runs = workflow_runs - 1
        WHERE workspace_id = _workspace_id AND period_start = _period;
    END IF;
    RETURN jsonb_build_object('allowed', false, 'usage', _current - 1, 'limit', _limit);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'usage', _current, 'limit', _limit);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_and_increment_usage(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_increment_usage(uuid, text) TO authenticated, service_role;
