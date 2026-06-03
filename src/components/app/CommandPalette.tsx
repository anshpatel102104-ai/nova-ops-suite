import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, Rocket, Cpu, FolderOpen, Activity, Plug,
  CreditCard, Settings, Bot, GitBranch, Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/app/dashboard", label: "Mission Control", icon: LayoutDashboard, keywords: "home dashboard" },
  { to: "/app/agents", label: "Agent Network", icon: Bot, keywords: "agents" },
  { to: "/app/launchpad", label: "Founder Academy", icon: Rocket, keywords: "tools launchpad" },
  { to: "/app/workflows", label: "Workflows", icon: GitBranch, keywords: "playbooks workflows" },
  { to: "/app/nova-os", label: "Automation Hub", icon: Cpu, keywords: "automation systems" },
  { to: "/app/assets", label: "Assets", icon: FolderOpen, keywords: "files documents" },
  { to: "/app/activity", label: "Activity", icon: Activity, keywords: "history logs" },
  { to: "/app/integrations", label: "Integrations", icon: Plug, keywords: "integrations" },
] as const;

const ACCOUNT_ITEMS = [
  { to: "/app/billing", label: "Billing & plan", icon: CreditCard, keywords: "billing plan upgrade" },
  { to: "/app/settings", label: "Settings", icon: Settings, keywords: "preferences settings" },
] as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {NAV_ITEMS.map((item) => (
            <CommandItem key={item.to} value={`${item.label} ${item.keywords}`} onSelect={() => go(item.to)}>
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Account">
          {ACCOUNT_ITEMS.map((item) => (
            <CommandItem key={item.to} value={`${item.label} ${item.keywords}`} onSelect={() => go(item.to)}>
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick actions">
          <CommandItem value="new playbook workflow" onSelect={() => go("/app/workflows")}>
            <Sparkles className="h-4 w-4 mr-2" />
            New playbook
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
