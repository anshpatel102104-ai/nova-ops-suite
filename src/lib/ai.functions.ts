import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ProviderSchema = z.enum(["anthropic", "openai"]);
const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(50000),
});

export const chat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workspaceId: z.string().uuid(),
      messages: z.array(MessageSchema).min(1).max(50),
      // Optional per-call overrides
      provider: ProviderSchema.optional(),
      model: z.string().min(1).max(120).optional(),
      maxTokens: z.number().int().min(1).max(8192).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Membership check (RLS would also block, but fail fast here).
    const { data: member } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", data.workspaceId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!member) throw new Error("Not a workspace member");

    // Resolve provider/model: per-call override > workspace default.
    const { data: ws } = await supabase
      .from("workspaces")
      .select("default_provider, default_model")
      .eq("id", data.workspaceId)
      .maybeSingle();

    const provider = data.provider ?? ws?.default_provider;
    const model = data.model ?? ws?.default_model;
    if (!provider) throw new Error("No provider selected and no workspace default");
    if (!model) throw new Error("No model selected and no workspace default");

    const { resolveProviderKey, callChat } = await import("./ai.server");
    const apiKey = await resolveProviderKey(data.workspaceId, provider);
    if (!apiKey) throw new Error(`No ${provider} key configured for this workspace`);

    const result = await callChat({
      provider,
      apiKey,
      model,
      messages: data.messages,
      maxTokens: data.maxTokens,
    });
    return { text: result.text, provider, model };
  });
