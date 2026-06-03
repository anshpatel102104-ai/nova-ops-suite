import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  ArrowRight, Bot, Cpu, Loader2, MessageSquarePlus, Plus, Save, Send, Sparkles, Trash2, Workflow,
} from "lucide-react";
import {
  createSession, deleteSession, getSession, listSessions, logAction,
  saveResponseAsAsset, sendMessage,
} from "@/lib/operator.functions";
import { cn } from "@/lib/utils";
import { LAUNCHPAD_TOOLS } from "@/lib/catalog";

export const Route = createFileRoute("/_app/nova-os")({
  component: NovaOperatorPage,
});

type SessionRow = { id: string; title: string; updated_at: string; created_at: string };
type MessageRow = {
  id: string; role: "user" | "assistant" | "system"; content: string;
  specialist: string | null; provider: string | null; model: string | null;
  status: string; error: string | null; duration_ms: number | null; created_at: string;
};
type RecRow = {
  id: string; message_id: string; label: string; description: string | null;
  action_kind: string; target: string | null; payload: Record<string, unknown>;
  acted_at: string | null; dismissed_at: string | null;
};

const SPECIALISTS = [
  { key: "general",    label: "Nova" },
  { key: "validation", label: "Validation" },
  { key: "strategy",   label: "Strategy" },
  { key: "offer",      label: "Offer" },
  { key: "gtm",        label: "GTM" },
  { key: "copy",       label: "Copy" },
  { key: "outreach",   label: "Outreach" },
  { key: "automation", label: "Automation" },
  { key: "knowledge",  label: "Knowledge" },
] as const;

function NovaOperatorPage() {
  const { workspace } = useWorkspace();
  const list = useServerFn(listSessions);
  const create = useServerFn(createSession);
  const remove = useServerFn(deleteSession);
  const load = useServerFn(getSession);
  const send = useServerFn(sendMessage);
  const log = useServerFn(logAction);
  const save = useServerFn(saveResponseAsAsset);

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [recs, setRecs] = useState<RecRow[]>([]);
  const [input, setInput] = useState("");
  const [routeHint, setRouteHint] = useState<(typeof SPECIALISTS)[number]["key"]>("general");
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const refreshSessions = useCallback(async () => {
    const { sessions } = await list({ data: { workspaceId: workspace.id } });
    setSessions(sessions as SessionRow[]);
    return sessions as SessionRow[];
  }, [list, workspace.id]);

  const openSession = useCallback(async (id: string) => {
    setActiveId(id);
    const { messages, recommendations } = await load({
      data: { workspaceId: workspace.id, sessionId: id },
    });
    setMessages(messages as MessageRow[]);
    setRecs(recommendations as RecRow[]);
  }, [load, workspace.id]);

  const newSession = useCallback(async () => {
    const { session } = await create({ data: { workspaceId: workspace.id } });
    await refreshSessions();
    setMessages([]); setRecs([]);
    setActiveId(session.id);
  }, [create, refreshSessions, workspace.id]);

  useEffect(() => {
    (async () => {
      const rows = await refreshSessions();
      if (rows.length) await openSession(rows[0].id);
      else await newSession();
    })().catch((e) => toast.error((e as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending]);

  const submit = async () => {
    if (!activeId || !input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    // Optimistic user bubble
    const optimistic: MessageRow = {
      id: `tmp-${Date.now()}`, role: "user", content: text, specialist: routeHint,
      provider: null, model: null, status: "completed", error: null, duration_ms: null,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    try {
      await send({
        data: {
          workspaceId: workspace.id, sessionId: activeId, input: text,
          routeHint: routeHint === "general" ? undefined : routeHint,
        },
      });
      await openSession(activeId);
      await refreshSessions();
    } catch (e) {
      toast.error((e as Error).message);
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const onRec = async (r: RecRow) => {
    await log({
      data: {
        workspaceId: workspace.id, sessionId: activeId ?? undefined,
        recommendationId: r.id, actionKind: r.action_kind, target: r.target ?? undefined,
        payload: r.payload,
      },
    }).catch(() => null);
    if (r.action_kind === "run_tool" && r.target) {
      window.location.href = `/app/launchpad/${r.target}`;
    } else if (r.action_kind === "open_workflow") {
      window.location.href = "/app/workflows";
    } else if (r.action_kind === "plan_automation") {
      window.location.href = "/app/launchpad/automation-planner";
    } else if (r.action_kind === "save_asset" || r.action_kind === "update_kb") {
      const last = [...messages].reverse().find((m) => m.role === "assistant" && m.status === "completed");
      if (!last) { toast.error("No response to save yet."); return; }
      const name = window.prompt("Asset name", last.content.slice(0, 60));
      if (!name) return;
      try {
        await save({ data: { workspaceId: workspace.id, messageId: last.id, name } });
        toast.success("Saved to Assets");
      } catch (e) { toast.error((e as Error).message); }
    }
  };

  const removeSession = async (id: string) => {
    if (!confirm("Delete this session?")) return;
    try {
      await remove({ data: { workspaceId: workspace.id, sessionId: id } });
      const rows = await refreshSessions();
      if (rows.length) await openSession(rows[0].id);
      else { setMessages([]); setRecs([]); setActiveId(null); }
    } catch (e) { toast.error((e as Error).message); }
  };

  const lastAssistant = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant" && m.status === "completed"),
    [messages],
  );
  const activeRecs = useMemo(
    () => recs.filter((r) => lastAssistant && r.message_id === lastAssistant.id && !r.acted_at && !r.dismissed_at),
    [recs, lastAssistant],
  );

  return (
    <>
      <PageHeader
        eyebrow="Nova AI Operator · Mission Control"
        title="Your AI chief of staff."
        description="One operator. Many specialists. Route work, draft outputs, ship the next move."
        actions={
          <Button size="sm" onClick={newSession}>
            <MessageSquarePlus className="h-4 w-4 mr-1.5" /> New session
          </Button>
        }
      />

      <div className="grid lg:grid-cols-[260px_1fr_300px] gap-4">
        {/* Sessions */}
        <aside className="space-y-3">
          <div className="nova-card p-3">
            <SectionHeader title="Sessions" />
            <ul className="space-y-1">
              {sessions.length === 0 && (
                <li className="text-xs text-muted-foreground px-2 py-3">No sessions yet.</li>
              )}
              {sessions.map((s) => (
                <li key={s.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => openSession(s.id)}
                    className={cn(
                      "flex-1 text-left px-2 py-1.5 rounded-sm text-[13px] truncate transition-colors",
                      activeId === s.id
                        ? "bg-sidebar-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50",
                    )}
                  >
                    {s.title || "Untitled"}
                  </button>
                  <button
                    onClick={() => removeSession(s.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="nova-card p-3">
            <SectionHeader title="Quick actions" />
            <div className="grid grid-cols-2 gap-1.5">
              <Link to="/app/launchpad" className="text-[11px] rounded-sm border border-border bg-surface-elevated px-2 py-1.5 hover:border-primary/40 transition-colors text-center">
                Launchpad
              </Link>
              <Link to="/app/workflows" className="text-[11px] rounded-sm border border-border bg-surface-elevated px-2 py-1.5 hover:border-primary/40 transition-colors text-center">
                Workflows
              </Link>
              <Link to="/app/assets" className="text-[11px] rounded-sm border border-border bg-surface-elevated px-2 py-1.5 hover:border-primary/40 transition-colors text-center">
                Assets
              </Link>
              <Link to="/app/agents" className="text-[11px] rounded-sm border border-border bg-surface-elevated px-2 py-1.5 hover:border-primary/40 transition-colors text-center">
                Agents
              </Link>
            </div>
          </div>
        </aside>

        {/* Chat panel */}
        <section className="nova-card flex flex-col h-[calc(100vh-220px)] min-h-[520px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-elevated/50">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--ignition)] grid place-items-center text-white nova-glow-ignite">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-[13px] font-semibold leading-tight">Nova Operator</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {sending ? "Reasoning…" : "Standby"}
                </p>
              </div>
            </div>
            <StatusPill tone={sending ? "warning" : "success"}>
              {sending ? "Active" : "Ready"}
            </StatusPill>
          </div>

          <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !sending && (
              <div className="h-full grid place-items-center text-center">
                <div className="max-w-md">
                  <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--ignition)] grid place-items-center text-white nova-glow-ignite mb-3">
                    <Bot className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-semibold">How can I move the business forward?</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ask anything. I'll route to the right specialist, pull workspace context, and recommend the next move.
                  </p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      "Validate this idea: AI bookkeeper for solo founders",
                      "Draft a GTM plan for our beta launch",
                      "Write a 3-step cold email sequence for agencies",
                      "Plan an automation: form → AI qualify → CRM",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="text-left text-xs rounded-sm border border-border bg-surface-elevated px-2.5 py-2 hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((m) => (
              <MessageBubble key={m.id} m={m} />
            ))}
            {sending && <ThinkingBubble />}
          </div>

          {/* Composer */}
          <div className="border-t border-border p-3 bg-surface-elevated/40">
            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto">
              {SPECIALISTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setRouteHint(s.key)}
                  className={cn(
                    "text-[10px] uppercase tracking-[0.14em] font-mono px-2 py-1 rounded-sm border transition-colors whitespace-nowrap",
                    routeHint === s.key
                      ? "border-primary text-primary bg-primary/5"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                }}
                placeholder="Tell Nova what you need. ⌘+Enter to send."
                rows={2}
                className="resize-none"
              />
              <Button onClick={submit} disabled={sending || !input.trim() || !activeId}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </section>

        {/* Context + recommendations */}
        <aside className="space-y-3">
          <div className="nova-card p-4">
            <SectionHeader title="Workspace" />
            <p className="text-sm font-semibold">{workspace.name}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-0.5">
              {workspace.plan} · tier
            </p>
          </div>

          <div className="nova-card p-4">
            <SectionHeader title="Recommended next move" />
            {activeRecs.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Send a message — Nova will surface concrete next actions here.
              </p>
            ) : (
              <ul className="space-y-2">
                {activeRecs.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => onRec(r)}
                      className="w-full text-left rounded-md border border-border bg-surface-elevated px-3 py-2 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-medium">{r.label}</p>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                      </div>
                      {r.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{r.description}</p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {lastAssistant && (
            <div className="nova-card p-4">
              <SectionHeader title="Output actions" />
              <div className="space-y-1.5">
                <Button
                  size="sm" variant="outline" className="w-full justify-start"
                  onClick={() => onRec({
                    id: "save", message_id: lastAssistant.id, label: "Save", description: null,
                    action_kind: "save_asset", target: null, payload: {}, acted_at: null, dismissed_at: null,
                  })}
                >
                  <Save className="h-3.5 w-3.5 mr-2" /> Save as asset
                </Button>
                <Button asChild size="sm" variant="outline" className="w-full justify-start">
                  <Link to="/app/workflows"><Workflow className="h-3.5 w-3.5 mr-2" /> Send to workflow</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="w-full justify-start">
                  <Link to="/app/launchpad/automation-planner"><Cpu className="h-3.5 w-3.5 mr-2" /> Plan automation</Link>
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function MessageBubble({ m }: { m: MessageRow }) {
  const isUser = m.role === "user";
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-7 w-7 shrink-0 rounded-md bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--ignition)] grid place-items-center text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      )}
      <div className={cn(
        "max-w-[78%] rounded-md px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
        isUser
          ? "bg-primary text-primary-foreground"
          : m.status === "failed"
            ? "bg-destructive/10 border border-destructive/40 text-foreground"
            : "bg-surface-elevated border border-border text-foreground",
      )}>
        {m.status === "failed" ? (m.error ?? "Something went wrong.") : (m.content || "…")}
        {!isUser && m.specialist && m.status === "completed" && (
          <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-1 w-1 rounded-full bg-primary" />
            {m.specialist} · {m.provider ?? "—"} · {m.model ?? "—"}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex gap-3">
      <div className="h-7 w-7 shrink-0 rounded-md bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--ignition)] grid place-items-center text-white nova-glow-ignite">
        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
      </div>
      <div className="rounded-md px-3.5 py-2.5 bg-surface-elevated border border-border text-sm text-muted-foreground inline-flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Routing through specialists…
      </div>
    </div>
  );
}
