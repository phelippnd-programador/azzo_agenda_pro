import { memo } from "react";
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

export const SidebarNavGroup = memo(function SidebarNavGroup({
  entry,
  pathname,
  isOpen,
  allowedSet,
  onNavigate,
  onToggle,
}: SidebarNavGroupProps) {
  const activeChildPath = getActiveChildPath(entry, pathname);
  const isParentActive = pathname === entry.path;
  const isGroupActive = isParentActive || Boolean(activeChildPath);
  const parentIsAccessible = isSidebarGroupEntryAccessible(entry.path, allowedSet);
  const contentId = `sidebar-group-${entry.id}`;
  const parentLinkLabel = entry.path === "/financeiro" ? "Resumo" : "Visao geral";

  return (
    <div className="space-y-0.5">
      <div
        className={cn(
          "flex h-10 items-center gap-1 rounded-xl text-sm transition-colors",
          isGroupActive
            ? "bg-primary/8 text-primary font-medium ring-1 ring-primary/10"
            : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="flex min-w-0 flex-1 cursor-pointer select-none items-center gap-2.5 px-3.5 py-2.5 text-left focus-visible:outline-none"
        >
          <entry.icon className="h-4 w-4 flex-shrink-0 opacity-80" />
          <span className="truncate flex-1">{entry.label}</span>
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? `Recolher ${entry.label}` : `Expandir ${entry.label}`}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="mr-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 opacity-60 transition-transform duration-200",
              isOpen ? "rotate-180" : "rotate-0"
            )}
          />
        </button>
      </div>
      {isOpen ? (
        <div id={contentId} className="ml-4 space-y-1 border-l border-border/80 pl-3 py-1">
          {parentIsAccessible ? (
            <SidebarNavLink
              path={entry.path}
              label={parentLinkLabel}
              icon={entry.icon}
              isActive={isParentActive}
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
});

SidebarNavGroup.displayName = "SidebarNavGroup";
