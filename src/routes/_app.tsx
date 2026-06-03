import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppTopbar } from "@/components/app/AppTopbar";
import { WorkspaceProvider } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
  },
  component: AppShell,
});

function Shell({ children }: { children: React.ReactNode }) {
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
          {children}
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

function LoadingFallback() {
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        Initializing mission control…
      </div>
    </div>
  );
}

function AppShell() {
  return (
    <WorkspaceProvider fallback={<LoadingFallback />}>
      <Shell>
        <Outlet />
      </Shell>
    </WorkspaceProvider>
  );
}
