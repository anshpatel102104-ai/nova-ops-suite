import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { planFor, type PlanId } from "./plan";

const PlanSchema = z.enum(["starter", "pro", "business"]);

function periodStart(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export const getBillingOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ workspaceId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const [{ data: ws }, { data: usageRow }, { count: memberCount }, { count: playbookCount }] = await Promise.all([
      supabase.from("workspaces").select("id, name, plan, owner_id").eq("id", data.workspaceId).maybeSingle(),
      supabase
        .from("workspace_usage")
        .select("tool_runs, workflow_runs, period_start")
        .eq("workspace_id", data.workspaceId)
        .eq("period_start", periodStart())
        .maybeSingle(),
      supabase
        .from("workspace_members")
        .select("user_id", { count: "exact", head: true })
        .eq("workspace_id", data.workspaceId),
      supabase
        .from("workflows")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", data.workspaceId)
        .eq("is_template", false),
    ]);

    if (!ws) throw new Error("Workspace not found");
    const plan = planFor(ws.plan);
    return {
      plan: plan.id,
      planName: plan.name,
      planPrice: plan.price,
      limits: plan.limits,
      isOwner: ws.owner_id === userId,
      usage: {
        tool_runs: usageRow?.tool_runs ?? 0,
        workflow_runs: usageRow?.workflow_runs ?? 0,
        members: memberCount ?? 0,
        custom_playbooks: playbookCount ?? 0,
      },
      periodStart: usageRow?.period_start ?? periodStart(),
    };
  });

export const setWorkspacePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workspaceId: z.string().uuid(),
      plan: PlanSchema,
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ws } = await supabase
      .from("workspaces").select("owner_id").eq("id", data.workspaceId).maybeSingle();
    if (!ws) throw new Error("Workspace not found");
    if (ws.owner_id !== userId) throw new Error("Only the workspace owner can change the plan");

    const { error } = await supabase
      .from("workspaces")
      .update({ plan: data.plan as PlanId })
      .eq("id", data.workspaceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
