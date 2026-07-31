import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, LogOut, Menu, X } from "lucide-react";
import { BrandLockup } from "@/components/common/BrandLockup";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useMenuPermissions } from "@/contexts/MenuPermissionsContext";
import { cn } from "@/lib/utils";
import { appRouteManifest } from "@/app/route-manifest";
import { SIDEBAR_BOTTOM_ITEMS, SIDEBAR_SECTIONS } from "./sidebar/config";
import { getVisibleSidebarEntries, isSidebarEntryActive } from "./sidebar/menu-builder";
import { SidebarNavGroup } from "./sidebar/SidebarNavGroup";
import { SidebarNavLink } from "./sidebar/SidebarNavLink";

interface SidebarProps {
  isMobileOpen: boolean;
  onToggleMobile: () => void;
  isDesktopOpen: boolean;
  onToggleDesktop: () => void;
}

const SIDEBAR_SCROLL_STORAGE_KEY = "sidebar_scroll_top";
const SIDEBAR_GROUPS_STORAGE_KEY = "sidebar_expanded_groups";

function getInitialExpandedGroups() {
  try {
    const raw = sessionStorage.getItem(SIDEBAR_GROUPS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function Sidebar({ isMobileOpen, onToggleMobile, isDesktopOpen, onToggleDesktop }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { allowedRoutes, menuItems } = useMenuPermissions();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const allowedSet = useMemo(() => new Set(allowedRoutes ?? []), [allowedRoutes]);
  const visibleMenuEntries = useMemo(
    () => getVisibleSidebarEntries(menuItems, allowedSet),
    [allowedSet, menuItems]
  );
  const sectionedEntries = useMemo(() => {
    const mapped = SIDEBAR_SECTIONS.map((section) => ({
      ...section,
      items: visibleMenuEntries.filter((entry) => section.paths.has(entry.path)),
    })).filter((section) => section.items.length > 0);

    const allocatedPaths = new Set(mapped.flatMap((section) => section.items.map((item) => item.path)));
    const remainingItems = visibleMenuEntries.filter((entry) => !allocatedPaths.has(entry.path));

    if (remainingItems.length > 0) {
      mapped.push({
        id: "mais",
        label: "Mais",
        paths: new Set<string>(),
        items: remainingItems,
      });
    }

    return mapped;
  }, [visibleMenuEntries]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(getInitialExpandedGroups);
  const [salonSlug, setSalonSlug] = useState<string | null>(null);
  const isCompactDesktop = !isDesktopOpen;

  const persistScrollPosition = useCallback(() => {
    try {
      const value = scrollContainerRef.current?.scrollTop ?? 0;
      sessionStorage.setItem(SIDEBAR_SCROLL_STORAGE_KEY, String(value));
    } catch {
      // ignore sessionStorage issues
    }
  }, []);

  const handleNavigate = useCallback(() => {
    persistScrollPosition();
    if (window.innerWidth < 1024) {
      onToggleMobile();
    }
  }, [onToggleMobile, persistScrollPosition]);

  useEffect(() => {
    const matchingGroup = visibleMenuEntries.find((entry) =>
      isSidebarEntryActive(location.pathname, entry.path) ||
      entry.children.some((child) => isSidebarEntryActive(location.pathname, child.path))
    );
    if (!matchingGroup) {
      return;
    }
    setExpandedGroups((prev) =>
      prev[matchingGroup.id] ? prev : { ...prev, [matchingGroup.id]: true }
    );
  }, [location.pathname, visibleMenuEntries]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SIDEBAR_GROUPS_STORAGE_KEY, JSON.stringify(expandedGroups));
    } catch {
      // ignore sessionStorage issues
    }
  }, [expandedGroups]);

  useLayoutEffect(() => {
    try {
      const raw = sessionStorage.getItem(SIDEBAR_SCROLL_STORAGE_KEY);
      if (!raw || !scrollContainerRef.current) return;
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        scrollContainerRef.current.scrollTop = parsed;
      }
    } catch {
      // ignore sessionStorage issues
    }
  }, [sectionedEntries.length]);

  useEffect(() => {
    const cachedSlug = localStorage.getItem("salon_public_slug");
    if (cachedSlug?.trim()) {
      setSalonSlug(cachedSlug.trim());
    }

    const handleSlugUpdate = (e: CustomEvent<string>) => {
      if (e.detail?.trim()) setSalonSlug(e.detail.trim());
    };
    window.addEventListener("salon_slug_updated", handleSlugUpdate as EventListener);
    return () => window.removeEventListener("salon_slug_updated", handleSlugUpdate as EventListener);
  }, []);

  const handleLogout = async () => {
    persistScrollPosition();
    try {
      await logout();
    } finally {
      navigate(appRouteManifest.public.login, { replace: true });
    }
  };

  return (
    <>
      {isMobileOpen ? (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggleMobile}
        />
      ) : null}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full overflow-hidden border-r border-sidebar-border bg-sidebar/95 shadow-[0_10px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-[width,transform] duration-300 ease-out",
          isDesktopOpen ? "lg:w-72" : "lg:w-20",
          "w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <TooltipProvider delayDuration={120}>
          <div className="flex h-full flex-col">
            <div className={cn("group/sidebar-header border-b border-sidebar-border/80 py-4", isCompactDesktop ? "px-3" : "px-4")}>
              <div className={cn("relative flex items-center gap-3", isCompactDesktop ? "justify-center" : "justify-between")}>
                <Link
                  to={appRouteManifest.shell.dashboard}
                  className={cn(
                    "min-w-0 transition-transform duration-200 ease-out hover:-translate-y-0.5",
                    isCompactDesktop && "flex justify-center"
                  )}
                  aria-label="Ir para o dashboard"
                >
                  <BrandLockup
                    compact
                    className={cn(isCompactDesktop ? "justify-center gap-0" : "justify-start")}
                    caption={isCompactDesktop ? undefined : "Operating System"}
                    nameClassName={isCompactDesktop ? "hidden" : undefined}
                    subtitleClassName={isCompactDesktop ? "hidden" : undefined}
                    iconClassName={isCompactDesktop ? "h-10 w-10 rounded-2xl" : undefined}
                  />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden flex-shrink-0 h-7 w-7"
                  onClick={onToggleMobile}
                  aria-label="Fechar menu"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "hidden h-8 w-8 flex-shrink-0 rounded-xl text-sidebar-foreground/75 transition-[opacity,transform,background-color,color] duration-200 ease-out hover:bg-accent hover:text-accent-foreground focus-visible:opacity-100 lg:inline-flex",
                    isCompactDesktop &&
                      "absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/sidebar-header:opacity-100",
                    !isCompactDesktop && "hover:-translate-y-0.5"
                  )}
                  onClick={onToggleDesktop}
                  aria-label={isDesktopOpen ? "Recolher menu lateral" : "Expandir menu lateral"}
                >
                  {isDesktopOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
              {!isCompactDesktop ? (
                <div className="mt-4 hidden lg:block rounded-2xl border border-sidebar-border/70 bg-background/55 px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/60">
                    Navegacao
                  </p>
                  <p className="mt-1 text-xs text-sidebar-foreground/80">
                    Operacao, cadastro e gestao no mesmo fluxo.
                  </p>
                </div>
              ) : null}
            </div>

            <div
              ref={scrollContainerRef}
              className={cn("flex-1 overflow-y-auto py-3", isCompactDesktop && "lg:px-0")}
              onScroll={persistScrollPosition}
            >
              <nav className={cn(isCompactDesktop ? "px-2" : "px-2")}>
                {sectionedEntries.map((section) => (
                  <div key={section.id} className="mb-4 last:mb-0">
                    {isCompactDesktop ? (
                      <div className="px-3 pb-2 pt-1 lg:flex lg:justify-center">
                        <div className="h-px w-8 bg-sidebar-border/80" />
                      </div>
                    ) : (
                      <div className="px-3 pb-2 pt-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/65">
                          {section.label}
                        </p>
                      </div>
                    )}
                    <div className={cn("space-y-1", isCompactDesktop && "lg:flex lg:flex-col lg:items-center")}>
                      {section.items.map((entry) =>
                        entry.children.length === 0 ? (
                          <SidebarNavLink
                            key={entry.path}
                            path={entry.path}
                            label={entry.label}
                            icon={entry.icon}
                            compact={isCompactDesktop}
                            isActive={
                              isSidebarEntryActive(location.pathname, entry.path) &&
                              !(entry.path === appRouteManifest.audit.root &&
                                location.pathname.startsWith(appRouteManifest.audit.lgpd))
                            }
                            onNavigate={handleNavigate}
                          />
                        ) : (
                          <SidebarNavGroup
                            key={entry.id}
                            entry={entry}
                            pathname={location.pathname}
                            isOpen={expandedGroups[entry.id] ?? false}
                            compact={isCompactDesktop}
                            allowedSet={allowedSet}
                            onNavigate={handleNavigate}
                            onToggle={() =>
                              setExpandedGroups((prev) => ({ ...prev, [entry.id]: !prev[entry.id] }))
                            }
                          />
                        )
                      )}
                    </div>
                  </div>
                ))}
              </nav>

              <div className={cn("mt-4", isCompactDesktop ? "px-2 lg:flex lg:justify-center" : "px-2")}>
                {salonSlug ? (
                  <Link
                    to={`/agendar/${salonSlug}`}
                    aria-label="Abrir site de agendamento"
                    className={cn(
                      "text-muted-foreground transition-[background-color,color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isCompactDesktop
                        ? "flex h-10 w-10 items-center justify-center rounded-xl"
                        : "flex items-center gap-2.5 h-10 px-3.5 rounded-xl text-sm"
                    )}
                  >
                    <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-70" />
                    {isCompactDesktop ? <span className="sr-only">Site de agendamento</span> : <span className="truncate">Site de agendamento</span>}
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className={cn(
                      "cursor-not-allowed text-muted-foreground/45",
                      isCompactDesktop
                        ? "flex h-10 w-10 items-center justify-center rounded-xl"
                        : "flex items-center gap-2.5 h-10 px-3.5 rounded-xl text-sm"
                    )}
                  >
                    <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-50" />
                    {isCompactDesktop ? <span className="sr-only">Site de agendamento indisponivel</span> : <span className="truncate">Site de agendamento indisponivel</span>}
                  </span>
                )}
              </div>
            </div>

            <div
              className={cn(
                "border-t border-sidebar-border pt-2 pb-3",
                isCompactDesktop ? "px-2 space-y-1 lg:flex lg:flex-col lg:items-center" : "px-2 space-y-0.5"
              )}
            >
              {SIDEBAR_BOTTOM_ITEMS.filter((item) => item.isVisible(user?.role, allowedSet)).map(
                (item) => (
                  <SidebarNavLink
                    key={item.path}
                    path={item.path}
                    label={item.label}
                    icon={item.icon}
                    compact={isCompactDesktop}
                    isActive={location.pathname === item.path}
                    onNavigate={handleNavigate}
                  />
                )
              )}
              <button
                type="button"
                className={cn(
                  "text-red-500 transition-colors cursor-pointer hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 dark:hover:bg-red-950/30",
                  isCompactDesktop
                    ? "flex h-10 w-10 items-center justify-center rounded-xl hover:bg-red-50"
                    : "w-full flex items-center gap-2.5 h-10 px-3.5 rounded-xl text-sm hover:bg-red-50"
                )}
                onClick={handleLogout}
                aria-label="Sair da conta"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                {isCompactDesktop ? <span className="sr-only">Sair</span> : <span className="truncate">Sair</span>}
              </button>
            </div>
          </div>
        </TooltipProvider>
      </aside>

      <button
        type="button"
        className="fixed top-3 left-3 z-30 lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm hover:bg-accent transition-colors"
        onClick={onToggleMobile}
        aria-label="Abrir menu"
      >
        <Menu className="w-4 h-4" />
      </button>
    </>
  );
}
