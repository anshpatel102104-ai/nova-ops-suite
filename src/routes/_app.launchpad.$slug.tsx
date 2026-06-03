import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { EmptyState } from "@/components/app/EmptyState";
import { LAUNCHPAD_TOOLS } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Download, History, Save, Sparkles, Zap } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { runTool, listToolRuns } from "@/lib/tool-runs.functions";
import { createAsset } from "@/lib/assets.functions";
import { useWorkspace } from "@/hooks/use-workspace";

const TOOL_TO_ASSET_TYPE: Record<string, "offer"|"script"|"proposal"|"campaign"|"content"|"workflow"|"other"> = {
  "offer-builder":"offer","sales-script":"script","cold-email":"campaign","pitch-generator":"proposal",
  "messaging-angles":"content","landing-copy":"content","lead-magnet":"content","content-strategy":"content",
  "sop-builder":"workflow","automation-planner":"workflow","agent-prompt-builder":"workflow",
};

export const Route = createFileRoute("/_app/launchpad/$slug")({
  component: ToolDetail,
  notFoundComponent: () => <EmptyState title="Tool not found" />,
});

type RunRow = {
  id: string;
  status: "pending" | "running" | "succeeded" | "failed";
  input: string;
  output: string | null;
  error: string | null;
  provider: string | null;
  model: string | null;
  duration_ms: number | null;
  created_at: string;
};

function ToolDetail() {
  const { slug } = useParams({ from: "/_app/launchpad/$slug" });
  const { workspace } = useWorkspace();
  const tool = LAUNCHPAD_TOOLS.find((t) => t.slug === slug);

  const runFn = useServerFn(runTool);
  const listFn = useServerFn(listToolRuns);
  const saveFn = useServerFn(createAsset);

  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ provider?: string; model?: string } | null>(null);
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RunRow[]>([]);

  const refresh = useCallback(async () => {
    if (!tool) return;
    try {
      const { runs } = await listFn({ data: { workspaceId: workspace.id, toolSlug: tool.slug } });
      setHistory(runs as RunRow[]);
    } catch (e) {
      console.error(e);
    }
  }, [listFn, tool, workspace.id]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!tool) {
    return (
      <>
        <PageHeader title="Tool not found" />
        <EmptyState title="That tool doesn't exist" action={
          <Button asChild><Link to="/app/launchpad">Back to LaunchPad</Link></Button>
        } />
      </>
    );
  }

  const run = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(null); setOutput(null); setMeta(null); setLastRunId(null);
    try {
      const res = await runFn({
        data: {
          workspaceId: workspace.id,
          toolSlug: tool.slug,
          agentSlug: tool.agent,
          input,
        },
      });
      setOutput(res.output);
      setMeta({ provider: res.provider, model: res.model });
      setLastRunId(res.runId);
      await refresh();
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      toast.error(msg);
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const saveAsAsset = async () => {
    if (!output) return;
    setSaving(true);
    try {
      await saveFn({
        data: {
          workspaceId: workspace.id,
          name: `${tool.name} — ${new Date().toLocaleString()}`,
          type: TOOL_TO_ASSET_TYPE[tool.slug] ?? "other",
          body: output,
          sourceRunId: lastRunId ?? undefined,
        },
      });
      toast.success("Saved to Assets");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Link to="/app/launchpad" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> All tools
      </Link>
      <PageHeader
        eyebrow="LaunchPad"
        title={tool.name}
        description={tool.description}
        actions={<StatusPill tone={tool.status === "ready" ? "success" : "warning"}>{tool.status === "ready" ? "Ready" : "Beta"}</StatusPill>}
      />

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Input */}
        <div className="lg:col-span-2 nova-card p-5">
          <SectionHeader title="Input" description="Tell the tool what you need." />
          <Textarea
            rows={10}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your offer, audience, or context…"
            className="bg-surface-elevated border-border"
          />
          <div className="mt-4 flex items-center gap-2">
            <Button onClick={run} disabled={loading || !input.trim()}>
              <Zap className="h-4 w-4 mr-1.5" /> {loading ? "Running…" : "Run tool"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setInput("")}>Clear</Button>
          </div>
        </div>

        {/* Output / history */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="output">
            <TabsList>
              <TabsTrigger value="output"><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Output</TabsTrigger>
              <TabsTrigger value="history"><History className="h-3.5 w-3.5 mr-1.5" /> History {history.length > 0 && `(${history.length})`}</TabsTrigger>
            </TabsList>
            <TabsContent value="output" className="mt-3">
              <div className="nova-card p-5 min-h-[320px]">
                {loading && (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                )}
                {error && !loading && (
                  <div className="text-sm">
                    <p className="text-destructive font-medium">Run failed</p>
                    <p className="text-muted-foreground mt-1">{error}</p>
                  </div>
                )}
                {!loading && !output && !error && (
                  <EmptyState
                    icon={Sparkles}
                    title="Nothing here yet"
                    description="Run the tool to see your output."
                  />
                )}
                {!loading && output && (
                  <>
                    {meta && (
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                        {meta.provider} · {meta.model}
                      </p>
                    )}
                    <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{output}</pre>
                    <div className="mt-4 flex items-center gap-2">
                      <Button size="sm" variant="outline" disabled={saving} onClick={saveAsAsset}><Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? "Saving…" : "Save to Assets"}</Button>
                      <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(output)}>
                        <Download className="h-3.5 w-3.5 mr-1.5" /> Copy
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
            <TabsContent value="history" className="mt-3">
              {history.length === 0 ? (
                <EmptyState icon={History} title="No runs yet" description="Your past runs will appear here." />
              ) : (
                <ul className="space-y-2">
                  {history.map((r) => (
                    <li key={r.id} className="nova-card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <StatusPill tone={r.status === "succeeded" ? "success" : r.status === "failed" ? "warning" : "muted"}>
                          {r.status}
                        </StatusPill>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(r.created_at).toLocaleString()} {r.provider ? `· ${r.provider}/${r.model}` : ""}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{r.input}</p>
                      {r.output && (
                        <button
                          onClick={() => { setOutput(r.output); setMeta({ provider: r.provider ?? undefined, model: r.model ?? undefined }); setError(null); }}
                          className="text-xs text-primary hover:underline"
                        >
                          Load output
                        </button>
                      )}
                      {r.error && <p className="text-xs text-destructive">{r.error}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
