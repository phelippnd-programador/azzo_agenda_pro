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
    <Link
      to={path}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        compact
          ? "flex items-center gap-2.5 h-8.5 px-2.5 rounded-lg text-sm select-none transition-colors"
          : "relative flex items-center gap-2.5 h-10 px-3.5 rounded-xl text-sm select-none transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-medium shadow-soft ring-1 ring-primary/10"
          : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      {isActive && !compact ? (
        <span className="absolute left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary" />
      ) : null}
      <Icon className={cn(compact ? "w-3.5 h-3.5" : "w-4 h-4", "flex-shrink-0 opacity-80")} />
      <span className="truncate">{label}</span>
    </Link>
  );
}
