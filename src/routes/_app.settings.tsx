import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  listProviderKeys,
  setProviderKey,
  deleteProviderKey,
  setWorkspaceDefaults,
  testProviderKey,
} from "@/lib/provider-keys.functions";
import {
  listMembers,
  listInvitations,
  inviteMember,
  revokeInvitation,
  updateMemberRole,
  removeMember,
} from "@/lib/team.functions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Mail, ShieldCheck, UserMinus } from "lucide-react";


export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

type Provider = "anthropic" | "openai";

function SettingsPage() {
  const { workspace } = useWorkspace();
  return (
    <>
      <PageHeader eyebrow="Settings" title="Manage your workspace." />

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="ai">AI providers</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Section title="Your profile">
            <Field label="Full name"><Input defaultValue={workspace.user.name} /></Field>
            <Field label="Email"><Input defaultValue={workspace.user.email} /></Field>
            <SaveBar />
          </Section>
        </TabsContent>

        <TabsContent value="company" className="mt-4">
          <Section title="Company">
            <Field label="Company name"><Input defaultValue={workspace.name} /></Field>
            <Field label="Website"><Input placeholder="https://" /></Field>
            <SaveBar />
          </Section>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <TeamTab workspaceId={workspace.id} />
        </TabsContent>


        <TabsContent value="ai" className="mt-4">
          <AIProvidersTab workspaceId={workspace.id} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Section title="Notifications">
            <Toggle label="Tool run completions" defaultChecked />
            <Toggle label="System events" defaultChecked />
            <Toggle label="Billing alerts" defaultChecked />
            <Toggle label="Weekly digest" />
          </Section>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Section title="Security">
            <Toggle label="Two-factor authentication" />
            <Toggle label="Email me on new sign-ins" defaultChecked />
            <Button variant="outline" className="mt-2 w-fit">Change password</Button>
          </Section>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <Section title="Preferences">
            <Toggle label="Compact density" />
            <Toggle label="Reduce motion" />
          </Section>
        </TabsContent>
      </Tabs>
    </>
  );
}

const DEFAULT_MODELS: Record<Provider, string[]> = {
  anthropic: ["claude-sonnet-4-5-20250929", "claude-opus-4-1-20250805", "claude-3-5-haiku-20241022"],
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"],
};

function AIProvidersTab({ workspaceId }: { workspaceId: string }) {
  const list = useServerFn(listProviderKeys);
  const setKey = useServerFn(setProviderKey);
  const delKey = useServerFn(deleteProviderKey);
  const setDefaults = useServerFn(setWorkspaceDefaults);
  const test = useServerFn(testProviderKey);

  const [keys, setKeys] = useState<{ provider: Provider; key_hint: string }[]>([]);
  const [defaultProvider, setDefaultProvider] = useState<Provider | "">("");
  const [defaultModel, setDefaultModel] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { keys } = await list({ data: { workspaceId } });
    setKeys(keys as { provider: Provider; key_hint: string }[]);
    setLoading(false);
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [workspaceId]);

  const saveDefaults = async () => {
    try {
      await setDefaults({
        data: {
          workspaceId,
          provider: (defaultProvider || null) as Provider | null,
          model: defaultModel || null,
        },
      });
      toast.success("Defaults saved.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <Section title="Provider API keys (BYO)">
        <p className="text-sm text-muted-foreground -mt-1">
          Keys are encrypted in our vault. We only show the last 4 characters.
        </p>
        <ProviderRow
          provider="anthropic"
          label="Anthropic"
          placeholder="sk-ant-…"
          docs="https://console.anthropic.com/settings/keys"
          existing={keys.find((k) => k.provider === "anthropic")?.key_hint}
          onSave={async (apiKey) => { await setKey({ data: { workspaceId, provider: "anthropic", apiKey } }); await refresh(); toast.success("Anthropic key saved."); }}
          onDelete={async () => { await delKey({ data: { workspaceId, provider: "anthropic" } }); await refresh(); toast.success("Anthropic key removed."); }}
          onTest={async () => { const r = await test({ data: { workspaceId, provider: "anthropic" } }); r.ok ? toast.success("Anthropic key works.") : toast.error(`Failed: ${r.status ?? r.error}`); }}
          loading={loading}
        />
        <ProviderRow
          provider="openai"
          label="OpenAI"
          placeholder="sk-…"
          docs="https://platform.openai.com/api-keys"
          existing={keys.find((k) => k.provider === "openai")?.key_hint}
          onSave={async (apiKey) => { await setKey({ data: { workspaceId, provider: "openai", apiKey } }); await refresh(); toast.success("OpenAI key saved."); }}
          onDelete={async () => { await delKey({ data: { workspaceId, provider: "openai" } }); await refresh(); toast.success("OpenAI key removed."); }}
          onTest={async () => { const r = await test({ data: { workspaceId, provider: "openai" } }); r.ok ? toast.success("OpenAI key works.") : toast.error(`Failed: ${r.status ?? r.error}`); }}
          loading={loading}
        />
      </Section>

      <Section title="Workspace defaults">
        <p className="text-sm text-muted-foreground -mt-1">
          Used when an agent doesn't specify its own provider/model.
        </p>
        <Field label="Default provider">
          <Select value={defaultProvider} onValueChange={(v) => { setDefaultProvider(v as Provider); setDefaultModel(""); }}>
            <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Default model">
          <Select value={defaultModel} onValueChange={setDefaultModel} disabled={!defaultProvider}>
            <SelectTrigger><SelectValue placeholder={defaultProvider ? "Select model" : "Pick a provider first"} /></SelectTrigger>
            <SelectContent>
              {(defaultProvider ? DEFAULT_MODELS[defaultProvider] : []).map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="flex justify-end pt-2">
          <Button size="sm" onClick={saveDefaults}>Save defaults</Button>
        </div>
      </Section>
    </div>
  );
}

function ProviderRow({
  label, placeholder, docs, existing, onSave, onDelete, onTest, loading,
}: {
  provider: Provider;
  label: string;
  placeholder: string;
  docs: string;
  existing?: string;
  onSave: (apiKey: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onTest: () => Promise<void>;
  loading: boolean;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const wrap = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="border border-border rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        {loading ? (
          <span className="text-xs text-muted-foreground">…</span>
        ) : existing ? (
          <span className="font-mono text-xs text-muted-foreground">•••• {existing}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Not configured</span>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          type="password"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={busy}
        />
        <Button size="sm" disabled={busy || value.length < 20} onClick={() => wrap(async () => { await onSave(value); setValue(""); })}>
          {existing ? "Replace" : "Save"}
        </Button>
        {existing && (
          <>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => wrap(onTest)}>Test</Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => wrap(onDelete)}>Remove</Button>
          </>
        )}
      </div>
      <a href={docs} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary">
        Get a {label} key →
      </a>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="nova-card p-5 max-w-2xl">
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm">{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
function SaveBar() {
  return (
    <div className="flex justify-end pt-2">
      <Button size="sm">Save changes</Button>
    </div>
  );
}

type WorkspaceRole = "owner" | "admin" | "member";
type Member = {
  user_id: string;
  role: WorkspaceRole;
  full_name: string | null;
  avatar_url: string | null;
  is_owner: boolean;
  joined_at: string;
};
type Invitation = {
  id: string;
  email: string;
  role: WorkspaceRole;
  status: "pending" | "accepted" | "revoked" | "expired";
  token: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
};

function TeamTab({ workspaceId }: { workspaceId: string }) {
  const fetchMembers = useServerFn(listMembers);
  const fetchInvites = useServerFn(listInvitations);
  const sendInvite = useServerFn(inviteMember);
  const revoke = useServerFn(revokeInvitation);
  const setRole = useServerFn(updateMemberRole);
  const removeMbr = useServerFn(removeMember);

  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRoleValue] = useState<"admin" | "member">("member");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const [m, i] = await Promise.all([
      fetchMembers({ data: { workspaceId } }),
      fetchInvites({ data: { workspaceId } }),
    ]);
    setMembers(m.members as Member[]);
    setInvites(i.invitations as Invitation[]);
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [workspaceId]);

  const onInvite = async () => {
    if (!email) return;
    setBusy(true);
    try {
      await sendInvite({ data: { workspaceId, email, role } });
      setEmail("");
      toast.success(`Invite sent to ${email}.`);
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/app/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied.");
  };

  const onRevoke = async (id: string) => {
    await revoke({ data: { invitationId: id } });
    toast.success("Invitation revoked.");
    await refresh();
  };

  const onChangeRole = async (userId: string, newRole: "admin" | "member") => {
    await setRole({ data: { workspaceId, userId, role: newRole } });
    toast.success("Role updated.");
    await refresh();
  };

  const onRemove = async (userId: string) => {
    if (!confirm("Remove this teammate from the workspace?")) return;
    await removeMbr({ data: { workspaceId, userId } });
    toast.success("Member removed.");
    await refresh();
  };

  const pending = invites.filter((i) => i.status === "pending");

  return (
    <div className="space-y-4 max-w-3xl">
      <Section title="Invite teammates">
        <p className="text-sm text-muted-foreground -mt-1">
          Members can run tools and view assets. Admins can also manage provider keys and systems.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder="teammate@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
          <Select value={role} onValueChange={(v) => setRoleValue(v as "admin" | "member")}>
            <SelectTrigger className="sm:w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={onInvite} disabled={busy || !email}>
            <Mail className="h-4 w-4 mr-1.5" /> Send invite
          </Button>
        </div>
      </Section>

      <Section title={`Members · ${members.length}`}>
        <ul className="divide-y divide-border">
          {members.map((m) => (
            <li key={m.user_id} className="py-3 flex items-center gap-3">
              <Avatar className="h-9 w-9">
                {m.avatar_url && <AvatarImage src={m.avatar_url} />}
                <AvatarFallback>{(m.full_name ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.full_name ?? "Unnamed"}</p>
                <p className="text-xs text-muted-foreground">Joined {new Date(m.joined_at).toLocaleDateString()}</p>
              </div>
              {m.is_owner ? (
                <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> Owner</Badge>
              ) : (
                <>
                  <Select value={m.role} onValueChange={(v) => onChangeRole(m.user_id, v as "admin" | "member")}>
                    <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" onClick={() => onRemove(m.user_id)}>
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </Section>

      {pending.length > 0 && (
        <Section title={`Pending invitations · ${pending.length}`}>
          <ul className="divide-y divide-border">
            {pending.map((i) => (
              <li key={i.id} className="py-3 flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{i.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.role} · expires {new Date(i.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => copyLink(i.token)}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy link
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onRevoke(i.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

