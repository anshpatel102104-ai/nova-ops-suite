import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listWorkflows, createWorkflow, deleteWorkflow } from "@/lib/workflows.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { AGENTS, LAUNCHPAD_TOOLS } from "@/lib/catalog";
import { ArrowRight, Copy, GitBranch, Plus, Sparkles, Trash2, Workflow } from "lucide-react";

export const Route = createFileRoute("/_app/workflows")({
  component: WorkflowsPage,
});

type Wf = {
  id: string;
  name: string;
  description: string;
  agent_slug: string;
  steps: { label: string; tool_slug: string; prompt_template: string }[];
  is_template: boolean;
  workspace_id: string | null;
  created_at: string;
};

function WorkflowsPage() {
  const { workspace } = useWorkspace();
  const listFn = useServerFn(listWorkflows);
  const cloneFn = useServerFn(createWorkflow);
  const deleteFn = useServerFn(deleteWorkflow);
  const navigate = useNavigate();

  const [items, setItems] = useState<Wf[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const { workflows } = await listFn({ data: { workspaceId: workspace.id } });
      setItems(workflows as unknown as Wf[]);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [workspace.id]);

  const templates = (items ?? []).filter((w) => w.is_template);
  const mine = (items ?? []).filter((w) => !w.is_template);

  async function cloneTemplate(w: Wf) {
    setBusy(w.id);
    try {
      const { id } = await cloneFn({
        data: {
          workspaceId: workspace.id,
          name: w.name,
          description: w.description,
          agentSlug: w.agent_slug,
          steps: w.steps,
        },
      });
      toast.success("Workflow added");
      navigate({ to: "/app/workflows/$id", params: { id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function createBlank() {
    setBusy("__new");
    try {
      const { id } = await cloneFn({
        data: {
          workspaceId: workspace.id,
          name: "Untitled workflow",
          description: "",
          agentSlug: "nova",
          steps: [{
            label: "Step 1",
            tool_slug: LAUNCHPAD_TOOLS[0].slug,
            prompt_template: "{{input}}",
          }],
        },
      });
      navigate({ to: "/app/workflows/$id", params: { id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this workflow?")) return;
    try {
      await deleteFn({ data: { id } });
      toast.success("Deleted");
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Multi-Step Playbooks"
        title="Workflows that chain your agents."
        description="Compose 2–10 tool steps. Each step passes its output into the next. Run, save, repeat."
        actions={
          <Button onClick={createBlank} disabled={busy === "__new"}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> New workflow
          </Button>
        }
      />

      <SectionHeader
        title="// Your workflows"
        description={mine.length ? `${mine.length} active in this workspace` : "Customize one of the starter playbooks below"}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {items === null && Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 nova-card" />
        ))}
        {items !== null && mine.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3">
            <EmptyState
              icon={Workflow}
              title="No workflows yet"
              description="Start from a template below or build one from scratch."
            />
          </div>
        )}
        {mine.map((w) => {
          const agent = AGENTS.find((a) => a.slug === w.agent_slug);
          return (
            <div key={w.id} className="nova-card p-4 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <StatusPill tone="primary"><GitBranch className="h-3 w-3" /> {agent?.name ?? w.agent_slug}</StatusPill>
                <button onClick={() => remove(w.id)} className="text-muted-foreground hover:text-destructive p-1 -m-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <h3 className="font-semibold text-sm">{w.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">{w.description || `${w.steps.length} steps`}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {w.steps.length} step{w.steps.length === 1 ? "" : "s"}
                </span>
                <Button asChild size="sm" variant="outline">
                  <Link to="/app/workflows/$id" params={{ id: w.id }}>
                    Open <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <SectionHeader title="// Starter playbooks" description="Battle-tested chains from each agent. Clone to customize." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items === null && Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 nova-card" />
        ))}
        {templates.map((w) => {
          const agent = AGENTS.find((a) => a.slug === w.agent_slug);
          return (
            <div key={w.id} className="nova-card p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <StatusPill tone="muted"><Sparkles className="h-3 w-3" /> Template</StatusPill>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{agent?.name ?? w.agent_slug}</span>
              </div>
              <h3 className="font-semibold text-sm">{w.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 flex-1">{w.description}</p>
              <ol className="mt-3 space-y-1">
                {w.steps.map((s, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <span className="font-mono text-primary">{String(i + 1).padStart(2, "0")}</span>
                    <span className="truncate">{s.label}</span>
                  </li>
                ))}
              </ol>
              <Button onClick={() => cloneTemplate(w)} disabled={busy === w.id} size="sm" className="mt-3">
                <Copy className="h-3 w-3 mr-1.5" /> Use this playbook
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}
