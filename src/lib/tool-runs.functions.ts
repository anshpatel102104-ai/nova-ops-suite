import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { promptForTool } from "./tool-prompts";

const ProviderSchema = z.enum(["anthropic", "openai"]);

export const runTool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workspaceId: z.string().uuid(),
      toolSlug: z.string().min(1).max(80),
      agentSlug: z.string().min(1).max(80).optional(),
      input: z.string().min(1).max(20000),
      provider: ProviderSchema.optional(),
      model: z.string().min(1).max(120).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const started = Date.now();

    // Enforce monthly usage cap atomically.
    const { data: usage, error: usageErr } = await supabase.rpc("check_and_increment_usage", {
      _workspace_id: data.workspaceId,
      _kind: "tool_runs",
    });
    if (usageErr) throw new Error(usageErr.message);
    const u = usage as { allowed: boolean; usage: number; limit: number } | null;
    if (u && !u.allowed) {
      throw new Error(`Monthly tool-run limit reached (${u.usage}/${u.limit}). Upgrade your plan to continue.`);
    }


    // Create pending run row first so it shows up in history even on failure.
    const { data: row, error: insErr } = await supabase
      .from("tool_runs")
      .insert({
        workspace_id: data.workspaceId,
        user_id: userId,
        tool_slug: data.toolSlug,
        agent_slug: data.agentSlug ?? null,
        provider: data.provider ?? null,
        model: data.model ?? null,
        input: data.input,
        status: "running",
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);
    const runId = row.id as string;

    try {
      // Resolve provider/model: per-call > workspace default.
      const { data: ws } = await supabase
        .from("workspaces")
        .select("default_provider, default_model")
        .eq("id", data.workspaceId)
        .maybeSingle();
      const provider = data.provider ?? ws?.default_provider;
      const model = data.model ?? ws?.default_model;
      if (!provider || !model) {
        throw new Error("No provider/model configured. Set workspace defaults in Settings → AI providers.");
      }

      const { resolveProviderKey, callChat } = await import("./ai.server");
      const apiKey = await resolveProviderKey(data.workspaceId, provider);
      if (!apiKey) throw new Error(`No ${provider} key configured for this workspace.`);

      const system = promptForTool(data.toolSlug);
      const result = await callChat({
        provider,
        apiKey,
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: data.input },
        ],
      });

      await supabase
        .from("tool_runs")
        .update({
          status: "succeeded",
          output: result.text,
          provider,
          model,
          duration_ms: Date.now() - started,
        })
        .eq("id", runId);

      return { runId, output: result.text, provider, model };
    } catch (e) {
      const message = (e as Error).message;
      await supabase
        .from("tool_runs")
        .update({
          status: "failed",
          error: message,
          duration_ms: Date.now() - started,
        })
        .eq("id", runId);
      throw new Error(message);
    }
  });

export const listToolRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workspaceId: z.string().uuid(),
      toolSlug: z.string().min(1).max(80),
      limit: z.number().int().min(1).max(50).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("tool_runs")
      .select("id, status, input, output, error, provider, model, duration_ms, created_at")
      .eq("workspace_id", data.workspaceId)
      .eq("tool_slug", data.toolSlug)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 20);
    if (error) throw new Error(error.message);
    return { runs: rows ?? [] };
  });
