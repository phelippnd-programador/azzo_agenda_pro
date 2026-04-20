import { DollarSign, Settings } from "lucide-react";
import type { CurrentMenuPermissionItem } from "@/types/menu-permissions";
import {
  DYNAMIC_BOTTOM_ROUTES,
  FINANCIAL_GROUP_PATHS,
  GROUP_ONLY_ROUTES,
  HIDDEN_MENU_ROUTES,
  ICON_REGISTRY,
  MAIN_MENU_ORDER,
  MENU_REGISTRY,
  STANDALONE_LAST_ROUTES,
} from "./config";
import type { SidebarMenuNode } from "./types";

function sortMenuNodes<T extends { displayOrder?: number; label?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const orderDelta = Number(left.displayOrder || 0) - Number(right.displayOrder || 0);
    if (orderDelta !== 0) return orderDelta;
    return String(left.label || "").localeCompare(String(right.label || ""), "pt-BR");
  });
}

function resolveMenuIcon(item: CurrentMenuPermissionItem) {
  if (item.iconKey && ICON_REGISTRY[item.iconKey]) {
    return ICON_REGISTRY[item.iconKey];
  }

  return MENU_REGISTRY[item.route as keyof typeof MENU_REGISTRY]?.icon ?? Settings;
}

function moveStandaloneRoutesToEnd<T extends { path: string }>(items: T[]) {
  const regularItems = items.filter((item) => !STANDALONE_LAST_ROUTES.has(item.path));
  const standaloneItems = items.filter((item) => STANDALONE_LAST_ROUTES.has(item.path));
  return [...regularItems, ...standaloneItems];
}

export function buildDynamicSidebarMenu(
  menuItems: CurrentMenuPermissionItem[] | null,
  allowedSet: Set<string>
): SidebarMenuNode[] | null {
  if (!menuItems || menuItems.length === 0) {
    return null;
  }

  const visibleItems = menuItems.filter(
    (item) =>
      item.active &&
      item.route &&
      !item.route.includes(":") &&
      !DYNAMIC_BOTTOM_ROUTES.has(item.route) &&
      !HIDDEN_MENU_ROUTES.has(item.route)
  );

  const byId = new Map(visibleItems.map((item) => [item.id, item]));
  const includedIds = new Set<string>();

  visibleItems.forEach((item) => {
    if (!allowedSet.has(item.route)) {
      return;
    }

    includedIds.add(item.id);
    if (STANDALONE_LAST_ROUTES.has(item.route)) {
      return;
    }

    let currentParentId = item.parentId || null;
    while (currentParentId) {
      const parent = byId.get(currentParentId);
      if (!parent) {
        break;
      }
      includedIds.add(parent.id);
      currentParentId = parent.parentId || null;
    }
  });

  if (includedIds.size === 0) {
    return [];
  }

  const nodeMap = new Map<string, SidebarMenuNode>();
  includedIds.forEach((id) => {
    const item = byId.get(id);
    if (!item) {
      return;
    }

    nodeMap.set(id, {
      id: item.id,
      path: item.route,
      label:
        item.label ||
        MENU_REGISTRY[item.route as keyof typeof MENU_REGISTRY]?.label ||
        item.route,
      icon: resolveMenuIcon(item),
      children: [],
    });
  });

  const roots: Array<SidebarMenuNode & { displayOrder?: number }> = [];
  sortMenuNodes(visibleItems.filter((item) => includedIds.has(item.id))).forEach((item) => {
    const node = nodeMap.get(item.id);
    if (!node) {
      return;
    }

    const parent =
      item.parentId && !STANDALONE_LAST_ROUTES.has(item.route)
        ? nodeMap.get(item.parentId)
        : null;

    if (parent) {
      parent.children.push(node);
      parent.children = sortMenuNodes(
        parent.children.map((child) => ({
          ...child,
          displayOrder: visibleItems.find((candidate) => candidate.id === child.id)?.displayOrder,
        }))
      ).map(({ displayOrder: _displayOrder, ...child }) => child);
      return;
    }

    roots.push({ ...node, displayOrder: item.displayOrder });
  });

  return moveStandaloneRoutesToEnd(
    sortMenuNodes(roots).map(({ displayOrder: _displayOrder, ...node }) => node)
  );
}

export function buildFallbackSidebarMenu(allowedSet: Set<string>): SidebarMenuNode[] {
  const financialItems = FINANCIAL_GROUP_PATHS.filter((route) => allowedSet.has(route)).map(
    (route) => MENU_REGISTRY[route]
  );

  const entries: SidebarMenuNode[] = [];
  MAIN_MENU_ORDER.forEach((route) => {
    if (FINANCIAL_GROUP_PATHS.includes(route)) {
      return;
    }

    if (route === "/auditoria/lgpd") {
      if (!allowedSet.has("/auditoria") && !allowedSet.has("/auditoria/lgpd")) {
        return;
      }
    } else if (!allowedSet.has(route)) {
      return;
    }

    const item = MENU_REGISTRY[route];
    entries.push({
      id: item.path,
      path: item.path,
      label: item.label,
      icon: item.icon,
      children: [],
    });
  });

  if (financialItems.length > 0) {
    const financeInsertIndex = entries.findIndex((entry) => entry.path === "/auditoria");
    const financialGroup: SidebarMenuNode = {
      id: "financeiro",
      path: "/financeiro",
      label: "Financeiro",
      icon: DollarSign,
      children: financialItems.map((item) => ({
        id: item.path,
        path: item.path,
        label: item.label,
        icon: item.icon,
        children: [],
      })),
    };

    if (financeInsertIndex >= 0) {
      entries.splice(financeInsertIndex, 0, financialGroup);
    } else {
      entries.push(financialGroup);
    }
  }

  return moveStandaloneRoutesToEnd(entries);
}

export function getVisibleSidebarEntries(
  menuItems: CurrentMenuPermissionItem[] | null,
  allowedSet: Set<string>
) {
  return buildDynamicSidebarMenu(menuItems, allowedSet) ?? buildFallbackSidebarMenu(allowedSet);
}

export function getActiveChildPath(entry: SidebarMenuNode, pathname: string) {
  return (
    entry.children
      .filter((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
      .sort((left, right) => right.path.length - left.path.length)[0]?.path ?? null
  );
}

export function isSidebarEntryActive(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function isSidebarGroupEntryAccessible(path: string, allowedSet: Set<string>) {
  return allowedSet.has(path) && !GROUP_ONLY_ROUTES.has(path);
}
