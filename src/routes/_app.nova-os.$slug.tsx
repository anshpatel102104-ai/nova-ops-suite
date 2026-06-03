import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { NOVA_SYSTEMS } from "@/lib/catalog";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Plug, Power, PowerOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useWorkspace } from "@/hooks/use-workspace";
import { getSystemConfig, upsertSystemConfig } from "@/lib/nova-systems.functions";

export const Route = createFileRoute("/_app/nova-os/$slug")({
  component: SystemDetail,
});

const CHECKLIST_KEYS = [
  { key: "connectData",      label: "Connect data source" },
  { key: "configureTrigger", label: "Configure trigger" },
  { key: "setOutput",        label: "Set output destination" },
  { key: "testRun",          label: "Test run" },
] as const;

type ConfigState = {
  id?: string;
  active: boolean;
  config: Record<string, unknown>;
  last_run_at: string | null;
};

function SystemDetail() {
  const { slug } = useParams({ from: "/_app/nova-os/$slug" });
  const { workspace } = useWorkspace();
  const sys = NOVA_SYSTEMS.find((s) => s.slug === slug);

  const getCfg = useServerFn(getSystemConfig);
  const saveCfg = useServerFn(upsertSystemConfig);

  const [state, setState] = useState<ConfigState>({ active: false, config: {}, last_run_at: null });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!sys) return;
    try {
      const { config } = await getCfg({ data: { workspaceId: workspace.id, systemSlug: sys.slug } });
      if (config) {
        setState({
          id: config.id,
          active: config.active,
          config: (config.config ?? {}) as Record<string, unknown>,
          last_run_at: config.last_run_at,
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [getCfg, sys, workspace.id]);

  useEffect(() => { load(); }, [load]);

  if (!sys) {
    return (
      <>
        <PageHeader title="System not found" />
        <EmptyState title="That system doesn't exist" action={
          <Button asChild><Link to="/app/nova-os">Back to Nova OS</Link></Button>
        } />
      </>
    );
  }

  const allChecked = CHECKLIST_KEYS.every((c) => state.config[c.key] === true);

  const toggleStep = async (key: string) => {
    const next = { ...state.config, [key]: !state.config[key] };
    setState((s) => ({ ...s, config: next }));
    try { await saveCfg({ data: { workspaceId: workspace.id, systemSlug: sys.slug, config: next } }); }
    catch (e) { toast.error((e as Error).message); load(); }
  };

  const toggleActive = async () => {
    if (!state.active && !allChecked) { toast.error("Complete the setup checklist first."); return; }
    setBusy(true);
    try {
      const { config } = await saveCfg({
        data: { workspaceId: workspace.id, systemSlug: sys.slug, active: !state.active },
      });
      setState((s) => ({ ...s, active: config.active }));
      toast.success(config.active ? "System activated" : "System deactivated");
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <Link to="/app/nova-os" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> All systems
      </Link>
      <PageHeader
        eyebrow="Nova OS"
        title={sys.name}
        description={sys.description}
        actions={
          <>
            <StatusPill tone={state.active ? "success" : allChecked ? "primary" : "warning"}>
              {state.active ? "Active" : allChecked ? "Ready" : "Setup needed"}
            </StatusPill>
            <Button onClick={toggleActive} disabled={busy || loading} variant={state.active ? "outline" : "default"}>
              {state.active
                ? <><PowerOff className="h-4 w-4 mr-1.5" /> Deactivate</>
                : <><Power className="h-4 w-4 mr-1.5" /> Activate</>}
            </Button>
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="nova-card p-5">
            <SectionHeader title="System flow" description="Trigger → Action → Output" />
            <div className="grid grid-cols-3 gap-2">
              <FlowCell label="Trigger" value={sys.trigger} />
              <FlowCell label="Action" value={sys.action} />
              <FlowCell label="Output" value={sys.output} />
            </div>
          </div>

          <div className="nova-card p-5">
            <SectionHeader title="Setup checklist" description="Complete each step to activate this system." />
            <ul className="divide-y divide-border">
              {CHECKLIST_KEYS.map((c) => {
                const done = state.config[c.key] === true;
                return (
                  <li key={c.key} className="py-3 flex items-center justify-between">
                    <button
                      onClick={() => toggleStep(c.key)}
                      disabled={loading}
                      className="flex items-center gap-3 text-left flex-1 hover:text-primary transition-colors"
                    >
                      {done
                        ? <CheckCircle2 className="h-4 w-4 text-primary" />
                        : <Circle className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm">{c.label}</span>
                    </button>
                    <Button size="sm" variant="ghost" onClick={() => toggleStep(c.key)} disabled={loading}>
                      {done ? "Undo" : "Mark done"} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="nova-card p-5">
            <SectionHeader title="Activity log" />
            {state.last_run_at ? (
              <p className="text-sm text-muted-foreground">Last run {new Date(state.last_run_at).toLocaleString()}</p>
            ) : (
              <EmptyState title="No activity yet" description="Once activated, every run shows up here." />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="nova-card p-5">
            <SectionHeader title="Connected services" />
            <ul className="space-y-2 text-sm">
              {["Lovable Cloud", "Provider keys", "Workflows"].map((svc, i) => (
                <li key={svc} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plug className="h-3.5 w-3.5 text-muted-foreground" />
                    {svc}
                  </div>
                  <StatusPill tone={i < 2 ? "success" : "muted"}>{i < 2 ? "Connected" : "Optional"}</StatusPill>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="sm" className="w-full mt-4">
              <Link to="/app/integrations">Manage integrations</Link>
            </Button>
          </div>

          <div className="nova-card p-5">
            <SectionHeader title="Status" />
            <ul className="space-y-2.5 text-sm">
              <li className="flex justify-between"><span className="text-muted-foreground">State</span>
                <StatusPill tone={state.active ? "success" : "warning"}>{state.active ? "Active" : "Inactive"}</StatusPill>
              </li>
              <li className="flex justify-between"><span className="text-muted-foreground">Last run</span>
                <span>{state.last_run_at ? new Date(state.last_run_at).toLocaleDateString() : "—"}</span>
              </li>
              <li className="flex justify-between"><span className="text-muted-foreground">Setup</span>
                <span>{CHECKLIST_KEYS.filter(c => state.config[c.key] === true).length}/{CHECKLIST_KEYS.length}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function FlowCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-1">{value}</p>
    </div>
  );
}
