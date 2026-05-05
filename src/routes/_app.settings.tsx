import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useWorkspace } from "@/hooks/use-workspace";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

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
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API & webhooks</TabsTrigger>
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
          <Section title="Team & workspace">
            <p className="text-sm text-muted-foreground">Invite teammates to collaborate in your workspace.</p>
            <div className="flex gap-2 mt-3">
              <Input placeholder="teammate@company.com" />
              <Button>Send invite</Button>
            </div>
            {/* TODO: list members from Supabase workspace_members */}
          </Section>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Section title="Notifications">
            <Toggle label="Tool run completions" defaultChecked />
            <Toggle label="System events" defaultChecked />
            <Toggle label="Billing alerts" defaultChecked />
            <Toggle label="Weekly digest" />
          </Section>
        </TabsContent>

        <TabsContent value="api" className="mt-4">
          <Section title="API & webhooks">
            <Field label="API key">
              <div className="flex gap-2">
                <Input readOnly value="nova_pk_••••••••••••" />
                <Button variant="outline">Rotate</Button>
              </div>
            </Field>
            <Field label="Webhook URL"><Input placeholder="https://your-server.com/webhook" /></Field>
            <SaveBar />
            {/* TODO: persist API keys + webhooks in Supabase */}
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
