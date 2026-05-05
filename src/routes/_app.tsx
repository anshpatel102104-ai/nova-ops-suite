import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppTopbar } from "@/components/app/AppTopbar";

export const Route = createFileRoute("/_app")({
  component: AppShell,
  // TODO: add beforeLoad auth guard once Supabase is enabled
});

function AppShell() {
  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden md:block w-[224px] shrink-0">
        <div className="fixed inset-y-0 left-0 w-[224px]">
          <AppSidebar />
        </div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <AppTopbar />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 w-full">
          <Outlet />
        </main>
        <footer className="border-t border-border px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)] nova-live-dot" /> SYS · ONLINE</span>
            <span className="hidden sm:inline">v1.0.0</span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span>LAT 24ms</span>
            <span>REGION · IAD</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
