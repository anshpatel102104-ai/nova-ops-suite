import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Rocket, Cpu, FolderOpen, Activity,
  Plug, CreditCard, Settings, Shield, Sparkles, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { useWorkspace } from "@/hooks/use-workspace";
import { PLANS } from "@/lib/plan";

const NAV = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/launchpad", label: "LaunchPad", icon: Rocket },
  { to: "/app/nova-os", label: "Nova OS", icon: Cpu },
  { to: "/app/assets", label: "My Assets", icon: FolderOpen },
  { to: "/app/activity", label: "Activity", icon: Activity },
  { to: "/app/integrations", label: "Integrations", icon: Plug },
] as const;

const SECONDARY = [
  { to: "/app/billing", label: "Billing", icon: CreditCard },
  { to: "/app/settings", label: "Settings", icon: Settings },
  { to: "/app/admin", label: "Admin", icon: Shield },
] as const;

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { workspace } = useWorkspace();
  const plan = PLANS[workspace.plan];

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-4 h-12 flex items-center border-b border-sidebar-border">
        <Logo />
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-4">
        <p className="px-2 mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">// Workspace</p>
        <ul className="space-y-px mb-5">
          {NAV.map((item) => {
            const active = path.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-[13px] transition-colors",
                    active
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary" />}
                  <item.icon className={cn("h-3.5 w-3.5", active && "text-primary")} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="px-2 mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">// Account</p>
        <ul className="space-y-px">
          {SECONDARY.map((item) => {
            const active = path.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-[13px] transition-colors",
                    active
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary" />}
                  <item.icon className={cn("h-3.5 w-3.5", active && "text-primary")} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-2.5 border-t border-sidebar-border">
        <Link
          to="/app/billing"
          onClick={onNavigate}
          className="block rounded-sm border border-sidebar-border bg-sidebar-accent/30 p-2.5 hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] font-medium">{plan.name} · TIER</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {plan.price === 0 ? "Upgrade to unlock all systems" : "Manage subscription"}
          </p>
        </Link>
      </div>
    </aside>
  );
}
