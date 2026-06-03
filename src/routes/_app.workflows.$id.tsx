import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getWorkflow, updateWorkflow, runWorkflow, listWorkflowRuns } from "@/lib/workflows.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { AGENTS, LAUNCHPAD_TOOLS } from "@/lib/catalog";
import { ArrowLeft, ArrowRight, Clock, GripVertical, Play, Plus, Save, Trash2, Zap } from "lucide-react";

export const Route = createFileRoute("/_app/workflows/$id")({
  component: WorkflowEditor,
});

type Step = { label: string; tool_slug: string; prompt_template: string };

function WorkflowEditor() {
  const { id } = useParams({ from: "/_app/workflows/$id" });
  const { workspace } = useWorkspace();
  const getFn = useServerFn(getWorkflow);
  const updateFn = useServerFn(updateWorkflow);
  const runFn = useServerFn(runWorkflow);
  const listRunsFn = useServerFn(listWorkflowRuns);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [agentSlug, setAgentSlug] = useState("nova");
  const [steps, setSteps] = useState<Step[]>([]);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; status: string; created_at: string; total_duration_ms: number | null }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const { workflow } = await getFn({ data: { id } });
        setName(workflow.name);
        setDescription(workflow.description);
        setAgentSlug(workflow.agent_slug);
        setSteps(workflow.steps as unknown as Step[]);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLoading(false);
      }
      try {
        const { runs } = await listRunsFn({ data: { workspaceId: workspace.id, workflowId: id, limit: 10 } });
        setHistory(runs as never);
      } catch {/* ignore */}
    })();
    // eslint-disable-next-line
  }, [id]);

  function updateStep(i: number, patch: Partial<Step>) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function moveStep(i: number, dir: -1 | 1) {
    setSteps((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function addStep() {
    if (steps.length >= 10) return toast.error("Max 10 steps");
    setSteps((prev) => [
      ...prev,
      { label: `Step ${prev.length + 1}`, tool_slug: LAUNCHPAD_TOOLS[0].slug, prompt_template: prev.length === 0 ? "{{input}}" : `Previous output:\n{{step_${prev.length}}}\n\nWrite the next step.` },
    ]);
  }
  function removeStep(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    try {
      await updateFn({ data: { id, name, description, agentSlug, steps } });
      toast.success("Saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function run() {
    if (!input.trim()) return toast.error("Provide a starting input");
    setRunning(true);
    try {
      await updateFn({ data: { id, name, description, agentSlug, steps } });
      const { runId } = await runFn({ data: { workspaceId: workspace.id, workflowId: id, input } });
      navigate({ to: "/app/workflows/runs/$runId", params: { runId } });
    } catch (e) {
      toast.error((e as Error).message);
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Loading workflow…" />
        <Skeleton className="h-60 nova-card" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Workflow editor"
        title={name || "Untitled workflow"}
        description="Each step is a tool. Reference inputs with {{input}} and prior outputs with {{step_1}}, {{step_2}}, …"
        actions={
          <>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/workflows"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> All workflows</Link>
            </Button>
            <Button onClick={save} disabled={saving} variant="outline" size="sm">
              <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      />

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-4">
          <div className="nova-card p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Owner agent</label>
                <Select value={agentSlug} onValueChange={setAgentSlug}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AGENTS.map((a) => <SelectItem key={a.slug} value={a.slug}>{a.name} · {a.role}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1" />
            </div>
          </div>

          <SectionHeader title="// Steps" description={`${steps.length} of 10`} actions={
            <Button size="sm" variant="outline" onClick={addStep}><Plus className="h-3 w-3 mr-1.5" /> Add step</Button>
          } />

          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className="nova-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Step {String(i + 1).padStart(2, "0")}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <button onClick={() => moveStep(i, -1)} disabled={i === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><GripVertical className="h-3.5 w-3.5 rotate-90" /></button>
                    <button onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><GripVertical className="h-3.5 w-3.5 -rotate-90" /></button>
                    <button onClick={() => removeStep(i)} disabled={steps.length === 1} className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-30"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Label</label>
                    <Input value={s.label} onChange={(e) => updateStep(i, { label: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Tool</label>
                    <Select value={s.tool_slug} onValueChange={(v) => updateStep(i, { tool_slug: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LAUNCHPAD_TOOLS.map((t) => <SelectItem key={t.slug} value={t.slug}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Prompt template</label>
                  <Textarea value={s.prompt_template} onChange={(e) => updateStep(i, { prompt_template: e.target.value })} rows={4} className="mt-1 font-mono text-xs" />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Variables: <code className="text-primary">{"{{input}}"}</code>
                    {i > 0 && Array.from({ length: i }).map((_, k) => (
                      <span key={k}> · <code className="text-primary">{`{{step_${k + 1}}}`}</code></span>
                    ))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="nova-card p-4">
            <SectionHeader title="// Run this workflow" />
            <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Starting input</label>
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={6} placeholder="Paste the seed idea, brief, or context…" className="mt-1 mb-3" />
            <Button onClick={run} disabled={running} className="w-full">
              {running ? (
                <><Zap className="h-3.5 w-3.5 mr-1.5 animate-pulse" /> Running {steps.length} steps…</>
              ) : (
                <><Play className="h-3.5 w-3.5 mr-1.5" /> Run workflow</>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground mt-2">Saves automatically before running.</p>
          </div>

          <div className="nova-card p-4">
            <SectionHeader title="// Recent runs" />
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground">No runs yet.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((r) => (
                  <li key={r.id}>
                    <Link to="/app/workflows/runs/$runId" params={{ runId: r.id }} className="flex items-center justify-between text-xs hover:text-primary group">
                      <span className="flex items-center gap-2">
                        <StatusPill tone={r.status === "succeeded" ? "success" : r.status === "failed" ? "destructive" : "warning"}>{r.status}</StatusPill>
                        <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                      </span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
