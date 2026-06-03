import {
  Lightbulb, Skull, Mic, Map, Banknote, Target, Sparkles, MessageSquareText,
  FileCode2, ScrollText, MailPlus, Magnet, Calendar, GitBranch, Workflow, Bot, Cpu,
  Inbox, FormInput, Rocket, Send, FileEdit, ListChecks,
  Brain, Compass, PenLine, Megaphone, Settings2, Crown,
} from "lucide-react";

export interface LaunchPadTool {
  slug: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "ready" | "beta";
  stage: "validate" | "strategy" | "marketing" | "sales" | "content" | "operations";
  agent: string; // agent slug who guides this tool
}

export const LAUNCHPAD_TOOLS: LaunchPadTool[] = [
  { slug: "idea-validator",        name: "Idea Validator",            description: "Stress-test your idea against demand, competitors, and moats.",    icon: Lightbulb,         status: "ready", stage: "validate",  agent: "strategos" },
  { slug: "kill-my-idea",          name: "Kill My Idea",              description: "An adversarial AI that tries to break your concept before customers do.", icon: Skull,        status: "ready", stage: "validate",  agent: "strategos" },
  { slug: "pitch-generator",       name: "Pitch Generator",           description: "Investor-ready pitch narrative in one prompt.",                    icon: Mic,               status: "ready", stage: "validate",  agent: "strategos" },
  { slug: "gtm-strategy",          name: "GTM Strategy Builder",      description: "Map your go-to-market motion: channels, sequence, milestones.",   icon: Map,               status: "ready", stage: "strategy",  agent: "strategos" },
  { slug: "funding-readiness",     name: "Funding Readiness Tool",    description: "Score your pitch, metrics, and story before you raise.",          icon: Banknote,          status: "ready", stage: "strategy",  agent: "strategos" },
  { slug: "icp-builder",           name: "ICP Builder",               description: "Define the exact customer worth chasing.",                         icon: Target,            status: "ready", stage: "strategy",  agent: "compass"   },
  { slug: "offer-builder",         name: "Offer Builder",             description: "Turn your service into a high-converting offer in minutes.",      icon: Sparkles,          status: "ready", stage: "strategy",  agent: "compass"   },
  { slug: "messaging-angles",      name: "Messaging Angle Generator", description: "Find the angle that makes your offer land.",                       icon: MessageSquareText, status: "ready", stage: "marketing", agent: "scribe"    },
  { slug: "landing-copy",          name: "Landing Page Copy Generator", description: "Hero, sections, CTAs — ready to ship.",                          icon: FileCode2,         status: "ready", stage: "marketing", agent: "scribe"    },
  { slug: "sales-script",          name: "Sales Script Generator",    description: "Close calls with a script tuned to your offer.",                  icon: ScrollText,        status: "ready", stage: "sales",     agent: "closer"    },
  { slug: "cold-email",            name: "Cold Email Generator",      description: "Cold emails that get replies, not the spam folder.",              icon: MailPlus,          status: "ready", stage: "sales",     agent: "closer"    },
  { slug: "lead-magnet",           name: "Lead Magnet Generator",     description: "Spin up assets that capture qualified leads.",                    icon: Magnet,            status: "ready", stage: "marketing", agent: "scribe"    },
  { slug: "content-strategy",      name: "Content Strategy Generator",description: "A month of pillars, posts, and hooks in one run.",                icon: Calendar,          status: "ready", stage: "content",   agent: "scribe"    },
  { slug: "funnel-builder",        name: "Funnel Builder",            description: "Map a funnel that actually converts.",                             icon: GitBranch,         status: "ready", stage: "marketing", agent: "compass"   },
  { slug: "sop-builder",           name: "SOP / Workflow Builder",    description: "Document every process your team should run the same way.",       icon: Workflow,          status: "ready", stage: "operations",agent: "forge"     },
  { slug: "agent-prompt-builder",  name: "AI Agent Prompt Builder",   description: "Design durable system prompts for your own agents.",              icon: Bot,               status: "beta",  stage: "operations",agent: "forge"     },
  { slug: "automation-planner",    name: "Automation Planner",        description: "Plan multi-step automations before you build them.",              icon: Cpu,               status: "beta",  stage: "operations",agent: "forge"     },
];

export const STAGE_META: Record<LaunchPadTool["stage"], { label: string; order: number }> = {
  validate:   { label: "Validate",     order: 1 },
  strategy:   { label: "Strategy",     order: 2 },
  marketing:  { label: "Marketing",    order: 3 },
  sales:      { label: "Sales",        order: 4 },
  content:    { label: "Content",      order: 5 },
  operations: { label: "Operations",   order: 6 },
};

export interface NovaSystem {
  slug: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trigger: string;
  action: string;
  output: string;
}

export const NOVA_SYSTEMS: NovaSystem[] = [
  { slug: "lead-capture-crm",   name: "Lead Capture → AI Qualification → CRM Sync", description: "Capture inbound leads, score them with AI, and sync to your CRM.", icon: Inbox,      trigger: "Form / ad / DM",     action: "AI qualifies + routes", output: "CRM record + alert" },
  { slug: "form-to-followup",   name: "Website Form → Offer Analysis → Follow-Up", description: "Read each submission, match it to an offer, draft a personal reply.", icon: FormInput,  trigger: "Website form",       action: "Offer match + draft",   output: "Follow-up email" },
  { slug: "idea-to-project",    name: "Idea Submission → Validation → Project",    description: "Founders submit ideas; AI validates and creates a working project.", icon: Rocket,     trigger: "Idea submitted",     action: "AI validates",          output: "Project + brief" },
  { slug: "outreach-engine",    name: "Outreach List → Personalization → Sequence",description: "Upload prospects, personalize at scale, ship cold sequences.",        icon: Send,       trigger: "List uploaded",      action: "Per-lead personalization", output: "Cold email sequence" },
  { slug: "content-pipeline",   name: "Content Queue → AI Generation → Approval",  description: "Queue prompts, generate drafts, route to your approval pipeline.",    icon: FileEdit,   trigger: "Prompt queued",      action: "AI drafts content",     output: "Awaiting approval" },
  { slug: "tool-to-ops",        name: "Tool Output → Task Creation → Team Routing",description: "Turn any tool run into structured tasks routed to the right operator.", icon: ListChecks, trigger: "Tool completes run", action: "Task + assignee",       output: "Notified operator" },
];

/* ---------- Agent System ---------- */

export interface Agent {
  slug: string;
  name: string;
  role: string;
  specialty: string;
  icon: React.ComponentType<{ className?: string }>;
  kind: "orchestrator" | "specialist";
  status: "active" | "ready" | "thinking" | "standby";
  color: "primary" | "ember" | "ignition" | "charcoal";
  // tools this agent guides
  tools: string[];
}

export const AGENTS: Agent[] = [
  {
    slug: "nova",
    name: "Nova",
    role: "Chief Orchestrator",
    specialty: "Routes work between specialist agents and you. Your Jarvis.",
    icon: Crown,
    kind: "orchestrator",
    status: "active",
    color: "primary",
    tools: [],
  },
  {
    slug: "strategos",
    name: "Strategos",
    role: "Strategy Mentor",
    specialty: "Validates ideas, builds GTM plans, prepares you for funding.",
    icon: Brain,
    kind: "specialist",
    status: "ready",
    color: "ember",
    tools: ["idea-validator", "kill-my-idea", "pitch-generator", "gtm-strategy", "funding-readiness"],
  },
  {
    slug: "compass",
    name: "Compass",
    role: "Positioning & Offer",
    specialty: "Nails ICP, offer design, and funnel architecture.",
    icon: Compass,
    kind: "specialist",
    status: "ready",
    color: "ignition",
    tools: ["icp-builder", "offer-builder", "funnel-builder"],
  },
  {
    slug: "scribe",
    name: "Scribe",
    role: "Copy & Content",
    specialty: "Writes angles, landing copy, lead magnets, content systems.",
    icon: PenLine,
    kind: "specialist",
    status: "ready",
    color: "primary",
    tools: ["messaging-angles", "landing-copy", "lead-magnet", "content-strategy"],
  },
  {
    slug: "closer",
    name: "Closer",
    role: "Sales Operator",
    specialty: "Builds cold email and call scripts that book and close.",
    icon: Megaphone,
    kind: "specialist",
    status: "ready",
    color: "ember",
    tools: ["sales-script", "cold-email"],
  },
  {
    slug: "forge",
    name: "Forge",
    role: "Ops & Automation",
    specialty: "Designs SOPs, agent prompts, and end-to-end automations.",
    icon: Settings2,
    kind: "specialist",
    status: "ready",
    color: "charcoal",
    tools: ["sop-builder", "agent-prompt-builder", "automation-planner"],
  },
];

export function agentBySlug(slug: string) {
  return AGENTS.find((a) => a.slug === slug);
}
