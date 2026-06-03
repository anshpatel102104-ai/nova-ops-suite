// Plan tiers — aligned with the Supabase workspace_plan enum.
// Limits here mirror the server-side `get_plan_limits` SQL function.

export type PlanId = "starter" | "pro" | "business";

export interface PlanLimits {
  tool_runs: number;      // -1 = unlimited
  workflow_runs: number;
  members: number;
  custom_playbooks: number;
}

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  limits: PlanLimits;
  toolLimit: number;   // # of launchpad tools unlocked
  systemLimit: number; // # of nova-os systems unlocked
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 0,
    tagline: "Boot up your founder OS",
    limits: { tool_runs: 50, workflow_runs: 10, members: 2, custom_playbooks: 3 },
    toolLimit: 5,
    systemLimit: 1,
    features: [
      "5 Academy tools",
      "50 tool runs / month",
      "10 workflow runs / month",
      "Up to 2 teammates",
      "Community support",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 49,
    tagline: "Ship faster with the full toolkit",
    limits: { tool_runs: 1000, workflow_runs: 200, members: 10, custom_playbooks: -1 },
    toolLimit: 17,
    systemLimit: 4,
    features: [
      "All Academy tools",
      "1,000 tool runs / month",
      "200 workflow runs / month",
      "Unlimited custom playbooks",
      "Up to 10 teammates",
      "Email support",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    price: 199,
    tagline: "Run the whole business on Nova",
    limits: { tool_runs: 10000, workflow_runs: 2000, members: -1, custom_playbooks: -1 },
    toolLimit: 17,
    systemLimit: 6,
    features: [
      "Everything in Pro",
      "10,000 tool runs / month",
      "2,000 workflow runs / month",
      "Unlimited teammates",
      "All automation systems",
      "Priority support",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["starter", "pro", "business"];

export function planRank(p: PlanId) {
  return PLAN_ORDER.indexOf(p);
}

export function planFor(p: string | null | undefined): Plan {
  if (p && p in PLANS) return PLANS[p as PlanId];
  return PLANS.starter;
}

export function formatLimit(n: number): string {
  if (n < 0) return "∞";
  return n.toLocaleString();
}

export function canAccessTool(plan: PlanId, toolIndex: number) {
  return toolIndex < planFor(plan).toolLimit;
}
export function canAccessSystem(plan: PlanId, systemIndex: number) {
  return systemIndex < planFor(plan).systemLimit;
}
