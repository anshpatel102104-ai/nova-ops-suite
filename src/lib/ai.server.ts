// Server-only helpers for resolving BYO provider keys from Supabase Vault
// and calling Anthropic / OpenAI chat completions.

export type Provider = "anthropic" | "openai";

export async function resolveProviderKey(
  workspaceId: string,
  provider: Provider,
): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: row, error } = await supabaseAdmin
    .from("workspace_provider_keys")
    .select("vault_secret_id")
    .eq("workspace_id", workspaceId)
    .eq("provider", provider)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  const { data: secret, error: secretErr } = await supabaseAdmin
    .schema("vault" as never)
    .from("decrypted_secrets" as never)
    .select("decrypted_secret")
    .eq("id", row.vault_secret_id)
    .maybeSingle();
  if (secretErr) throw new Error(secretErr.message);
  return (secret as { decrypted_secret?: string } | null)?.decrypted_secret ?? null;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callChat(opts: {
  provider: Provider;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
}): Promise<{ text: string; raw: unknown }> {
  if (opts.provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        max_tokens: opts.maxTokens ?? 1024,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return { text: json.choices[0]?.message?.content ?? "", raw: json };
  }

  // anthropic
  const system = opts.messages.find((m) => m.role === "system")?.content;
  const msgs = opts.messages.filter((m) => m.role !== "system");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": opts.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 1024,
      ...(system ? { system } : {}),
      messages: msgs,
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const text = json.content
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("");
  return { text, raw: json };
}
