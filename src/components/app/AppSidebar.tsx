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
      <div className="px-5 h-14 flex items-center border-b border-sidebar-border">
        <Logo />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-2 mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Workspace</p>
        <ul className="space-y-0.5 mb-6">
          {NAV.map((item) => {
            const active = path.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", active && "text-primary")} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="px-2 mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Account</p>
        <ul className="space-y-0.5">
          {SECONDARY.map((item) => {
            const active = path.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", active && "text-primary")} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Link
          to="/app/billing"
          onClick={onNavigate}
          className="block rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3 hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">{plan.name} plan</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {plan.price === 0 ? "Upgrade to unlock all tools" : "Manage subscription"}
          </p>
        </Link>
      </div>
    </aside>
  );
}
