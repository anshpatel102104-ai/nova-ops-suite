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
      <div className="hidden md:block w-[248px] shrink-0">
        <div className="fixed inset-y-0 left-0 w-[248px]">
          <AppSidebar />
        </div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <AppTopbar />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1400px] w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
