import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { AlertTriangle, TrendingUp, Users } from "lucide-react";

export const Route = createFileRoute("/_app/admin")({
  component: AdminPage,
  // TODO: restrict access via Supabase user_roles (admin role check in beforeLoad)
});

const USERS = [
  { name: "Alex Founder", email: "alex@acme.co", plan: "Launch", state: "Active",   activated: true,  runs: 12 },
  { name: "Sam Operator", email: "sam@launch.io", plan: "Operate", state: "Active", activated: true,  runs: 84 },
  { name: "Jane Trial",   email: "jane@new.co",   plan: "Starter", state: "Trial",  activated: false, runs: 1 },
];

function AdminPage() {
  return (
    <>
      <PageHeader eyebrow="Admin" title="Operator view" description="Internal scaffold for Nova OPS operators." />

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <Stat label="Total users" value="184" icon={Users} />
        <Stat label="Active subscribers" value="62" icon={TrendingUp} />
        <Stat label="Open alerts" value="3" icon={AlertTriangle} tone="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 nova-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <SectionHeader title="Users" description="Recent signups and activation state." />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground bg-surface-elevated/40">
                <tr>
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Plan</th>
                  <th className="text-left p-3 font-medium">State</th>
                  <th className="text-left p-3 font-medium">Activated</th>
                  <th className="text-left p-3 font-medium">Runs</th>
                </tr>
              </thead>
              <tbody>
                {USERS.map((u) => (
                  <tr key={u.email} className="border-t border-border">
                    <td className="p-3">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="p-3">{u.plan}</td>
                    <td className="p-3"><StatusPill tone={u.state === "Active" ? "success" : "warning"}>{u.state}</StatusPill></td>
                    <td className="p-3">{u.activated ? "Yes" : "No"}</td>
                    <td className="p-3 tabular-nums">{u.runs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="nova-card p-5">
            <SectionHeader title="Alerts" />
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-[color:var(--warning)] shrink-0 mt-0.5" /> 2 workspaces at usage limit</li>
              <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-[color:var(--warning)] shrink-0 mt-0.5" /> 1 failed n8n run in last hour</li>
            </ul>
          </div>
          <div className="nova-card p-5">
            <SectionHeader title="Support notes" />
            <p className="text-sm text-muted-foreground">Internal notes attached to users will appear here.</p>
            {/* TODO: link to Supabase support_notes */}
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, icon: Icon, tone = "default" }: {
  label: string; value: string; icon: React.ComponentType<{ className?: string }>; tone?: "default"|"warning"
}) {
  return (
    <div className="nova-card p-4 flex items-center justify-between">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      </div>
      <div className={`h-9 w-9 rounded-md border border-border grid place-items-center ${
        tone === "warning" ? "text-[color:var(--warning)]" : "text-primary"
      }`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}
