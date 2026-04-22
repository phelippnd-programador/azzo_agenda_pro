import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import { BrandLockup } from "@/components/common/BrandLockup";
import { Button } from "@/components/ui/button";
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
}

export function Sidebar({ isMobileOpen, onToggleMobile, isDesktopOpen }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { allowedRoutes, menuItems } = useMenuPermissions();
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [salonSlug, setSalonSlug] = useState("meu-salao");

  const handleNavigate = () => {
    if (window.innerWidth < 1024) {
      onToggleMobile();
    }
  };

  useEffect(() => {
    const matchingGroup = visibleMenuEntries.find((entry) =>
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
    const cachedSlug = localStorage.getItem("salon_public_slug");
    if (cachedSlug?.trim()) {
      setSalonSlug(cachedSlug.trim());
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate(appRouteManifest.public.login);
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
          "fixed left-0 top-0 z-50 h-full w-60 bg-sidebar border-r border-sidebar-border shadow-sm transition-transform duration-300",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isDesktopOpen ? "lg:translate-x-0" : "lg:-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="border-b border-sidebar-border/80 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <Link to={appRouteManifest.shell.dashboard} className="min-w-0">
                <BrandLockup compact className="justify-start" caption="Operating System" />
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
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-3">
            <nav className="px-2">
              {sectionedEntries.map((section) => (
                <div key={section.id} className="mb-4 last:mb-0">
                  <div className="px-3 pb-2 pt-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/65">
                      {section.label}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {section.items.map((entry) =>
                      entry.children.length === 0 ? (
                        <SidebarNavLink
                          key={entry.path}
                          path={entry.path}
                          label={entry.label}
                          icon={entry.icon}
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

            <div className="px-2 mt-4">
              <Link
                to={`/agendar/${salonSlug}`}
                aria-label="Abrir site de agendamento"
                className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-70" />
                <span className="truncate">Site de agendamento</span>
              </Link>
            </div>
          </div>

          <div className="px-2 pb-3 pt-2 border-t border-sidebar-border space-y-0.5">
            {SIDEBAR_BOTTOM_ITEMS.filter((item) => item.isVisible(user?.role, allowedSet)).map(
              (item) => (
                <SidebarNavLink
                  key={item.path}
                  path={item.path}
                  label={item.label}
                  icon={item.icon}
                  isActive={location.pathname === item.path}
                  onNavigate={handleNavigate}
                />
              )
            )}
            <button
              type="button"
              className="w-full flex items-center gap-2.5 h-10 px-3.5 rounded-xl text-sm text-red-500 transition-colors cursor-pointer hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 dark:hover:bg-red-950/30"
              onClick={handleLogout}
              aria-label="Sair da conta"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Sair</span>
            </button>
          </div>
        </div>
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
