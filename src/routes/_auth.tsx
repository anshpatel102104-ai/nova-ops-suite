import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:block relative border-r border-border overflow-hidden">
        <div className="absolute inset-0 nova-grid-bg opacity-50" />
        <div className="absolute inset-x-0 top-0 h-[400px] bg-[radial-gradient(ellipse_at_top,oklch(0.82_0.14_200/0.18),transparent_60%)]" />
        <div className="relative h-full flex flex-col justify-between p-10">
          <Logo />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-primary mb-3">Nova OPS</p>
            <h2 className="text-3xl font-semibold tracking-tight leading-tight">
              Activate your business<br />in under 60 minutes.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-md">
              Join founders shipping faster with LaunchPad tools and Nova OS automation.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Nova OPS</p>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="px-6 py-5 flex items-center justify-between">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <Logo className="lg:hidden" />
          <span />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            {/* nested route */}
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

import { Outlet } from "@tanstack/react-router";
