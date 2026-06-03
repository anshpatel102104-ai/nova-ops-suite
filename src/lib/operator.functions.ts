import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RouteSchema = z.enum([
  "general", "validation", "strategy", "offer", "gtm", "copy", "outreach", "automation", "knowledge",
]);

export const listSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ workspaceId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("operator_sessions")
      .select("id, title, updated_at, created_at")
      .eq("workspace_id", data.workspaceId)
      .order("updated_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return { sessions: rows ?? [] };
  });

export const getSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ workspaceId: z.string().uuid(), sessionId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: session }, { data: messages }, { data: recs }] = await Promise.all([
      supabase.from("operator_sessions").select("*").eq("id", data.sessionId).maybeSingle(),
      supabase
        .from("operator_messages")
        .select("id, role, content, specialist, provider, model, status, error, duration_ms, created_at")
        .eq("session_id", data.sessionId)
        .order("created_at", { ascending: true }),
      supabase
        .from("operator_recommendations")
        .select("id, message_id, label, description, action_kind, target, payload, acted_at, dismissed_at, created_at")
        .eq("session_id", data.sessionId)
        .order("created_at", { ascending: true }),
    ]);
    return { session, messages: messages ?? [], recommendations: recs ?? [] };
  });

export const createSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workspaceId: z.string().uuid(),
      title: z.string().min(1).max(120).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("operator_sessions")
      .insert({
        workspace_id: data.workspaceId,
        user_id: userId,
        title: data.title ?? "New session",
      })
      .select("id, title, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return { session: row };
  });

export const deleteSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ workspaceId: z.string().uuid(), sessionId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("operator_sessions")
      .delete()
      .eq("id", data.sessionId)
      .eq("workspace_id", data.workspaceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workspaceId: z.string().uuid(),
      sessionId: z.string().uuid(),
      input: z.string().min(1).max(8000),
      routeHint: RouteSchema.optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const started = Date.now();

    // Enforce usage cap (re-uses tool_runs bucket so plan limits stay one source of truth)
    const { data: usage } = await supabase.rpc("check_and_increment_usage", {
      _workspace_id: data.workspaceId,
      _kind: "tool_runs",
    });
    const u = usage as { allowed: boolean; usage: number; limit: number } | null;
    if (u && !u.allowed) {
      throw new Error(`Monthly Operator/tool limit reached (${u.usage}/${u.limit}). Upgrade your plan.`);
    }

    // Workspace context for the prompt
    const { data: ws } = await supabase
      .from("workspaces")
      .select("name, plan")
      .eq("id", data.workspaceId)
      .maybeSingle();

    const [{ data: recentAssets }, { data: recentRuns }] = await Promise.all([
      supabase
        .from("assets")
        .select("name, type, tags, created_at")
        .eq("workspace_id", data.workspaceId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("tool_runs")
        .select("tool_slug, status, created_at")
        .eq("workspace_id", data.workspaceId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // Prior conversation
    const { data: priorMsgs } = await supabase
      .from("operator_messages")
      .select("role, content")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: true })
      .limit(20);

    const {
      pickSpecialist, buildSystemPrompt, callOperator, buildRecommendations,
    } = await import("./operator.server");

    const route = data.routeHint ?? pickSpecialist(data.input);

    const contextSummary = [
      "## Workspace context",
      recentAssets && recentAssets.length
        ? `Recent assets: ${recentAssets.map((a) => `${a.name} (${a.type})`).join(", ")}`
        : "Recent assets: none yet.",
      recentRuns && recentRuns.length
        ? `Recent tool runs: ${recentRuns.map((r) => `${r.tool_slug} [${r.status}]`).join(", ")}`
        : "Recent tool runs: none yet.",
    ].join("\n");

    const systemPrompt = buildSystemPrompt({
      route,
      workspaceName: ws?.name ?? "Workspace",
      planName: (ws?.plan as string) ?? "starter",
      contextSummary,
    });

    // Persist the user message first
    const { data: userMsg, error: userErr } = await supabase
      .from("operator_messages")
      .insert({
        session_id: data.sessionId,
        workspace_id: data.workspaceId,
        user_id: userId,
        role: "user",
        content: data.input,
        specialist: route,
        status: "completed",
      })
      .select("id, created_at")
      .single();
    if (userErr) throw new Error(userErr.message);

    // Insert a placeholder assistant row so the UI can show "thinking"
    const { data: pending, error: pendErr } = await supabase
      .from("operator_messages")
      .insert({
        session_id: data.sessionId,
        workspace_id: data.workspaceId,
        user_id: userId,
        role: "assistant",
        content: "",
        specialist: route,
        status: "running",
      })
      .select("id")
      .single();
    if (pendErr) throw new Error(pendErr.message);
    const assistantId = pending.id as string;

    try {
      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...((priorMsgs ?? [])
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }))),
        { role: "user" as const, content: data.input },
      ];

      const result = await callOperator({ workspaceId: data.workspaceId, messages });

      await supabase
        .from("operator_messages")
        .update({
          content: result.text,
          provider: result.provider,
          model: result.model,
          status: "completed",
          duration_ms: Date.now() - started,
        })
        .eq("id", assistantId);

      // Recommendations
      const recs = buildRecommendations({
        route, userInput: data.input, assistantOutput: result.text,
      });
      if (recs.length) {
        await supabase.from("operator_recommendations").insert(
          recs.map((r) => ({
            message_id: assistantId,
            session_id: data.sessionId,
            workspace_id: data.workspaceId,
            label: r.label,
            description: r.description,
            action_kind: r.action_kind,
            target: r.target,
            payload: r.payload as never,
          })),
        );
      }

      // Auto-title the session on the first exchange
      if ((priorMsgs?.length ?? 0) === 0) {
        const title = data.input.slice(0, 80).replace(/\s+/g, " ").trim();
        await supabase
          .from("operator_sessions")
          .update({ title })
          .eq("id", data.sessionId);
      } else {
        await supabase
          .from("operator_sessions")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", data.sessionId);
      }

      return {
        userMessageId: userMsg.id,
        assistantMessageId: assistantId,
        route,
        provider: result.provider,
        model: result.model,
      };
    } catch (e) {
      const message = (e as Error).message;
      await supabase
        .from("operator_messages")
        .update({ status: "failed", error: message, duration_ms: Date.now() - started })
        .eq("id", assistantId);
      throw new Error(message);
    }
  });

export const logAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workspaceId: z.string().uuid(),
      sessionId: z.string().uuid().optional(),
      recommendationId: z.string().uuid().optional(),
      actionKind: z.string().min(1).max(50),
      target: z.string().max(120).optional(),
      payload: z.record(z.string(), z.unknown()).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("operator_actions_log").insert({
      workspace_id: data.workspaceId,
      user_id: userId,
      session_id: data.sessionId ?? null,
      recommendation_id: data.recommendationId ?? null,
      action_kind: data.actionKind,
      target: data.target ?? null,
      payload: (data.payload ?? {}) as never,
    });
    if (error) throw new Error(error.message);
    if (data.recommendationId) {
      await supabase
        .from("operator_recommendations")
        .update({ acted_at: new Date().toISOString() })
        .eq("id", data.recommendationId);
    }
    return { ok: true };
  });

export const saveResponseAsAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workspaceId: z.string().uuid(),
      messageId: z.string().uuid(),
      name: z.string().min(1).max(160),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: msg, error: mErr } = await supabase
      .from("operator_messages")
      .select("content, specialist")
      .eq("id", data.messageId)
      .maybeSingle();
    if (mErr) throw new Error(mErr.message);
    if (!msg) throw new Error("Message not found");

    const { data: asset, error } = await supabase
      .from("assets")
      .insert({
        workspace_id: data.workspaceId,
        user_id: userId,
        name: data.name,
        type: "other",
        body: msg.content,
        tags: ["nova-operator", msg.specialist ?? "general"],
      })
      .select("id, name")
      .single();
    if (error) throw new Error(error.message);
    return { asset };
  });
