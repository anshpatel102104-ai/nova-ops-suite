import { cn } from "@/lib/utils";

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative h-7 w-7 rounded-md bg-gradient-to-br from-[color:var(--ember)] via-[color:var(--primary)] to-[color:var(--ignition)] grid place-items-center nova-glow shadow-sm">
        {/* rocket triangle */}
        <svg viewBox="0 0 12 12" className="h-3.5 w-3.5 text-white" fill="currentColor">
          <path d="M6 0.8 L11 11 L6 8.4 L1 11 Z" />
        </svg>
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1.5 w-0.5 rounded-full bg-[color:var(--ignition)] nova-thrust" />
      </div>
      {showWordmark && (
        <div className="leading-none flex items-baseline gap-1">
          <span className="font-mono text-[13px] font-semibold tracking-[0.18em] uppercase">Launchpad</span>
          <span className="font-mono text-[13px] font-semibold tracking-[0.18em] uppercase text-primary">Nova</span>
        </div>
      )}
    </div>
  );
}
