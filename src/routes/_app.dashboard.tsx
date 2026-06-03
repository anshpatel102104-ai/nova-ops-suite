import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight, Sparkles, CheckCircle2, Circle,
  Rocket, Zap, TrendingUp, TrendingDown, Boxes, Activity as ActivityIcon, Target,
} from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { PLANS } from "@/lib/plan";
import { LAUNCHPAD_TOOLS } from "@/lib/catalog";
import { getDashboardStats } from "@/lib/dashboard.functions";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, RadialBar, RadialBarChart, PolarAngleAxis,
} from "recharts";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

const CHECKLIST_BASE = [
  { key: "profile", label: "Complete your profile", needs: "profile" as const, to: "/app/onboarding" },
  { key: "onboarding", label: "Finish onboarding", needs: "onboarding" as const, to: "/app/onboarding" },
  { key: "first-tool", label: "Run your first LaunchPad tool", needs: "run" as const, to: "/app/launchpad" },
  { key: "first-system", label: "Activate a Nova OS system", needs: "system" as const, to: "/app/nova-os" },
  { key: "integration", label: "Connect an integration", needs: "integration" as const, to: "/app/integrations" },
];

function toolName(slug: string) {
  return LAUNCHPAD_TOOLS.find((t) => t.slug === slug)?.name ?? slug;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function DashboardPage() {
  const { workspace } = useWorkspace();
  const plan = PLANS[workspace.plan];

  const fetchStats = useServerFn(getDashboardStats);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats", workspace.id],
    queryFn: () => fetchStats({ data: { workspaceId: workspace.id } }),
  });

  const totals = data?.totals;
  const series = data?.series ?? [];
  const toolUsage = (data?.toolUsage ?? []).map((u) => ({ name: toolName(u.slug).split(" ")[0], v: u.v }));
  const recentRuns = data?.recentRuns ?? [];

  const checklist = CHECKLIST_BASE.map((c) => {
    let done = false;
    if (c.needs === "profile") done = !!workspace.user.name;
    if (c.needs === "onboarding") done = workspace.onboarded;
    if (c.needs === "run") done = (totals?.runs14d ?? 0) > 0;
    if (c.needs === "system") done = (totals?.activeSystems ?? 0) > 0;
    return { ...c, done };
  });
  const done = checklist.filter((c) => c.done).length;
  const pct = Math.round((done / checklist.length) * 100);

  const successRate = totals && totals.runs14d > 0
    ? Math.round((totals.succeeded / totals.runs14d) * 100)
    : 0;

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

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Tool Runs · 14d" value={String(totals?.runs14d ?? 0)} icon={Zap} spark={series.map((s) => s.runs)} loading={isLoading} />
        <KpiCard label="Assets · 14d" value={String(totals?.assets14d ?? 0)} icon={Boxes} spark={series.map((s) => s.assets)} loading={isLoading} />
        <KpiCard label="Active Systems" value={`${totals?.activeSystems ?? 0} / ${plan.systemLimit}`} icon={ActivityIcon} spark={series.map(() => totals?.activeSystems ?? 0)} loading={isLoading} />
        <KpiCard label="Success Rate" value={`${successRate}%`} icon={Target} spark={series.map((s) => s.runs)} delta={totals?.failed ? -totals.failed : 0} loading={isLoading} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 nova-card p-5 nova-bracket">
          <SectionHeader
            title="Operations · 14d"
            description="Tool runs and assets saved per day."
            actions={
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em]">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary" /> Runs</span>
                <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2 w-2 rounded-sm bg-[color:var(--success)]" /> Assets</span>
              </div>
            }
          />
          <div className="h-[240px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRuns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAssets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--success)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="d" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                  cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "3 3" }}
                />
                <Area type="monotone" dataKey="runs" stroke="var(--primary)" strokeWidth={2} fill="url(#gRuns)" />
                <Area type="monotone" dataKey="assets" stroke="var(--success)" strokeWidth={2} fill="url(#gAssets)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

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
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{done}/{checklist.length} steps</p>
              </div>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="w-full mt-2">
            <Link to="/app/onboarding">Continue setup <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 nova-card p-5">
          <SectionHeader title="Tool Usage · 14d" actions={<StatusPill tone="primary">Top {toolUsage.length || 0}</StatusPill>} />
          <div className="h-[200px] -ml-2">
            {toolUsage.length === 0 ? (
              <div className="h-full grid place-items-center text-xs text-muted-foreground font-mono uppercase tracking-[0.16em]">
                No runs yet · launch a tool to start
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={toolUsage} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} width={24} />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                    cursor={{ fill: "var(--accent)", opacity: 0.4 }}
                  />
                  <Bar dataKey="v" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="nova-card p-5">
          <SectionHeader title="Run Health" actions={
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--success)] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)] nova-live-dot" /> Live
            </span>
          } />
          <ul className="space-y-2.5 text-sm">
            <StatusRow label="Succeeded" tone="success" value={String(totals?.succeeded ?? 0)} />
            <StatusRow label="Failed" tone={totals?.failed ? "destructive" : "success"} value={String(totals?.failed ?? 0)} />
            <StatusRow label="Success Rate" tone={successRate >= 80 ? "success" : "warning"} value={`${successRate}%`} />
            <StatusRow label="Systems Active" tone={totals?.activeSystems ? "success" : "warning"} value={`${totals?.activeSystems ?? 0}/${totals?.totalSystems ?? 0}`} />
          </ul>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="nova-card p-5">
            <SectionHeader
              title="Activation Checklist"
              description="Finish setup to unlock Nova OPS."
              actions={<StatusPill tone="primary">{pct}%</StatusPill>}
            />
            <Progress value={pct} className="h-1 mb-4" />
            <ul className="divide-y divide-border">
              {checklist.map((item) => (
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
              <Link to="/app/nova-os/$slug" params={{ slug: "lead-capture-crm" }}>Set up now</Link>
            </Button>
          </div>

          <div className="nova-card p-5">
            <SectionHeader title="Recent Runs" actions={
              <Link to="/app/activity" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
            } />
            {recentRuns.length === 0 ? (
              <p className="text-xs text-muted-foreground">No runs yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {recentRuns.map((r) => (
                  <li key={r.id} className="flex items-center justify-between text-sm gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Zap className={`h-3.5 w-3.5 shrink-0 ${r.status === "failed" ? "text-destructive" : "text-primary"}`} />
                      <span className="truncate">{toolName(r.tool_slug)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{timeAgo(r.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {plan.id !== "business" && (
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

function KpiCard({ label, value, delta, icon: Icon, spark, loading }: {
  label: string; value: string; delta?: number; icon: React.ComponentType<{ className?: string }>; spark: number[]; loading?: boolean;
}) {
  const data = spark.map((v, i) => ({ i, v }));
  const up = (delta ?? 0) >= 0;
  return (
    <div className="nova-card p-4 relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
            {loading ? <span className="text-muted-foreground">—</span> : value}
          </p>
        </div>
        {delta !== undefined && delta !== 0 && (
          <span className={`inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold ${up ? "bg-[color:var(--success)]/10 text-[color:var(--success)]" : "bg-destructive/10 text-destructive"}`}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {up ? "+" : ""}{delta}
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
