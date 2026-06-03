import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ProviderSchema = z.enum(["anthropic", "openai"]);

export const listProviderKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ workspaceId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("workspace_provider_keys")
      .select("provider, key_hint, updated_at")
      .eq("workspace_id", data.workspaceId);
    if (error) throw new Error(error.message);
    return { keys: rows ?? [] };
  });

export const setProviderKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workspaceId: z.string().uuid(),
      provider: ProviderSchema,
      apiKey: z.string().min(20).max(512),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.rpc("set_provider_key", {
      _workspace_id: data.workspaceId,
      _provider: data.provider,
      _plaintext: data.apiKey,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProviderKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workspaceId: z.string().uuid(),
      provider: ProviderSchema,
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.rpc("delete_provider_key", {
      _workspace_id: data.workspaceId,
      _provider: data.provider,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setWorkspaceDefaults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workspaceId: z.string().uuid(),
      provider: ProviderSchema.nullable(),
      model: z.string().min(1).max(120).nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("workspaces")
      .update({ default_provider: data.provider, default_model: data.model })
      .eq("id", data.workspaceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const testProviderKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workspaceId: z.string().uuid(),
      provider: ProviderSchema,
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Authorize: must be a member to even try (the server-side resolver also rechecks).
    const { data: member } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", data.workspaceId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!member) throw new Error("Not a workspace member");

    const { resolveProviderKey } = await import("./ai.server");
    const apiKey = await resolveProviderKey(data.workspaceId, data.provider);
    if (!apiKey) return { ok: false, error: "No key configured" };

    const url =
      data.provider === "openai"
        ? "https://api.openai.com/v1/models"
        : "https://api.anthropic.com/v1/models";
    const headers: Record<string, string> =
      data.provider === "openai"
        ? { Authorization: `Bearer ${apiKey}` }
        : { "x-api-key": apiKey, "anthropic-version": "2023-06-01" };

    const res = await fetch(url, { headers });
    return { ok: res.ok, status: res.status };
  });
