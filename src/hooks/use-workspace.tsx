import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PlanId } from "@/lib/plan";
import { useAuth } from "./use-auth";

export interface Workspace {
  id: string;
  name: string;
  plan: PlanId;
  user: { name: string; email: string; avatarUrl?: string };
  onboarded: boolean;
}

interface Ctx {
  workspace: Workspace;
  refresh: () => Promise<void>;
  setWorkspace: (w: Workspace) => void;
}

const WorkspaceCtx = createContext<Ctx | null>(null);

export function WorkspaceProvider({
  children,
  fallback,
}: { children: ReactNode; fallback: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) { setWorkspace(null); setLoading(false); return; }
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, onboarded, current_workspace_id")
      .eq("id", user.id)
      .maybeSingle();

    let ws: { id: string; name: string; plan: PlanId } | null = null;
    if (profile?.current_workspace_id) {
      const { data: w } = await supabase
        .from("workspaces").select("id, name, plan")
        .eq("id", profile.current_workspace_id).maybeSingle();
      if (w) ws = { id: w.id, name: w.name, plan: w.plan as PlanId };
    }
    if (!ws) {
      const { data: w } = await supabase
        .from("workspaces").select("id, name, plan").limit(1).maybeSingle();
      if (w) ws = { id: w.id, name: w.name, plan: w.plan as PlanId };
    }
    if (ws) {
      setWorkspace({
        id: ws.id,
        name: ws.name,
        plan: ws.plan,
        user: {
          name: profile?.full_name ?? user.email?.split("@")[0] ?? "Founder",
          email: user.email ?? "",
          avatarUrl: profile?.avatar_url ?? undefined,
        },
        onboarded: profile?.onboarded ?? false,
      });
    }
    setLoading(false);
  };

  useEffect(() => { setLoading(true); load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  if (authLoading || loading || !workspace) return <>{fallback}</>;
  return (
    <WorkspaceCtx.Provider value={{ workspace, refresh: load, setWorkspace }}>
      {children}
    </WorkspaceCtx.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceCtx);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
