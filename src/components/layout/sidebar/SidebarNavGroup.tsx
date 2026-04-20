import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getActiveChildPath,
  isSidebarEntryActive,
  isSidebarGroupEntryAccessible,
} from "./menu-builder";
import { SidebarNavLink } from "./SidebarNavLink";
import type { SidebarMenuNode } from "./types";

type SidebarNavGroupProps = {
  entry: SidebarMenuNode;
  pathname: string;
  isOpen: boolean;
  allowedSet: Set<string>;
  onNavigate: () => void;
  onToggle: () => void;
};

export function SidebarNavGroup({
  entry,
  pathname,
  isOpen,
  allowedSet,
  onNavigate,
  onToggle,
}: SidebarNavGroupProps) {
  const activeChildPath = getActiveChildPath(entry, pathname);
  const isGroupActive = Boolean(activeChildPath);
  const parentIsAccessible = isSidebarGroupEntryAccessible(entry.path, allowedSet);

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-2.5 h-9 px-3 rounded-md text-sm cursor-pointer select-none transition-colors",
          isGroupActive
            ? "text-primary font-medium"
            : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <entry.icon className="w-4 h-4 flex-shrink-0 opacity-80" />
        <span className="truncate flex-1 text-left">{entry.label}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 opacity-60 transition-transform duration-200",
            isOpen ? "rotate-180" : "rotate-0"
          )}
        />
      </button>
      {isOpen ? (
        <div className="ml-3 pl-3 border-l border-border space-y-0.5 py-0.5">
          {parentIsAccessible ? (
            <SidebarNavLink
              path={entry.path}
              label={entry.label}
              icon={entry.icon}
              isActive={pathname === entry.path}
              compact
              onNavigate={onNavigate}
            />
          ) : null}
          {entry.children.map((item) => (
            <SidebarNavLink
              key={item.path}
              path={item.path}
              label={item.label}
              icon={item.icon}
              isActive={activeChildPath === item.path || isSidebarEntryActive(pathname, item.path)}
              compact
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
