import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const WorkspaceInput = z.object({ workspaceId: z.string().uuid() });

function daysAgoISO(n: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => WorkspaceInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const since = daysAgoISO(13); // include today = 14 buckets

    const [runsRes, systemsRes, assetsRes] = await Promise.all([
      supabase
        .from("tool_runs")
        .select("id, tool_slug, status, created_at, duration_ms")
        .eq("workspace_id", data.workspaceId)
        .gte("created_at", since)
        .order("created_at", { ascending: false }),
      supabase
        .from("nova_system_configs")
        .select("system_slug, active, last_run_at, updated_at")
        .eq("workspace_id", data.workspaceId),
      supabase
        .from("assets")
        .select("id, created_at")
        .eq("workspace_id", data.workspaceId)
        .gte("created_at", since),
    ]);

    if (runsRes.error) throw new Error(runsRes.error.message);
    if (systemsRes.error) throw new Error(systemsRes.error.message);
    if (assetsRes.error) throw new Error(assetsRes.error.message);

    const runs = runsRes.data ?? [];
    const systems = systemsRes.data ?? [];
    const assets = assetsRes.data ?? [];

    // 14-day series
    const series: { d: string; runs: number; assets: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = new Date();
      day.setUTCHours(0, 0, 0, 0);
      day.setUTCDate(day.getUTCDate() - i);
      const key = day.toISOString().slice(0, 10);
      series.push({
        d: day.toLocaleDateString(undefined, { month: "short", day: "2-digit" }),
        runs: runs.filter((r) => r.created_at.slice(0, 10) === key).length,
        assets: assets.filter((a) => a.created_at.slice(0, 10) === key).length,
      });
    }

    // Tool usage breakdown (top 6)
    const usage = new Map<string, number>();
    runs.forEach((r) => usage.set(r.tool_slug, (usage.get(r.tool_slug) ?? 0) + 1));
    const toolUsage = [...usage.entries()]
      .map(([slug, v]) => ({ slug, v }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 6);

    const succeeded = runs.filter((r) => r.status === "succeeded").length;
    const failed = runs.filter((r) => r.status === "failed").length;
    const activeSystems = systems.filter((s) => s.active).length;

    return {
      totals: {
        runs14d: runs.length,
        succeeded,
        failed,
        assets14d: assets.length,
        activeSystems,
        totalSystems: systems.length,
      },
      series,
      toolUsage,
      recentRuns: runs.slice(0, 5).map((r) => ({
        id: r.id,
        tool_slug: r.tool_slug,
        status: r.status,
        created_at: r.created_at,
      })),
      systems,
    };
  });

export const listActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workspaceId: z.string().uuid(),
      limit: z.number().int().min(1).max(100).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const limit = data.limit ?? 40;

    const [runsRes, assetsRes, systemsRes] = await Promise.all([
      supabase
        .from("tool_runs")
        .select("id, tool_slug, status, created_at, provider, model")
        .eq("workspace_id", data.workspaceId)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("assets")
        .select("id, name, type, created_at")
        .eq("workspace_id", data.workspaceId)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("nova_system_configs")
        .select("id, system_slug, active, updated_at")
        .eq("workspace_id", data.workspaceId)
        .order("updated_at", { ascending: false })
        .limit(limit),
    ]);

    if (runsRes.error) throw new Error(runsRes.error.message);
    if (assetsRes.error) throw new Error(assetsRes.error.message);
    if (systemsRes.error) throw new Error(systemsRes.error.message);

    type Event =
      | { kind: "run"; id: string; at: string; tool_slug: string; status: string; provider: string | null; model: string | null }
      | { kind: "asset"; id: string; at: string; name: string; type: string }
      | { kind: "system"; id: string; at: string; system_slug: string; active: boolean };

    const events: Event[] = [
      ...(runsRes.data ?? []).map<Event>((r) => ({
        kind: "run", id: r.id, at: r.created_at, tool_slug: r.tool_slug,
        status: r.status, provider: r.provider, model: r.model,
      })),
      ...(assetsRes.data ?? []).map<Event>((a) => ({
        kind: "asset", id: a.id, at: a.created_at, name: a.name, type: a.type,
      })),
      ...(systemsRes.data ?? []).map<Event>((s) => ({
        kind: "system", id: s.id, at: s.updated_at, system_slug: s.system_slug, active: s.active,
      })),
    ];

    events.sort((a, b) => b.at.localeCompare(a.at));
    return { events: events.slice(0, limit) };
  });
