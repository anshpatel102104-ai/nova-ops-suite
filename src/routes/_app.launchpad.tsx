import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { LockedOverlay } from "@/components/app/LockedOverlay";
import { LAUNCHPAD_TOOLS } from "@/lib/catalog";
import { useWorkspace } from "@/hooks/use-workspace";
import { canAccessTool, PLANS } from "@/lib/plan";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/launchpad")({
  component: LaunchPadPage,
});

function LaunchPadPage() {
  const { workspace } = useWorkspace();

  return (
    <>
      <PageHeader
        eyebrow="LaunchPad"
        title="10 founder tools to ship faster."
        description="Generate the assets that move revenue — offers, scripts, outreach, content, proposals."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {LAUNCHPAD_TOOLS.map((tool, i) => {
          const unlocked = canAccessTool(workspace.plan, i);
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
                <Button asChild size="sm" className="mt-4 w-fit" variant="outline">
                  <Link to="/app/launchpad/$slug" params={{ slug: tool.slug }}>
                    Launch tool <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
              {!unlocked && <LockedOverlay requiredPlan={PLANS.launch.name} />}
            </div>
          );
        })}
      </div>
    </>
  );
}
