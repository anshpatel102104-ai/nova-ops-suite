import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight, Sparkles, CheckCircle2, Circle, Activity as ActivityIcon,
  Rocket, Cpu, Zap,
} from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { PLANS } from "@/lib/plan";
import { LAUNCHPAD_TOOLS, NOVA_SYSTEMS } from "@/lib/catalog";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

const CHECKLIST = [
  { key: "profile", label: "Complete your profile", done: true },
  { key: "onboarding", label: "Finish onboarding", done: false, to: "/app/onboarding" },
  { key: "first-tool", label: "Run your first LaunchPad tool", done: false, to: "/app/launchpad" },
  { key: "first-system", label: "Activate a Nova OS system", done: false, to: "/app/nova-os" },
  { key: "integration", label: "Connect an integration", done: false, to: "/app/integrations" },
];

const RECENT_RUNS = [
  { tool: "Offer Builder", at: "12 min ago", status: "completed" as const },
  { tool: "ICP Finder", at: "2 hr ago", status: "completed" as const },
  { tool: "Outreach Writer", at: "Yesterday", status: "completed" as const },
];

function DashboardPage() {
  const { workspace } = useWorkspace();
  const plan = PLANS[workspace.plan];
  const done = CHECKLIST.filter((c) => c.done).length;
  const pct = Math.round((done / CHECKLIST.length) * 100);

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${workspace.user.name.split(" ")[0]}.`}
        description="Here's what's moving in your business today."
        actions={
          <Button asChild>
            <Link to="/app/launchpad">Launch a tool <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        }
      />

      {/* Top metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Plan" value={plan.name} sub={`$${plan.price}/mo`} />
        <MetricCard label="Tool runs" value="12" sub="this month" />
        <MetricCard label="Active systems" value="0" sub={`of ${plan.systemLimit}`} />
        <MetricCard label="Activation" value={`${pct}%`} sub={`${done}/${CHECKLIST.length} steps`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Activation checklist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="nova-card p-5">
            <SectionHeader
              title="Activation checklist"
              description="Finish setup to unlock your full Nova OPS experience."
              actions={<StatusPill tone="primary">{pct}% complete</StatusPill>}
            />
            <Progress value={pct} className="h-1.5 mb-4" />
            <ul className="divide-y divide-border">
              {CHECKLIST.map((item) => (
                <li key={item.key} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.done
                      ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className={`text-sm ${item.done ? "text-muted-foreground line-through" : ""}`}>
                      {item.label}
                    </span>
                  </div>
                  {!item.done && item.to && (
                    <Button asChild size="sm" variant="ghost">
                      <Link to={item.to}>Start <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Quick actions */}
          <div className="nova-card p-5">
            <SectionHeader title="Quick actions" />
            <div className="grid sm:grid-cols-2 gap-3">
              {LAUNCHPAD_TOOLS.slice(0, 4).map((t) => (
                <Link
                  key={t.slug}
                  to="/app/launchpad/$slug"
                  params={{ slug: t.slug }}
                  className="nova-card-hover nova-card p-4 flex items-start gap-3 group"
                >
                  <div className="h-9 w-9 rounded-md border border-border bg-surface-elevated grid place-items-center shrink-0">
                    <t.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Recommended next step */}
          <div className="nova-card p-5">
            <div className="flex items-center gap-2 text-xs text-primary font-medium uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Recommended
            </div>
            <h3 className="text-base font-semibold">Activate Lead Capture System</h3>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Most operators see leads within 24 hours of activation.
            </p>
            <Button asChild className="mt-4 w-full" size="sm">
              <Link to="/app/nova-os/$slug" params={{ slug: "lead-capture" }}>Set up now</Link>
            </Button>
          </div>

          {/* Recent runs */}
          <div className="nova-card p-5">
            <SectionHeader title="Recent runs" actions={
              <Link to="/app/activity" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
            } />
            <ul className="space-y-2.5">
              {RECENT_RUNS.map((r) => (
                <li key={r.tool} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{r.tool}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{r.at}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* System status */}
          <div className="nova-card p-5">
            <SectionHeader title="System status" />
            <ul className="space-y-2.5 text-sm">
              <StatusRow label="API" tone="success" value="Operational" />
              <StatusRow label="Automations" tone="success" value="Operational" />
              <StatusRow label="Integrations" tone="success" value="Operational" />
            </ul>
          </div>

          {plan.id !== "scale" && (
            <Link
              to="/app/billing"
              className="block nova-card p-5 nova-card-hover"
            >
              <div className="flex items-center gap-2 text-xs text-primary font-medium uppercase tracking-wider mb-2">
                <Rocket className="h-3.5 w-3.5" /> Upgrade
              </div>
              <p className="text-sm font-medium">Unlock more Nova OS systems</p>
              <p className="mt-1 text-xs text-muted-foreground">See what the next tier opens up.</p>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="nova-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusRow({ label, value, tone }: { label: string; value: string; tone: "success" | "warning" | "destructive" }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <StatusPill tone={tone}>{value}</StatusPill>
    </li>
  );
}
