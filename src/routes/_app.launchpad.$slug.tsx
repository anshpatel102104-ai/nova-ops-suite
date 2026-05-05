import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { SectionHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { EmptyState } from "@/components/app/EmptyState";
import { LAUNCHPAD_TOOLS } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Download, History, Save, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/launchpad/$slug")({
  component: ToolDetail,
  notFoundComponent: () => <EmptyState title="Tool not found" />,
});

function ToolDetail() {
  const { slug } = useParams({ from: "/_app/launchpad/$slug" });
  const tool = LAUNCHPAD_TOOLS.find((t) => t.slug === slug);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setLoading(true); setError(null); setOutput(null);
    try {
      // TODO: POST to n8n webhook for `${tool.slug}` and persist run in Supabase
      await new Promise((r) => setTimeout(r, 900));
      setOutput(`# ${tool.name} result\n\nGenerated draft based on:\n"${input}"\n\n— Replace with live n8n output —`);
    } catch (e) {
      setError("Run failed. Try again.");
    } finally {
      setLoading(false);
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
              <TabsTrigger value="history"><History className="h-3.5 w-3.5 mr-1.5" /> History</TabsTrigger>
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
                  <p className="text-sm text-destructive">{error}</p>
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
                    <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{output}</pre>
                    <div className="mt-4 flex items-center gap-2">
                      <Button size="sm" variant="outline"><Save className="h-3.5 w-3.5 mr-1.5" /> Save to Assets</Button>
                      <Button size="sm" variant="ghost"><Download className="h-3.5 w-3.5 mr-1.5" /> Export</Button>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
            <TabsContent value="history" className="mt-3">
              <EmptyState icon={History} title="No runs yet" description="Your past runs will appear here." />
              {/* TODO: list previous runs from Supabase tool_runs */}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
