import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { Button } from "@/components/ui/button";
import { PLANS, PLAN_ORDER, planRank, formatLimit, type PlanId } from "@/lib/plan";
import { useWorkspace } from "@/hooks/use-workspace";
import { getBillingOverview, setWorkspacePlan } from "@/lib/billing.functions";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/billing")({
  component: BillingPage,
});

function BillingPage() {
  const { workspace, refresh } = useWorkspace();
  const qc = useQueryClient();
  const fetchOverview = useServerFn(getBillingOverview);
  const setPlan = useServerFn(setWorkspacePlan);

  const { data, isLoading } = useQuery({
    queryKey: ["billing", workspace.id],
    queryFn: () => fetchOverview({ data: { workspaceId: workspace.id } }),
  });

  const mutate = useMutation({
    mutationFn: (plan: PlanId) => setPlan({ data: { workspaceId: workspace.id, plan } }),
    onSuccess: async (_res, plan) => {
      toast.success(`Switched to ${PLANS[plan].name}`);
      await Promise.all([refresh(), qc.invalidateQueries({ queryKey: ["billing", workspace.id] })]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const currentId = (data?.plan ?? workspace.plan) as PlanId;
  const current = PLANS[currentId];

  return (
    <>
      <PageHeader eyebrow="Billing" title="Plan, usage, and limits." />

      <div className="nova-card p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Current plan</p>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">{current.name}</h2>
            <StatusPill tone="primary">${current.price}/mo</StatusPill>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{current.tagline}</p>
        </div>
        {data && !data.isOwner && (
          <p className="text-xs text-muted-foreground">Only the workspace owner can change the plan.</p>
        )}
      </div>

      <SectionHeader title="This month" description="Usage resets on the 1st of each month." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <UsageCard label="Tool runs" value={data?.usage.tool_runs ?? 0} limit={current.limits.tool_runs} loading={isLoading} />
        <UsageCard label="Workflow runs" value={data?.usage.workflow_runs ?? 0} limit={current.limits.workflow_runs} loading={isLoading} />
        <UsageCard label="Teammates" value={data?.usage.members ?? 0} limit={current.limits.members} loading={isLoading} />
        <UsageCard label="Custom playbooks" value={data?.usage.custom_playbooks ?? 0} limit={current.limits.custom_playbooks} loading={isLoading} />
      </div>

      <SectionHeader title="Plans" description="Upgrade or downgrade anytime." />
      <div className="grid md:grid-cols-3 gap-4">
        {PLAN_ORDER.map((p) => {
          const plan = PLANS[p];
          const isCurrent = p === currentId;
          const isUpgrade = planRank(p) > planRank(currentId);
          const disabled = isCurrent || mutate.isPending || (data && !data.isOwner);
          return (
            <div key={p} className={`nova-card p-5 flex flex-col ${isCurrent ? "border-primary/50" : ""}`}>
              {p === "pro" && (
                <div className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary text-[10px] font-medium px-2 py-0.5 mb-3 self-start">
                  <Sparkles className="h-3 w-3" /> Most popular
                </div>
              )}
              <h3 className="text-sm font-semibold">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight">${plan.price}</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>
              <Button
                size="sm"
                className="w-full mt-4"
                variant={isCurrent ? "outline" : "default"}
                disabled={disabled}
                onClick={() => mutate.mutate(p)}
              >
                {isCurrent ? "Current plan" : isUpgrade ? "Upgrade" : "Downgrade"}
              </Button>
              <ul className="mt-5 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Plan changes apply immediately. Payment processing isn't connected yet — switching plans is free during preview.
      </p>
    </>
  );
}

function UsageCard({ label, value, limit, loading }: { label: string; value: number; limit: number; loading?: boolean }) {
  const unlimited = limit < 0;
  const pct = unlimited ? 0 : limit === 0 ? 100 : Math.min(100, Math.round((value / limit) * 100));
  const over = !unlimited && value >= limit;
  return (
    <div className="nova-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight">{loading ? "—" : value.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground">/ {formatLimit(limit)}</span>
      </div>
      {!unlimited && (
        <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full transition-all ${over ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
