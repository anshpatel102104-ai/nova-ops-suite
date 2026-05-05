import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight, Sparkles, CheckCircle2, Circle,
  Rocket, Zap, TrendingUp, TrendingDown, Users, Activity as ActivityIcon, Target,
} from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { PLANS } from "@/lib/plan";
import { LAUNCHPAD_TOOLS } from "@/lib/catalog";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, RadialBar, RadialBarChart, PolarAngleAxis,
} from "recharts";

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

// 14-day activity series
const ACTIVITY = [
  { d: "Apr 22", runs: 4, leads: 2 },
  { d: "Apr 23", runs: 6, leads: 3 },
  { d: "Apr 24", runs: 3, leads: 1 },
  { d: "Apr 25", runs: 8, leads: 4 },
  { d: "Apr 26", runs: 11, leads: 6 },
  { d: "Apr 27", runs: 7, leads: 5 },
  { d: "Apr 28", runs: 12, leads: 7 },
  { d: "Apr 29", runs: 9, leads: 6 },
  { d: "Apr 30", runs: 14, leads: 8 },
  { d: "May 01", runs: 18, leads: 11 },
  { d: "May 02", runs: 16, leads: 9 },
  { d: "May 03", runs: 22, leads: 13 },
  { d: "May 04", runs: 19, leads: 12 },
  { d: "May 05", runs: 24, leads: 15 },
];

const TOOL_USAGE = [
  { name: "Offer", v: 24 },
  { name: "ICP", v: 18 },
  { name: "Outreach", v: 16 },
  { name: "Brand", v: 11 },
  { name: "Pricing", v: 9 },
  { name: "Funnel", v: 6 },
];

function DashboardPage() {
  const { workspace } = useWorkspace();
  const plan = PLANS[workspace.plan];
  const done = CHECKLIST.filter((c) => c.done).length;
  const pct = Math.round((done / CHECKLIST.length) * 100);

  return (
    <>
      <PageHeader
        eyebrow="Command Center · Overview"
        title={`Welcome back, ${workspace.user.name.split(" ")[0]}.`}
        description="Live operational view of your business systems."
        actions={
          <Button asChild>
            <Link to="/app/launchpad">Launch a tool <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        }
      />

      {/* Top KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Tool Runs" value="142" delta={+18.2} icon={Zap} spark={[4,6,3,8,11,7,12,9,14,18,16,22,19,24]} />
        <KpiCard label="Leads Captured" value="92" delta={+24.5} icon={Users} spark={[2,3,1,4,6,5,7,6,8,11,9,13,12,15]} />
        <KpiCard label="Active Systems" value={`0 / ${plan.systemLimit}`} delta={0} icon={ActivityIcon} spark={[0,0,0,0,0,0,0,0,0,0,0,0,0,0]} />
        <KpiCard label="Activation" value={`${pct}%`} delta={+12} icon={Target} spark={[20,20,40,40,40,40,40,40,40,40,40,40,40,pct]} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Activity chart */}
        <div className="lg:col-span-2 nova-card p-5 nova-bracket">
          <SectionHeader
            title="Operations · 14d"
            description="Tool runs and leads captured per day."
            actions={
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em]">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary" /> Runs</span>
                <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2 w-2 rounded-sm bg-[color:var(--success)]" /> Leads</span>
              </div>
            }
          />
          <div className="h-[240px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ACTIVITY} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRuns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--success)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="d" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)", border: "1px solid var(--border)",
                    borderRadius: 6, fontSize: 12,
                  }}
                  cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "3 3" }}
                />
                <Area type="monotone" dataKey="runs" stroke="var(--primary)" strokeWidth={2} fill="url(#gRuns)" />
                <Area type="monotone" dataKey="leads" stroke="var(--success)" strokeWidth={2} fill="url(#gLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activation radial */}
        <div className="nova-card p-5 nova-bracket">
          <SectionHeader title="Activation Status" description="Setup completion." />
          <div className="h-[200px] grid place-items-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: pct, fill: "var(--primary)" }]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "var(--muted)" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="text-center">
                <p className="text-3xl font-semibold tracking-tight">{pct}%</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{done}/{CHECKLIST.length} steps</p>
              </div>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="w-full mt-2">
            <Link to="/app/onboarding">Continue setup <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Tool usage bar */}
        <div className="lg:col-span-2 nova-card p-5">
          <SectionHeader title="Tool Usage · This Month" actions={<StatusPill tone="primary">Top 6</StatusPill>} />
          <div className="h-[200px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TOOL_USAGE} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} width={24} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                  cursor={{ fill: "var(--accent)", opacity: 0.4 }}
                />
                <Bar dataKey="v" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System status */}
        <div className="nova-card p-5">
          <SectionHeader title="System Status" actions={<span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--success)] flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)] nova-live-dot" /> All Ops</span>} />
          <ul className="space-y-2.5 text-sm">
            <StatusRow label="API Gateway" tone="success" value="99.99%" />
            <StatusRow label="Automations" tone="success" value="Operational" />
            <StatusRow label="Integrations" tone="success" value="Operational" />
            <StatusRow label="AI Workers" tone="success" value="24ms" />
            <StatusRow label="Webhooks" tone="warning" value="Degraded" />
          </ul>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Activation checklist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="nova-card p-5">
            <SectionHeader
              title="Activation Checklist"
              description="Finish setup to unlock Nova OPS."
              actions={<StatusPill tone="primary">{pct}%</StatusPill>}
            />
            <Progress value={pct} className="h-1 mb-4" />
            <ul className="divide-y divide-border">
              {CHECKLIST.map((item) => (
                <li key={item.key} className="py-2.5 flex items-center justify-between gap-3">
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

          <div className="nova-card p-5">
            <SectionHeader title="Quick Launch" />
            <div className="grid sm:grid-cols-2 gap-3">
              {LAUNCHPAD_TOOLS.slice(0, 4).map((t) => (
                <Link
                  key={t.slug}
                  to="/app/launchpad/$slug"
                  params={{ slug: t.slug }}
                  className="nova-card-hover nova-card p-4 flex items-start gap-3 group"
                >
                  <div className="h-9 w-9 rounded-md border border-border bg-accent/40 grid place-items-center shrink-0">
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

        <div className="space-y-4">
          <div className="nova-card p-5 nova-bracket">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Recommended
            </div>
            <h3 className="text-base font-semibold">Activate Lead Capture</h3>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Most operators see leads within 24 hours of activation.
            </p>
            <Button asChild className="mt-4 w-full" size="sm">
              <Link to="/app/nova-os/$slug" params={{ slug: "lead-capture" }}>Set up now</Link>
            </Button>
          </div>

          <div className="nova-card p-5">
            <SectionHeader title="Recent Runs" actions={
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

          {plan.id !== "scale" && (
            <Link
              to="/app/billing"
              className="block nova-card p-5 nova-card-hover"
            >
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-2">
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

function KpiCard({ label, value, delta, icon: Icon, spark }: {
  label: string; value: string; delta: number; icon: React.ComponentType<{ className?: string }>; spark: number[];
}) {
  const data = spark.map((v, i) => ({ i, v }));
  const up = delta >= 0;
  return (
    <div className="nova-card p-4 relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        </div>
        {delta !== 0 && (
          <span className={`inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold ${up ? "bg-[color:var(--success)]/10 text-[color:var(--success)]" : "bg-destructive/10 text-destructive"}`}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {up ? "+" : ""}{delta}%
          </span>
        )}
      </div>
      <div className="h-10 -mx-1 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={1.5} fill={`url(#spark-${label})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
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
