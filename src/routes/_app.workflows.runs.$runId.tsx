import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getWorkflowRun } from "@/lib/workflows.functions";
import { createAsset } from "@/lib/assets.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { ArrowLeft, CheckCircle2, Circle, Loader2, Save, XCircle } from "lucide-react";

export const Route = createFileRoute("/_app/workflows/runs/$runId")({
  component: RunDetail,
});

type Step = {
  label: string;
  tool_slug: string;
  status: "pending" | "running" | "succeeded" | "failed";
  output: string | null;
  error: string | null;
  run_id: string | null;
  duration_ms: number | null;
};
type Run = {
  id: string;
  workflow_id: string;
  input: string;
  status: "pending" | "running" | "succeeded" | "failed";
  current_step: number;
  steps: Step[];
  total_duration_ms: number | null;
  error: string | null;
  created_at: string;
};

function RunDetail() {
  const { runId } = useParams({ from: "/_app/workflows/runs/$runId" });
  const { workspace } = useWorkspace();
  const getFn = useServerFn(getWorkflowRun);
  const saveAssetFn = useServerFn(createAsset);
  const [run, setRun] = useState<Run | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const { run } = await getFn({ data: { id: runId } });
        if (cancelled) return;
        const typed = run as unknown as Run;
        setRun(typed);
        if (typed.status === "running" || typed.status === "pending") {
          timer.current = window.setTimeout(tick, 1500);
        }
      } catch (e) {
        if (!cancelled) toast.error((e as Error).message);
      }
    }
    tick();
    return () => {
      cancelled = true;
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [runId, getFn]);

  async function saveStep(i: number) {
    if (!run) return;
    const step = run.steps[i];
    if (!step.output) return;
    setSaving(i);
    try {
      await saveAssetFn({
        data: {
          workspaceId: workspace.id,
          name: `${step.label} · ${new Date(run.created_at).toLocaleDateString()}`,
          type: "other",
          body: step.output,
          sourceRunId: step.run_id ?? undefined,
        },
      });
      toast.success("Saved to Assets");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(null);
    }
  }

  if (!run) {
    return (
      <>
        <PageHeader title="Loading run…" />
        <Skeleton className="h-60 nova-card" />
      </>
    );
  }

  const tone = run.status === "succeeded" ? "success" : run.status === "failed" ? "destructive" : "warning";

  return (
    <>
      <PageHeader
        eyebrow="Workflow run"
        title={`Run ${run.id.slice(0, 8)}`}
        description={`Started ${new Date(run.created_at).toLocaleString()}${run.total_duration_ms ? ` · ${(run.total_duration_ms / 1000).toFixed(1)}s` : ""}`}
        actions={
          <>
            <StatusPill tone={tone}>{run.status}</StatusPill>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/workflows/$id" params={{ id: run.workflow_id }}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to workflow
              </Link>
            </Button>
          </>
        }
      />

      <div className="nova-card p-4 mb-4">
        <SectionHeader title="// Starting input" />
        <pre className="text-xs whitespace-pre-wrap text-muted-foreground">{run.input}</pre>
      </div>

      {run.error && (
        <div className="nova-card p-4 mb-4 border-destructive/40">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-destructive mb-1">// Run failed</p>
          <p className="text-xs">{run.error}</p>
        </div>
      )}

      <div className="space-y-3">
        {run.steps.map((s, i) => {
          const Icon = s.status === "succeeded" ? CheckCircle2 : s.status === "failed" ? XCircle : s.status === "running" ? Loader2 : Circle;
          const iconColor = s.status === "succeeded" ? "text-[color:var(--success)]" : s.status === "failed" ? "text-destructive" : s.status === "running" ? "text-primary animate-spin" : "text-muted-foreground";
          return (
            <div key={i} className="nova-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <Icon className={`h-4 w-4 ${iconColor}`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Step {i + 1}: {s.label}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{s.tool_slug}{s.duration_ms ? ` · ${(s.duration_ms / 1000).toFixed(1)}s` : ""}</p>
                </div>
                {s.status === "succeeded" && s.output && (
                  <Button size="sm" variant="outline" disabled={saving === i} onClick={() => saveStep(i)}>
                    <Save className="h-3 w-3 mr-1.5" /> Save to Assets
                  </Button>
                )}
              </div>
              {s.error && <p className="text-xs text-destructive">{s.error}</p>}
              {s.output && (
                <pre className="text-xs whitespace-pre-wrap bg-surface-elevated border border-border rounded p-3 max-h-96 overflow-auto">{s.output}</pre>
              )}
              {s.status === "pending" && (
                <p className="text-xs text-muted-foreground italic">Waiting…</p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
