import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { Button } from "@/components/ui/button";
import {
  Database, Mail, CreditCard, Table2, Workflow, Webhook, Code2, Brain, Sparkles,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/integrations")({
  component: IntegrationsPage,
});

const PROVIDERS = [
  {
    id: "anthropic", name: "Anthropic", subtitle: "Claude family",
    desc: "Reasoning-heavy strategy, long-form analysis, mentor responses.",
    icon: Brain, connected: true, models: ["claude-opus-4.1", "claude-sonnet-4.5", "claude-haiku-4.5"],
    health: "operational", latency: "180ms",
  },
  {
    id: "openai", name: "OpenAI", subtitle: "GPT family",
    desc: "Fast generation, structured output, multimodal tool calls.",
    icon: Sparkles, connected: true, models: ["gpt-5", "gpt-5-mini", "gpt-5-nano"],
    health: "operational", latency: "140ms",
  },
];

const INTEGRATIONS = [
  { id: "supabase",  name: "Supabase",         icon: Database,    desc: "Database, auth, and storage for your workspace.", connected: true,  notes: "Used for user data, workspaces, runs, assets." },
  { id: "google",    name: "Google Workspace", icon: Mail,        desc: "Sync calendar and send emails on your behalf.",   connected: false, notes: "Required for Appointment Booking System." },
  { id: "stripe",    name: "Stripe",           icon: CreditCard,  desc: "Billing, subscriptions, and customer payments.",  connected: false, notes: "Powers plan upgrades and invoices." },
  { id: "airtable",  name: "Airtable",         icon: Table2,      desc: "Read and write to your Airtable bases.",          connected: false, notes: "Optional CRM source for Nova OS." },
  { id: "n8n",       name: "n8n",              icon: Workflow,    desc: "Run automation workflows behind every system.",   connected: true,  notes: "Internal — required for all Nova OS systems." },
  { id: "webhook",   name: "Webhook",          icon: Webhook,     desc: "Receive events from any external service.",       connected: false, notes: "Custom endpoint configurable per workspace." },
  { id: "api",       name: "Custom API",       icon: Code2,       desc: "Connect to any REST API with bearer auth.",       connected: false, notes: "Pro plan and above." },
];

function IntegrationsPage() {
  const [defaultProvider, setDefaultProvider] = useState("anthropic");
  const [fallback, setFallback] = useState("openai");

  return (
    <>
      <PageHeader
        eyebrow="Integrations"
        title="Plug Launchpad Nova into your stack."
        description="Connect AI providers, data sources, and automation services."
      />

      {/* AI Providers — multi-provider routing */}
      <div className="mb-8">
        <SectionHeader
          title="AI Providers · Multi-Provider Routing"
          description="Choose a default model. Set a fallback if it fails."
          actions={<StatusPill tone="success">Routing active</StatusPill>}
        />
        <div className="grid sm:grid-cols-2 gap-4 mb-3">
          {PROVIDERS.map((p) => {
            const isDefault = defaultProvider === p.id;
            const isFallback = fallback === p.id;
            return (
              <div key={p.id} className={cn(
                "nova-card p-5 relative overflow-hidden",
                isDefault && "ring-1 ring-primary/40 nova-glow",
              )}>
                {isDefault && <div className="absolute inset-x-0 top-0 h-0.5 nova-orange-bar" />}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-gradient-to-br from-[color:var(--ember)] to-[color:var(--primary)] grid place-items-center text-white">
                      <p.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{p.name}</h3>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{p.subtitle}</p>
                    </div>
                  </div>
                  <StatusPill tone={p.connected ? "success" : "muted"}>
                    {p.connected ? "Connected" : "Add key"}
                  </StatusPill>
                </div>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.models.map((m) => (
                    <span key={m} className="font-mono text-[10px] rounded-sm border border-border bg-surface-elevated px-1.5 py-0.5 text-foreground/80">
                      {m}
                    </span>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-md border border-border bg-surface-elevated px-2 py-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Health</p>
                    <p className="text-[color:var(--success)] mt-0.5 font-medium capitalize">{p.health}</p>
                  </div>
                  <div className="rounded-md border border-border bg-surface-elevated px-2 py-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Latency</p>
                    <p className="text-foreground mt-0.5 font-medium tabular-nums">{p.latency}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={isDefault ? "default" : "outline"}
                    onClick={() => setDefaultProvider(p.id)}
                  >
                    {isDefault ? "Default" : "Set as default"}
                  </Button>
                  <Button
                    size="sm"
                    variant={isFallback ? "secondary" : "ghost"}
                    onClick={() => setFallback(p.id)}
                    disabled={isDefault}
                  >
                    {isFallback ? "Fallback" : "Use as fallback"}
                  </Button>
                  <Button size="sm" variant="ghost">Manage key</Button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          // requests route to <span className="text-primary">{defaultProvider}</span> → fallback to <span className="text-primary">{fallback}</span>
        </p>
      </div>

      <SectionHeader title="Services & Data Sources" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {INTEGRATIONS.map((it) => (
          <div key={it.id} className="nova-card p-5 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div className="h-9 w-9 rounded-md border border-border bg-surface-elevated grid place-items-center">
                <it.icon className="h-4 w-4 text-primary" />
              </div>
              <StatusPill tone={it.connected ? "success" : "muted"}>
                {it.connected ? "Connected" : "Not connected"}
              </StatusPill>
            </div>
            <h3 className="text-sm font-semibold">{it.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground flex-1">{it.desc}</p>
            <p className="mt-3 text-[11px] text-muted-foreground border-t border-border pt-3">{it.notes}</p>
            <Button size="sm" variant={it.connected ? "outline" : "default"} className="mt-4 w-fit">
              {it.connected ? "Manage" : "Connect"}
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
