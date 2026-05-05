import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { EmptyState } from "@/components/app/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, FolderOpen, FileText } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/assets")({
  component: AssetsPage,
});

interface Asset { id: string; name: string; type: "Offer"|"Script"|"Proposal"|"Campaign"|"Content"|"Workflow"; created: string; }

const ASSETS: Asset[] = [
  { id: "1", name: "B2B Agency Offer v2", type: "Offer", created: "Today" },
  { id: "2", name: "Cold Email — SaaS founders", type: "Campaign", created: "Yesterday" },
  { id: "3", name: "Discovery Call Script", type: "Script", created: "3d ago" },
];
const TYPES = ["All","Offer","Script","Proposal","Campaign","Content","Workflow"] as const;

function AssetsPage() {
  const [filter, setFilter] = useState<typeof TYPES[number]>("All");
  const [q, setQ] = useState("");
  const filtered = ASSETS.filter(a =>
    (filter === "All" || a.type === filter) &&
    a.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <PageHeader
        eyebrow="Assets"
        title="Everything you've generated."
        description="Search, filter, and reuse your offers, scripts, proposals, and campaigns."
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search assets…" className="pl-8 bg-surface" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <button key={t} onClick={()=>setFilter(t)}
              className={`text-xs rounded-full border px-3 py-1.5 transition-colors ${
                filter === t ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}>{t}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No assets yet" description="Run a LaunchPad tool to generate your first asset." />
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
                    <p className="text-xs text-muted-foreground">{a.created}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusPill tone="muted" dot={false}>{a.type}</StatusPill>
                  <Button size="sm" variant="ghost"><Download className="h-3.5 w-3.5" /></Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* TODO: load from Supabase generated_assets */}
    </>
  );
}
