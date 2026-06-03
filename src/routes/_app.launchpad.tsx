import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { LockedOverlay } from "@/components/app/LockedOverlay";
import { LAUNCHPAD_TOOLS, STAGE_META, AGENTS } from "@/lib/catalog";
import { useWorkspace } from "@/hooks/use-workspace";
import { canAccessTool, PLANS } from "@/lib/plan";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/launchpad")({
  component: LaunchPadPage,
});

function LaunchPadPage() {
  const { workspace } = useWorkspace();

  // Group tools by stage, ordered by STAGE_META.order
  const stages = Object.entries(STAGE_META).sort((a, b) => a[1].order - b[1].order) as [
    keyof typeof STAGE_META,
    (typeof STAGE_META)[keyof typeof STAGE_META],
  ][];

  return (
    <>
      <PageHeader
        eyebrow="Founder Academy · 17 Modules"
        title="Idea → offer → revenue, one mission at a time."
        description="Mentor agents guide you through every stage of the founder journey."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/app/agents"><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Meet your mentors</Link>
          </Button>
        }
      />

      <div className="space-y-8">
        {stages.map(([stage, meta]) => {
          const tools = LAUNCHPAD_TOOLS.filter((t) => t.stage === stage);
          if (tools.length === 0) return null;
          return (
            <section key={stage}>
              <SectionHeader
                title={`${String(meta.order).padStart(2, "0")} · ${meta.label}`}
                description={`${tools.length} module${tools.length > 1 ? "s" : ""}`}
              />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((tool) => {
                  const globalIndex = LAUNCHPAD_TOOLS.indexOf(tool);
                  const unlocked = canAccessTool(workspace.plan, globalIndex);
                  const agent = AGENTS.find((a) => a.slug === tool.agent);
                  return (
                    <div key={tool.slug} className="relative">
                      <div className="nova-card nova-card-hover p-5 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <div className="h-9 w-9 rounded-md border border-border bg-surface-elevated grid place-items-center">
                            <tool.icon className="h-4 w-4 text-primary" />
                          </div>
                          <StatusPill tone={tool.status === "ready" ? "success" : "warning"}>
                            {tool.status === "ready" ? "Ready" : "Beta"}
                          </StatusPill>
                        </div>
                        <h3 className="text-sm font-semibold">{tool.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground flex-1">{tool.description}</p>
                        {agent && (
                          <div className="mt-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            Mentor · <span className="text-foreground/80">{agent.name}</span>
                          </div>
                        )}
                        <Button asChild size="sm" className="mt-4 w-fit" variant="outline">
                          <Link to="/app/launchpad/$slug" params={{ slug: tool.slug }}>
                            Launch module <ArrowRight className="h-3.5 w-3.5 ml-1" />
                          </Link>
                        </Button>
                      </div>
                      {!unlocked && <LockedOverlay requiredPlan={PLANS.pro.name} />}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
