import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { Button } from "@/components/ui/button";
import { AGENTS, LAUNCHPAD_TOOLS } from "@/lib/catalog";
import { ArrowRight, Radio, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/agents")({
  component: AgentsPage,
});

const colorClass = {
  primary:  "from-[color:var(--primary)] to-[color:var(--ignition)]",
  ember:    "from-[color:var(--ember)] to-[color:var(--primary)]",
  ignition: "from-[color:var(--ignition)] to-[color:var(--primary)]",
  charcoal: "from-[color:var(--charcoal)] to-[color:var(--ember)]",
} as const;

function AgentsPage() {
  const orchestrator = AGENTS.find((a) => a.kind === "orchestrator")!;
  const specialists = AGENTS.filter((a) => a.kind === "specialist");

  return (
    <>
      <PageHeader
        eyebrow="Agent Network · Mentor School"
        title="Your AI operators, by specialty."
        description="Nova orchestrates the network. Each specialist mentor guides you through a domain — from validation to scale."
        actions={
          <Button variant="outline" size="sm">
            <Radio className="h-3.5 w-3.5 mr-1.5" /> Broadcast
          </Button>
        }
      />

      {/* Solar system — orchestrator at center, specialists in orbit */}
      <div className="relative nova-card p-8 mb-6 overflow-hidden">
        <div className="absolute inset-0 nova-dot-bg opacity-60 pointer-events-none" />
        <div className="relative grid lg:grid-cols-[1fr_360px] gap-6 items-center">
          <div className="relative aspect-square w-full max-w-[440px] mx-auto">
            {/* orbits */}
            <div className="absolute inset-[14%] rounded-full border border-dashed border-border" />
            <div className="absolute inset-[28%] rounded-full border border-dashed border-border" />
            <div className="absolute inset-[42%] rounded-full border border-dashed border-border" />

            {/* center: orchestrator */}
            <div className="absolute inset-0 grid place-items-center">
              <div className={cn(
                "h-20 w-20 rounded-full bg-gradient-to-br grid place-items-center nova-glow-ignite text-white shadow-lg",
                colorClass[orchestrator.color],
              )}>
                <orchestrator.icon className="h-8 w-8" />
              </div>
            </div>

            {/* specialists in orbit */}
            {specialists.map((a, i) => {
              const angle = (i / specialists.length) * Math.PI * 2 - Math.PI / 2;
              const r = 44; // %
              const x = 50 + Math.cos(angle) * r;
              const y = 50 + Math.sin(angle) * r;
              return (
                <Link
                  key={a.slug}
                  to="/app/agents"
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div className={cn(
                    "h-12 w-12 rounded-full bg-gradient-to-br grid place-items-center text-white shadow-md transition-transform group-hover:scale-110 nova-fade-up",
                    colorClass[a.color],
                  )}>
                    <a.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-1.5 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/80">
                    {a.name}
                  </p>
                </Link>
              );
            })}
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Orchestrator
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">{orchestrator.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{orchestrator.role}</p>
            <p className="text-sm mt-3 leading-relaxed">{orchestrator.specialty}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
              {[
                { k: "Status",   v: "Active" },
                { k: "Routing",  v: "5 agents" },
                { k: "Latency",  v: "24 ms" },
              ].map((s) => (
                <div key={s.k} className="rounded-md border border-border bg-surface-elevated px-2 py-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.k}</p>
                  <p className="text-foreground mt-0.5 font-medium">{s.v}</p>
                </div>
              ))}
            </div>
            <Button className="mt-5" size="sm">
              <Sparkles className="h-4 w-4 mr-1.5" /> Ask Nova
            </Button>
          </div>
        </div>
      </div>

      <SectionHeader title="Specialist Mentors" description="Each agent owns a domain of the founder journey." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {specialists.map((a) => {
          const tools = a.tools.map((s) => LAUNCHPAD_TOOLS.find((t) => t.slug === s)!).filter(Boolean);
          return (
            <div key={a.slug} className="nova-card nova-card-hover p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("h-11 w-11 rounded-md bg-gradient-to-br grid place-items-center text-white", colorClass[a.color])}>
                  <a.icon className="h-5 w-5" />
                </div>
                <StatusPill tone={a.status === "thinking" ? "warning" : "success"}>
                  {a.status === "active" ? "Active" : a.status === "thinking" ? "Thinking" : "Ready"}
                </StatusPill>
              </div>
              <h3 className="text-base font-semibold">{a.name}</h3>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-0.5">{a.role}</p>
              <p className="mt-2 text-sm text-muted-foreground flex-1">{a.specialty}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {tools.slice(0, 4).map((t) => (
                  <Link
                    key={t.slug}
                    to="/app/launchpad/$slug"
                    params={{ slug: t.slug }}
                    className="text-[11px] rounded-sm border border-border bg-surface-elevated px-1.5 py-0.5 hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    {t.name}
                  </Link>
                ))}
                {tools.length > 4 && (
                  <span className="text-[11px] text-muted-foreground px-1.5 py-0.5">+{tools.length - 4}</span>
                )}
              </div>
              <Button asChild size="sm" variant="outline" className="mt-4 w-fit">
                <Link to="/app/launchpad">Open mentor <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}
