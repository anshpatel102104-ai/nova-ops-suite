import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { acceptInvitation, previewInvitation } from "@/lib/team.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { Mail, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/invite/$token")({
  component: InviteAcceptPage,
});

type Preview = {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  workspace_id: string;
  workspace_name: string;
} | null;

function InviteAcceptPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { refresh } = useWorkspace();
  const preview = useServerFn(previewInvitation);
  const accept = useServerFn(acceptInvitation);

  const [invite, setInvite] = useState<Preview>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { invitation } = await preview({ data: { token } });
        setInvite(invitation);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onAccept = async () => {
    setAccepting(true);
    try {
      await accept({ data: { token } });
      toast.success("Welcome to the team.");
      await refresh();
      navigate({ to: "/app/dashboard" });
    } catch (e) {
      toast.error((e as Error).message);
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invite || error) {
    return (
      <>
        <PageHeader eyebrow="Invitation" title="Invitation unavailable" />
        <div className="nova-card p-6 max-w-lg">
          <AlertTriangle className="h-5 w-5 text-destructive mb-2" />
          <p className="text-sm text-muted-foreground">
            {error ?? "This invitation link is invalid or has been revoked."}
          </p>
        </div>
      </>
    );
  }

  const expired = new Date(invite.expires_at) < new Date();
  const usable = invite.status === "pending" && !expired;

  return (
    <>
      <PageHeader eyebrow="Invitation" title={`Join ${invite.workspace_name}`} />
      <div className="nova-card p-6 max-w-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md border border-border bg-accent/40 grid place-items-center">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{invite.email}</p>
            <p className="text-xs text-muted-foreground">Role: {invite.role}</p>
          </div>
          <div className="ml-auto">
            <StatusPill tone={usable ? "primary" : "muted"}>
              {expired ? "expired" : invite.status}
            </StatusPill>
          </div>
        </div>

        {usable ? (
          <>
            <p className="text-sm text-muted-foreground">
              Accept to join the <span className="text-foreground font-medium">{invite.workspace_name}</span> workspace.
              You must be signed in with <span className="font-mono">{invite.email}</span>.
            </p>
            <div className="flex gap-2">
              <Button onClick={onAccept} disabled={accepting}>
                {accepting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                Accept invitation
              </Button>
              <Button variant="ghost" onClick={() => navigate({ to: "/app/dashboard" })}>Decline</Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            This invitation is no longer valid. Ask the workspace owner to send a new one.
          </p>
        )}
      </div>
    </>
  );
}
