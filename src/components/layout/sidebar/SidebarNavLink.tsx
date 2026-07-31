import { memo } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { prefetchRouteModule } from "@/app/routes/route-prefetch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type SidebarNavLinkProps = {
  path: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  compact?: boolean;
  onNavigate: () => void;
};

export const SidebarNavLink = memo(function SidebarNavLink({
  path,
  label,
  icon: Icon,
  isActive,
  compact = false,
  onNavigate,
}: SidebarNavLinkProps) {
  const link = (
    <Link
      to={path}
      onClick={onNavigate}
      onMouseEnter={() => prefetchRouteModule(path)}
      onFocus={() => prefetchRouteModule(path)}
      onTouchStart={() => prefetchRouteModule(path)}
      aria-current={isActive ? "page" : undefined}
      aria-label={compact ? label : undefined}
      className={cn(
        compact
          ? "flex h-10 w-10 items-center justify-center rounded-xl text-sm select-none transition-[background-color,color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0"
          : "relative flex items-center gap-2.5 h-10 px-3.5 rounded-xl text-sm select-none transition-[background-color,color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0",
        isActive
          ? "bg-primary/10 text-primary font-medium shadow-soft ring-1 ring-primary/10"
          : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      {isActive && !compact ? (
        <span className="absolute left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary" />
      ) : null}
      <Icon className={cn(compact ? "h-4 w-4" : "w-4 h-4", "flex-shrink-0 opacity-80")} />
      {compact ? <span className="sr-only">{label}</span> : <span className="truncate">{label}</span>}
    </Link>
  );

  if (!compact) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
});

SidebarNavLink.displayName = "SidebarNavLink";
