import { Bell, Check, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notifications.functions";

export function NotificationBell() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();
  const fetchList = useServerFn(listNotifications);
  const markOne = useServerFn(markNotificationRead);
  const markAll = useServerFn(markAllNotificationsRead);

  const key = ["notifications", workspace.id];
  const { data } = useQuery({
    queryKey: key,
    queryFn: () => fetchList({ data: { workspaceId: workspace.id } }),
    refetchInterval: 30_000,
  });

  const readOne = useMutation({
    mutationFn: (id: string) => markOne({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
  const readAll = useMutation({
    mutationFn: () => markAll({ data: { workspaceId: workspace.id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const unread = data?.unread ?? 0;
  const items = data?.notifications ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[10px] font-semibold text-primary-foreground grid place-items-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <p className="text-sm font-semibold">Notifications</p>
          <button
            type="button"
            onClick={() => readAll.mutate()}
            disabled={unread === 0 || readAll.isPending}
            className="text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-40 inline-flex items-center gap-1"
          >
            <Check className="h-3 w-3" /> Mark all read
          </button>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">
              <Inbox className="h-5 w-5 mx-auto mb-2 opacity-50" />
              No notifications yet.
            </div>
          ) : (
            items.map((n) => {
              const unreadItem = !n.read_at;
              const body = (
                <div className="flex gap-2.5 items-start">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                      unreadItem ? "bg-primary" : "bg-transparent"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase tracking-wider">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
              const onClick = () => unreadItem && readOne.mutate(n.id);
              return n.link ? (
                <Link
                  key={n.id}
                  to={n.link}
                  onClick={onClick}
                  className="block px-3 py-2.5 hover:bg-muted/50 border-b border-border last:border-b-0"
                >
                  {body}
                </Link>
              ) : (
                <button
                  key={n.id}
                  type="button"
                  onClick={onClick}
                  className="block w-full text-left px-3 py-2.5 hover:bg-muted/50 border-b border-border last:border-b-0"
                >
                  {body}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
