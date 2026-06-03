// Plan / entitlement helpers. Backend enforcement happens via Supabase + n8n.
// TODO: replace mock plan with Supabase subscription lookup.

export type PlanId = "free" | "launch" | "operate" | "scale";

export const PLANS: Record<PlanId, {
  id: PlanId;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  toolLimit: number;
  systemLimit: number;
}> = {
  free: {
    id: "free",
    name: "Cadet",
    price: 0,
    tagline: "Boot up your founder OS",
    toolLimit: 3,
    systemLimit: 0,
    features: ["3 Academy tools", "Limited runs", "Community support"],
  },
  launch: {
    id: "launch",
    name: "Launch",
    price: 49,
    tagline: "Ship your offer faster",
    toolLimit: 17,
    systemLimit: 1,
    features: ["All 17 Academy tools", "1 Automation system", "Email support"],
  },
  operate: {
    id: "operate",
    name: "Operate",
    price: 149,
    tagline: "Automate your operations",
    toolLimit: 17,
    systemLimit: 4,
    features: ["Everything in Launch", "4 Automation systems", "Integrations", "Priority support"],
  },
  scale: {
    id: "scale",
    name: "Scale",
    price: 299,
    tagline: "Run the whole business on Nova",
    toolLimit: 17,
    systemLimit: 6,
    features: ["All 6 Automation systems", "Unlimited runs", "Dedicated operator"],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "launch", "operate", "scale"];

export function planRank(p: PlanId) {
  return PLAN_ORDER.indexOf(p);
}

export function canAccessTool(plan: PlanId, toolIndex: number) {
  return toolIndex < PLANS[plan].toolLimit;
}
export function canAccessSystem(plan: PlanId, systemIndex: number) {
  return systemIndex < PLANS[plan].systemLimit;
}
