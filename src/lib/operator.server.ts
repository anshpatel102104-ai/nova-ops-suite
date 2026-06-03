// Server-only helpers for Nova Operator: hybrid provider routing
// (workspace BYO key → fallback to Lovable AI Gateway) + specialist prompts.

import type { ChatMessage } from "./ai.server";

export type OperatorProvider = "anthropic" | "openai" | "lovable";

export type SpecialistRoute =
  | "general"
  | "validation"
  | "strategy"
  | "offer"
  | "gtm"
  | "copy"
  | "outreach"
  | "automation"
  | "knowledge";

const SPECIALIST_PROMPTS: Record<SpecialistRoute, string> = {
  general:
    "Act as a versatile chief-of-staff. Give a direct, structured answer with concrete next steps.",
  validation:
    "Channel the Validation specialist. Stress-test the idea against demand, willingness-to-pay, and competition. Return a TL;DR verdict, top 3 risks, and 3 cheap experiments.",
  strategy:
    "Channel the Strategy specialist. Produce a sharp positioning + 30/60/90 plan with one north-star metric and clear kill criteria.",
  offer:
    "Channel the Offer specialist. Design the offer: promise, mechanism, deliverables, price anchor, risk reversal, one-line positioning.",
  gtm:
    "Channel the GTM specialist. Map the go-to-market motion: primary channel, sequence, weekly cadence, and the first 10 customers playbook.",
  copy:
    "Channel the Copy specialist. Produce on-brand copy with hook, sections, CTAs. Plain text, sectioned, ready to ship.",
  outreach:
    "Channel the Outreach specialist. Produce a 3-step cold sequence with subject lines and {{merge}} slots. Each step <90 words.",
  automation:
    "Channel the Automation Architect. Plan trigger → steps → data passed → failure handling → success metric.",
  knowledge:
    "Channel the Knowledge specialist. Synthesize what the workspace already knows about this topic and cite the most relevant assets.",
};

const ROUTE_KEYWORDS: Array<[SpecialistRoute, RegExp]> = [
  ["validation", /\b(validate|validation|kill (my|the) idea|risk|moat|demand)\b/i],
  ["offer", /\b(offer|pricing|package|bundle|guarantee)\b/i],
  ["gtm", /\b(gtm|go-to-market|launch plan|channel|distribution)\b/i],
  ["strategy", /\b(strategy|roadmap|positioning|icp|north[- ]?star)\b/i],
  ["copy", /\b(copy|headline|landing page|hero|cta|tagline)\b/i],
  ["outreach", /\b(cold email|outreach|sequence|dm|linkedin message)\b/i],
  ["automation", /\b(automation|workflow|zap|n8n|sop|playbook)\b/i],
  ["knowledge", /\b(what do we know|summarize (my|our)|recap|knowledge base)\b/i],
];

export function pickSpecialist(input: string): SpecialistRoute {
  for (const [route, rx] of ROUTE_KEYWORDS) if (rx.test(input)) return route;
  return "general";
}

export function buildSystemPrompt(opts: {
  route: SpecialistRoute;
  workspaceName: string;
  planName: string;
  contextSummary: string;
}): string {
  return [
    "You are Nova, the AI chief-of-staff for Launchpad Nova — a founder mission-control product.",
    "Voice: Jarvis-grade, direct, mentor-school. No filler, no apologies, no emojis.",
    "Always end with a short ### Next move section listing 2-4 concrete actions the user can take.",
    "",
    `Workspace: ${opts.workspaceName} (${opts.planName} plan).`,
    opts.contextSummary,
    "",
    "Active specialist mode:",
    SPECIALIST_PROMPTS[opts.route],
  ].join("\n");
}

export interface OperatorCallResult {
  text: string;
  provider: OperatorProvider;
  model: string;
}

export async function resolveOperatorProvider(
  workspaceId: string,
): Promise<{ provider: OperatorProvider; apiKey: string; model: string }> {
  const { resolveProviderKey } = await import("./ai.server");

  // 1. Workspace BYO Anthropic
  const anth = await resolveProviderKey(workspaceId, "anthropic");
  if (anth) return { provider: "anthropic", apiKey: anth, model: "claude-3-5-sonnet-latest" };

  // 2. Workspace BYO OpenAI
  const oai = await resolveProviderKey(workspaceId, "openai");
  if (oai) return { provider: "openai", apiKey: oai, model: "gpt-4o-mini" };

  // 3. Fallback: Lovable AI Gateway
  const key = process.env.LOVABLE_API_KEY;
  if (!key) {
    throw new Error("No provider configured. Add an Anthropic or OpenAI key in Settings, or enable Lovable AI.");
  }
  return { provider: "lovable", apiKey: key, model: "google/gemini-3-flash-preview" };
}

export async function callOperator(opts: {
  workspaceId: string;
  messages: ChatMessage[];
}): Promise<OperatorCallResult> {
  const { provider, apiKey, model } = await resolveOperatorProvider(opts.workspaceId);

  if (provider === "lovable") {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: opts.messages, max_tokens: 1400 }),
    });
    if (!res.ok) {
      const t = await res.text();
      if (res.status === 429) throw new Error("Lovable AI rate limit hit. Try again in a moment.");
      if (res.status === 402) throw new Error("Lovable AI credits exhausted. Add credits in workspace settings.");
      throw new Error(`Lovable AI ${res.status}: ${t}`);
    }
    const json = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    return { text: json.choices[0]?.message?.content ?? "", provider, model };
  }

  const { callChat } = await import("./ai.server");
  const r = await callChat({ provider, apiKey, model, messages: opts.messages, maxTokens: 1400 });
  return { text: r.text, provider, model };
}

// Heuristic recommendation generator. Maps the assistant's response + the
// chosen specialist to concrete action cards stored in operator_recommendations.
export interface OperatorRecommendation {
  label: string;
  description: string;
  action_kind: "run_tool" | "open_workflow" | "save_asset" | "plan_automation" | "update_kb" | "custom";
  target: string | null;
  payload: Record<string, unknown>;
}

export function buildRecommendations(opts: {
  route: SpecialistRoute;
  userInput: string;
  assistantOutput: string;
}): OperatorRecommendation[] {
  const base: OperatorRecommendation[] = [];

  const byRoute: Record<SpecialistRoute, OperatorRecommendation[]> = {
    validation: [
      { label: "Run Idea Validator", description: "Stress-test demand, competitors, and moats.", action_kind: "run_tool", target: "idea-validator", payload: { input: opts.userInput } },
      { label: "Run Kill My Idea", description: "Adversarial pass before customers do it for free.", action_kind: "run_tool", target: "kill-my-idea", payload: { input: opts.userInput } },
    ],
    strategy: [
      { label: "Build GTM Strategy", description: "Channels, sequence, 30/60/90 plan.", action_kind: "run_tool", target: "gtm-strategy", payload: { input: opts.userInput } },
      { label: "Define ICP", description: "Lock the customer worth chasing.", action_kind: "run_tool", target: "icp-builder", payload: { input: opts.userInput } },
    ],
    offer: [
      { label: "Open Offer Builder", description: "Promise, mechanism, price anchor.", action_kind: "run_tool", target: "offer-builder", payload: { input: opts.userInput } },
      { label: "Generate Messaging Angles", description: "5 angles tuned to the offer.", action_kind: "run_tool", target: "messaging-angles", payload: { input: opts.userInput } },
    ],
    gtm: [
      { label: "Open GTM Strategy", description: "Map your motion end-to-end.", action_kind: "run_tool", target: "gtm-strategy", payload: { input: opts.userInput } },
      { label: "Build Funnel", description: "Attract → Convert → Close → Retain.", action_kind: "run_tool", target: "funnel-builder", payload: { input: opts.userInput } },
    ],
    copy: [
      { label: "Generate Landing Copy", description: "Hero, sections, CTAs.", action_kind: "run_tool", target: "landing-copy", payload: { input: opts.userInput } },
      { label: "Save as Asset", description: "Keep this draft in your library.", action_kind: "save_asset", target: null, payload: {} },
    ],
    outreach: [
      { label: "Generate Cold Email Sequence", description: "3-step sequence with subjects.", action_kind: "run_tool", target: "cold-email", payload: { input: opts.userInput } },
      { label: "Build Sales Script", description: "Discovery → close.", action_kind: "run_tool", target: "sales-script", payload: { input: opts.userInput } },
    ],
    automation: [
      { label: "Open Automation Planner", description: "Plan trigger → steps → output.", action_kind: "run_tool", target: "automation-planner", payload: { input: opts.userInput } },
      { label: "Send to Workflow Builder", description: "Wire this as a recurring workflow.", action_kind: "open_workflow", target: null, payload: {} },
    ],
    knowledge: [
      { label: "Save to Knowledge Base", description: "Persist this synthesis as an asset.", action_kind: "update_kb", target: null, payload: {} },
    ],
    general: [
      { label: "Save as Asset", description: "Keep this response in your library.", action_kind: "save_asset", target: null, payload: {} },
    ],
  };

  base.push(...byRoute[opts.route]);
  base.push({
    label: "Plan automation",
    description: "Turn this thread into a repeatable workflow.",
    action_kind: "plan_automation",
    target: null,
    payload: {},
  });
  return base.slice(0, 4);
}
