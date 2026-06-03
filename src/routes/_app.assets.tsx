import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { EmptyState } from "@/components/app/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2, FolderOpen, FileText, Eye } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listAssets, deleteAsset } from "@/lib/assets.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/assets")({
  component: AssetsPage,
});

type AssetType = "offer"|"script"|"proposal"|"campaign"|"content"|"workflow"|"other";
interface Asset {
  id: string;
  name: string;
  type: AssetType;
  body: string;
  tags: string[];
  source_run_id: string | null;
  created_at: string;
}

const TYPES = ["all","offer","script","proposal","campaign","content","workflow","other"] as const;

function AssetsPage() {
  const { workspace } = useWorkspace();
  const list = useServerFn(listAssets);
  const del = useServerFn(deleteAsset);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [filter, setFilter] = useState<typeof TYPES[number]>("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Asset | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { assets } = await list({ data: { workspaceId: workspace.id } });
      setAssets(assets as Asset[]);
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }, [list, workspace.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = assets.filter(a =>
    (filter === "all" || a.type === filter) &&
    a.name.toLowerCase().includes(q.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try { await del({ data: { id } }); setAssets((xs) => xs.filter(x => x.id !== id)); toast.success("Asset deleted"); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <>
      <PageHeader
        eyebrow="Assets"
        title="Everything you've generated."
        description="Search, filter, and reuse outputs you've saved from LaunchPad tools."
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search assets…" className="pl-8 bg-surface" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <button key={t} onClick={()=>setFilter(t)}
              className={`text-xs rounded-full border px-3 py-1.5 capitalize transition-colors ${
                filter === t ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}>{t}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="nova-card p-8 text-center text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={assets.length === 0 ? "No assets yet" : "Nothing matches"}
          description={assets.length === 0 ? "Run a LaunchPad tool and click Save to Assets." : "Try a different filter or search."}
        />
      ) : (
        <div className="nova-card overflow-hidden">
          <ul className="divide-y divide-border">
            {filtered.map((a) => (
              <li key={a.id} className="flex items-center justify-between p-4 hover:bg-surface-elevated/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-md border border-border bg-surface-elevated grid place-items-center shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusPill tone="muted" dot={false}>{a.type}</StatusPill>
                  <Button size="sm" variant="ghost" onClick={() => setPreview(a)}><Eye className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>{preview?.name}</DialogTitle></DialogHeader>
          <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{preview?.body}</pre>
        </DialogContent>
      </Dialog>
    </>
  );
}
