import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { promptForTool } from "./tool-prompts";

const StepSchema = z.object({
  label: z.string().min(1).max(120),
  tool_slug: z.string().min(1).max(80),
  prompt_template: z.string().min(1).max(20000),
});

export const listWorkflows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ workspaceId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("workflows")
      .select("id, name, description, agent_slug, steps, is_template, workspace_id, created_at, updated_at")
      .or(`workspace_id.eq.${data.workspaceId},is_template.eq.true`)
      .order("is_template", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { workflows: rows ?? [] };
  });

export const getWorkflow = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("workflows")
      .select("id, name, description, agent_slug, steps, is_template, workspace_id, created_at, updated_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Workflow not found");
    return { workflow: row };
  });

export const createWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workspaceId: z.string().uuid(),
      name: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      agentSlug: z.string().min(1).max(80).optional(),
      steps: z.array(StepSchema).min(1).max(10),
      fromTemplateId: z.string().uuid().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("workflows")
      .insert({
        workspace_id: data.workspaceId,
        created_by: userId,
        name: data.name,
        description: data.description ?? "",
        agent_slug: data.agentSlug ?? "nova",
        steps: data.steps as never,
        is_template: false,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const updateWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).optional(),
      agentSlug: z.string().min(1).max(80).optional(),
      steps: z.array(StepSchema).min(1).max(10).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.agentSlug !== undefined) patch.agent_slug = data.agentSlug;
    if (data.steps !== undefined) patch.steps = data.steps;
    const { error } = await supabase.from("workflows").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("workflows").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

type StepResult = {
  label: string;
  tool_slug: string;
  status: "pending" | "running" | "succeeded" | "failed";
  output: string | null;
  error: string | null;
  run_id: string | null;
  duration_ms: number | null;
};

function substitute(template: string, input: string, outputs: string[]): string {
  let out = template.replaceAll("{{input}}", input);
  for (let i = 0; i < outputs.length; i++) {
    out = out.replaceAll(`{{step_${i + 1}}}`, outputs[i] ?? "");
  }
  return out;
}

export const runWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workspaceId: z.string().uuid(),
      workflowId: z.string().uuid(),
      input: z.string().min(1).max(20000),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const started = Date.now();

    // Load workflow (template or own)
    const { data: wf, error: wfErr } = await supabase
      .from("workflows")
      .select("id, name, agent_slug, steps")
      .eq("id", data.workflowId)
      .maybeSingle();
    if (wfErr) throw new Error(wfErr.message);
    if (!wf) throw new Error("Workflow not found");

    const steps = (wf.steps as unknown as z.infer<typeof StepSchema>[]) ?? [];
    if (steps.length === 0) throw new Error("Workflow has no steps");

    const initialSteps: StepResult[] = steps.map((s) => ({
      label: s.label,
      tool_slug: s.tool_slug,
      status: "pending",
      output: null,
      error: null,
      run_id: null,
      duration_ms: null,
    }));

    const { data: runRow, error: runErr } = await supabase
      .from("workflow_runs")
      .insert({
        workflow_id: wf.id,
        workspace_id: data.workspaceId,
        user_id: userId,
        input: data.input,
        status: "running",
        current_step: 0,
        steps: initialSteps as never,
      })
      .select("id")
      .single();
    if (runErr) throw new Error(runErr.message);
    const runId = runRow.id as string;

    // Resolve provider/model from workspace defaults
    const { data: ws } = await supabase
      .from("workspaces")
      .select("default_provider, default_model")
      .eq("id", data.workspaceId)
      .maybeSingle();
    const provider = ws?.default_provider;
    const model = ws?.default_model;
    if (!provider || !model) {
      await supabase.from("workflow_runs").update({
        status: "failed",
        error: "No provider/model configured. Set workspace defaults in Settings → AI providers.",
        total_duration_ms: Date.now() - started,
      }).eq("id", runId);
      throw new Error("No provider/model configured.");
    }

    const { resolveProviderKey, callChat } = await import("./ai.server");
    const apiKey = await resolveProviderKey(data.workspaceId, provider);
    if (!apiKey) {
      await supabase.from("workflow_runs").update({
        status: "failed",
        error: `No ${provider} key configured.`,
        total_duration_ms: Date.now() - started,
      }).eq("id", runId);
      throw new Error(`No ${provider} key configured.`);
    }

    const outputs: string[] = [];
    const stepResults = [...initialSteps];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepStarted = Date.now();
      stepResults[i] = { ...stepResults[i], status: "running" };
      await supabase.from("workflow_runs").update({
        current_step: i,
        steps: stepResults as never,
      }).eq("id", runId);

      // Create tool_runs row for this step
      const userPrompt = substitute(step.prompt_template, data.input, outputs);
      const { data: trRow, error: trErr } = await supabase
        .from("tool_runs")
        .insert({
          workspace_id: data.workspaceId,
          user_id: userId,
          tool_slug: step.tool_slug,
          agent_slug: wf.agent_slug,
          provider,
          model,
          input: userPrompt,
          status: "running",
        })
        .select("id")
        .single();
      if (trErr) {
        stepResults[i] = { ...stepResults[i], status: "failed", error: trErr.message, duration_ms: Date.now() - stepStarted };
        await supabase.from("workflow_runs").update({
          status: "failed",
          error: trErr.message,
          steps: stepResults as never,
          total_duration_ms: Date.now() - started,
        }).eq("id", runId);
        throw new Error(trErr.message);
      }
      const toolRunId = trRow.id as string;
      stepResults[i] = { ...stepResults[i], run_id: toolRunId };

      try {
        const system = promptForTool(step.tool_slug);
        const result = await callChat({
          provider,
          apiKey,
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: userPrompt },
          ],
        });

        const dur = Date.now() - stepStarted;
        await supabase.from("tool_runs").update({
          status: "succeeded",
          output: result.text,
          duration_ms: dur,
        }).eq("id", toolRunId);

        outputs.push(result.text);
        stepResults[i] = {
          ...stepResults[i],
          status: "succeeded",
          output: result.text,
          duration_ms: dur,
        };
        await supabase.from("workflow_runs").update({
          steps: stepResults as never,
        }).eq("id", runId);
      } catch (e) {
        const msg = (e as Error).message;
        const dur = Date.now() - stepStarted;
        await supabase.from("tool_runs").update({
          status: "failed",
          error: msg,
          duration_ms: dur,
        }).eq("id", toolRunId);
        stepResults[i] = {
          ...stepResults[i],
          status: "failed",
          error: msg,
          duration_ms: dur,
        };
        await supabase.from("workflow_runs").update({
          status: "failed",
          error: msg,
          steps: stepResults as never,
          total_duration_ms: Date.now() - started,
        }).eq("id", runId);
        throw new Error(msg);
      }
    }

    await supabase.from("workflow_runs").update({
      status: "succeeded",
      current_step: steps.length,
      steps: stepResults as never,
      total_duration_ms: Date.now() - started,
    }).eq("id", runId);

    return { runId };
  });

export const listWorkflowRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workspaceId: z.string().uuid(),
      workflowId: z.string().uuid().optional(),
      limit: z.number().int().min(1).max(50).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("workflow_runs")
      .select("id, workflow_id, status, current_step, steps, total_duration_ms, error, created_at")
      .eq("workspace_id", data.workspaceId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 20);
    if (data.workflowId) q = q.eq("workflow_id", data.workflowId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { runs: rows ?? [] };
  });

export const getWorkflowRun = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("workflow_runs")
      .select("id, workflow_id, workspace_id, input, status, current_step, steps, total_duration_ms, error, created_at, updated_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Run not found");
    return { run: row };
  });
