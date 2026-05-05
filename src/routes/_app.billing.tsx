import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { Button } from "@/components/ui/button";
import { PLANS, PLAN_ORDER, planRank } from "@/lib/plan";
import { useWorkspace } from "@/hooks/use-workspace";
import { Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/billing")({
  component: BillingPage,
});

function BillingPage() {
  const { workspace } = useWorkspace();
  const current = PLANS[workspace.plan];

  return (
    <>
      <PageHeader eyebrow="Billing" title="Plan, usage, and invoices." />

      {/* Current plan */}
      <div className="nova-card p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Current plan</p>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">{current.name}</h2>
            <StatusPill tone="primary">${current.price}/mo</StatusPill>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{current.tagline}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Manage subscription</Button>
          {/* TODO: open Stripe customer portal */}
        </div>
      </div>

      {/* Usage */}
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        <UsageCard label="Tool runs" value="12" limit={current.id === "scale" ? "∞" : "200"} />
        <UsageCard label="Active systems" value="0" limit={String(current.systemLimit)} />
        <UsageCard label="Integrations" value="2" limit="—" />
      </div>

      <SectionHeader title="Plans" description="Upgrade or downgrade anytime." />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLAN_ORDER.map((p) => {
          const plan = PLANS[p];
          const isCurrent = p === workspace.plan;
          const isUpgrade = planRank(p) > planRank(workspace.plan);
          return (
            <div key={p} className={`nova-card p-5 flex flex-col ${isCurrent ? "border-primary/50" : ""}`}>
              {p === "operate" && (
                <div className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary text-[10px] font-medium px-2 py-0.5 mb-3 self-start">
                  <Sparkles className="h-3 w-3" /> Most popular
                </div>
              )}
              <h3 className="text-sm font-semibold">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight">${plan.price}</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              <Button size="sm" className="w-full mt-4" variant={isCurrent ? "outline" : "default"} disabled={isCurrent}>
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

      <div className="mt-8">
        <SectionHeader title="Invoice history" />
        <div className="nova-card p-8 text-center text-sm text-muted-foreground">
          No invoices yet. Connected Stripe customer portal will list invoices here.
          {/* TODO: pull invoices from Stripe via n8n */}
        </div>
      </div>
    </>
  );
}

function UsageCard({ label, value, limit }: { label: string; value: string; limit: string }) {
  return (
    <div className="nova-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        <span className="text-xs text-muted-foreground">/ {limit}</span>
      </div>
    </div>
  );
}
