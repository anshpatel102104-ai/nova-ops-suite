import { useEffect, useState } from "react";
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

export function useWorkspace() {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWorkspace(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, onboarded, current_workspace_id")
        .eq("id", user.id)
        .maybeSingle();

      let ws: { id: string; name: string; plan: PlanId } | null = null;
      if (profile?.current_workspace_id) {
        const { data: w } = await supabase
          .from("workspaces")
          .select("id, name, plan")
          .eq("id", profile.current_workspace_id)
          .maybeSingle();
        if (w) ws = { id: w.id, name: w.name, plan: w.plan as PlanId };
      }
      if (!ws) {
        const { data: w } = await supabase
          .from("workspaces")
          .select("id, name, plan")
          .limit(1)
          .maybeSingle();
        if (w) ws = { id: w.id, name: w.name, plan: w.plan as PlanId };
      }
      if (cancelled) return;
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
    })();
    return () => { cancelled = true; };
  }, [user]);

  return { workspace, loading, setWorkspace };
}
