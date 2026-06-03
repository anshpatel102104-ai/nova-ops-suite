import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { Activity as ActivityIcon, Zap, Boxes, CheckCircle2, XCircle, PowerOff, Power } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { listActivity } from "@/lib/dashboard.functions";
import { LAUNCHPAD_TOOLS, NOVA_SYSTEMS } from "@/lib/catalog";

export const Route = createFileRoute("/_app/activity")({
  component: ActivityPage,
});

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

function toolName(slug: string) {
  return LAUNCHPAD_TOOLS.find((t) => t.slug === slug)?.name ?? slug;
}
function systemName(slug: string) {
  return NOVA_SYSTEMS.find((s) => s.slug === slug)?.name ?? slug;
}

function ActivityPage() {
  const { workspace } = useWorkspace();
  const fetchActivity = useServerFn(listActivity);
  const { data, isLoading } = useQuery({
    queryKey: ["activity", workspace.id],
    queryFn: () => fetchActivity({ data: { workspaceId: workspace.id, limit: 60 } }),
  });

  const events = data?.events ?? [];

  return (
    <>
      <PageHeader eyebrow="Activity" title="Everything happening in your workspace." />

      <div className="nova-card p-5">
        {isLoading ? (
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-[0.16em] text-xs">Loading…</p>
        ) : events.length === 0 ? (
          <div className="py-10 text-center">
            <ActivityIcon className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No activity yet. Run a tool or activate a system to populate this feed.</p>
          </div>
        ) : (
          <ul className="relative space-y-5">
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
            {events.map((e) => {
              const meta = renderEvent(e);
              return (
                <li key={`${e.kind}-${e.id}`} className="relative flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full border border-border bg-surface-elevated grid place-items-center shrink-0 z-10">
                    <meta.icon className={`h-3.5 w-3.5 ${meta.iconClass}`} />
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pt-1">
                    <div>
                      <p className="text-sm font-medium">{meta.title}</p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <StatusPill tone={meta.tone} dot={false}>{meta.type}</StatusPill>
                        <span className="text-xs text-muted-foreground">{timeAgo(e.at)}</span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

type Event = NonNullable<Awaited<ReturnType<typeof listActivity>>>["events"][number];

function renderEvent(e: Event) {
  if (e.kind === "run") {
    const failed = e.status === "failed";
    return {
      icon: failed ? XCircle : Zap,
      iconClass: failed ? "text-destructive" : "text-primary",
      title: `${toolName(e.tool_slug)} ${failed ? "failed" : e.status === "succeeded" ? "completed" : e.status}`,
      type: "Tool run",
      tone: failed ? ("destructive" as const) : ("success" as const),
    };
  }
  if (e.kind === "asset") {
    return {
      icon: Boxes,
      iconClass: "text-primary",
      title: `Saved asset · ${e.name}`,
      type: e.type,
      tone: "primary" as const,
    };
  }
  return {
    icon: e.active ? Power : PowerOff,
    iconClass: e.active ? "text-[color:var(--success)]" : "text-muted-foreground",
    title: `${systemName(e.system_slug)} ${e.active ? "activated" : "updated"}`,
    type: "Automation",
    tone: e.active ? ("success" as const) : ("default" as const),
  };
}
