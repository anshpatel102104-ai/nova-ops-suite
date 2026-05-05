import { cn } from "@/lib/utils";

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative h-7 w-7 rounded-md border border-border bg-surface-elevated grid place-items-center">
        <div className="h-2.5 w-2.5 rounded-sm bg-primary nova-glow" />
      </div>
      {showWordmark && (
        <div className="leading-none">
          <span className="text-[15px] font-semibold tracking-tight">Nova</span>
          <span className="text-[15px] font-semibold tracking-tight text-primary">OPS</span>
        </div>
      )}
    </div>
  );
}
