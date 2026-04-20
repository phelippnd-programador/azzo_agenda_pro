import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type SidebarNavLinkProps = {
  path: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  compact?: boolean;
  onNavigate: () => void;
};

export function SidebarNavLink({
  path,
  label,
  icon: Icon,
  isActive,
  compact = false,
  onNavigate,
}: SidebarNavLinkProps) {
  return (
    <Link to={path} onClick={onNavigate}>
      <div
        className={cn(
          compact
            ? "flex items-center gap-2.5 h-8 px-2.5 rounded-md text-sm cursor-pointer select-none transition-colors"
            : "relative flex items-center gap-2.5 h-9 px-3 rounded-md text-sm cursor-pointer select-none transition-colors",
          isActive
            ? "bg-primary/8 text-primary font-medium"
            : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        {isActive && !compact ? (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
        ) : null}
        <Icon className={cn(compact ? "w-3.5 h-3.5" : "w-4 h-4", "flex-shrink-0 opacity-80")} />
        <span className="truncate">{label}</span>
      </div>
    </Link>
  );
}
