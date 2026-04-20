import { Scissors } from "lucide-react";

import { cn } from "@/lib/utils";

type BrandLockupProps = {
  className?: string;
  iconClassName?: string;
  nameClassName?: string;
  subtitleClassName?: string;
  compact?: boolean;
};

export function BrandLockup({
  className,
  iconClassName,
  nameClassName,
  subtitleClassName,
  compact = false,
}: BrandLockupProps) {
  return (
    <div className={cn("flex items-center justify-center gap-3", compact && "gap-2.5", className)}>
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm",
          compact && "h-7 w-7 rounded-lg",
          iconClassName
        )}
      >
        <Scissors className={cn("h-5 w-5", compact && "h-3.5 w-3.5")} />
      </div>
      <div className="min-w-0">
        <div
          className={cn(
            "text-[1.35rem] font-semibold leading-none tracking-tight text-foreground sm:text-[1.55rem]",
            compact && "text-sm sm:text-sm",
            nameClassName
          )}
        >
          Azzo
        </div>
        <div
          className={cn(
            "mt-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-primary/90 sm:text-xs",
            compact && "mt-0.5 text-[10px] tracking-[0.14em] text-muted-foreground",
            subtitleClassName
          )}
        >
          Agenda Pro
        </div>
      </div>
    </div>
  );
}
