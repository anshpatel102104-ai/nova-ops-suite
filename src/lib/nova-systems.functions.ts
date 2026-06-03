import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getSystemConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workspaceId: z.string().uuid(),
      systemSlug: z.string().min(1).max(80),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("nova_system_configs")
      .select("id, active, config, last_run_at, updated_at")
      .eq("workspace_id", data.workspaceId)
      .eq("system_slug", data.systemSlug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { config: row ?? null };
  });

export const upsertSystemConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workspaceId: z.string().uuid(),
      systemSlug: z.string().min(1).max(80),
      active: z.boolean().optional(),
      config: z.record(z.string(), z.unknown()).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const payload: Record<string, unknown> = {
      workspace_id: data.workspaceId,
      system_slug: data.systemSlug,
    };
    if (data.active !== undefined) payload.active = data.active;
    if (data.config !== undefined) payload.config = data.config;

    const { data: row, error } = await supabase
      .from("nova_system_configs")
      .upsert(payload, { onConflict: "workspace_id,system_slug" })
      .select("id, active, config, last_run_at")
      .single();
    if (error) throw new Error(error.message);
    return { config: row };
  });
