import { Scissors } from "lucide-react";

import { cn } from "@/lib/utils";

type BrandLockupProps = {
  className?: string;
  iconClassName?: string;
  nameClassName?: string;
  subtitleClassName?: string;
  compact?: boolean;
  caption?: string;
};

export function BrandLockup({
  className,
  iconClassName,
  nameClassName,
  subtitleClassName,
  compact = false,
  caption,
}: BrandLockupProps) {
  return (
    <div className={cn("flex items-center justify-center gap-3", compact && "gap-2.5", className)}>
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--brand-accent)))] text-white shadow-soft ring-1 ring-white/55",
          compact && "h-7 w-7 rounded-lg",
          iconClassName
        )}
      >
        <Scissors className={cn("h-5 w-5", compact && "h-3.5 w-3.5")} />
      </div>
      <div className="min-w-0">
        <div
          className={cn(
            "font-display text-[1.35rem] font-semibold leading-none tracking-tight text-foreground sm:text-[1.55rem]",
            compact && "text-sm sm:text-sm",
            nameClassName
          )}
        >
          Azzo
        </div>
        <div
          className={cn(
            "mt-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-xs",
            compact && "mt-0.5 text-[10px] tracking-[0.14em] text-muted-foreground",
            subtitleClassName
          )}
        >
          {caption || "Agenda Pro"}
        </div>
      </div>
    </div>
  );
}
