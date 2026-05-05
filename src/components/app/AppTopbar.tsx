import { useState } from "react";
import { Search, Bell, ChevronDown, Menu, LogOut, User, Building2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppSidebar } from "./AppSidebar";
import { useWorkspace } from "@/hooks/use-workspace";
import { PLANS } from "@/lib/plan";
import { Link, useNavigate } from "@tanstack/react-router";

export function AppTopbar() {
  const { workspace } = useWorkspace();
  const plan = PLANS[workspace.plan];
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-12 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-full items-center gap-2 px-3 md:px-4">
        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 bg-sidebar border-sidebar-border">
            <AppSidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Workspace switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2.5">
              <div className="h-6 w-6 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
                <Building2 className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium hidden sm:inline">{workspace.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuItem>{workspace.name}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>+ New workspace</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search */}
        <div className="ml-2 hidden md:flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools, systems, assets…"
              className="pl-8 h-9 bg-surface border-border"
              onFocus={(e) => e.currentTarget.blur()}
              readOnly
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="flex-1 md:hidden" />

        {/* Plan badge */}
        <div className="hidden md:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 mr-1">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)] nova-live-dot" /> OPS</span>
          <span className="opacity-40">·</span>
          <span>{new Date().toUTCString().slice(17, 22)} UTC</span>
        </div>

        <Link
          to="/app/billing"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-sm border border-primary/30 bg-primary/5 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-primary hover:bg-primary/10 transition-colors"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary nova-live-dot" />
          {plan.name}
        </Link>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Bell className="h-4 w-4" />
        </Button>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-9 w-9 rounded-full bg-surface-elevated border border-border grid place-items-center text-xs font-semibold hover:border-primary/40">
              {workspace.user.name.charAt(0)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{workspace.user.name}</span>
                <span className="text-xs text-muted-foreground">{workspace.user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/app/settings" })}>
              <User className="h-4 w-4 mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/app/billing" })}>
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/" })}>
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
