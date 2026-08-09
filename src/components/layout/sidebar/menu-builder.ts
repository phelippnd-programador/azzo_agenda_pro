import { DollarSign, Settings } from "lucide-react";
import type { CurrentMenuPermissionItem } from "@/types/menu-permissions";
import {
  DYNAMIC_BOTTOM_ROUTES,
  FISCAL_GROUP_PATHS,
  FINANCIAL_GROUP_PATHS,
  GROUP_ONLY_ROUTES,
  HIDDEN_MENU_ROUTES,
  ICON_REGISTRY,
  MAIN_MENU_ORDER,
  MENU_REGISTRY,
  REPORTS_GROUP_PATHS,
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
  // Itens com sidebarVisible=false permanecem acessiveis (RBAC/rota), mas nao
  // viram nos do menu; ainda assim garantem a visibilidade do item pai.
  const isSidebarHidden = (item: CurrentMenuPermissionItem) => item.sidebarVisible === false;

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
    if (!item || isSidebarHidden(item)) {
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

  const roots: Array<{ node: SidebarMenuNode; displayOrder?: number }> = [];
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

    roots.push({ node, displayOrder: item.displayOrder });
  });

  const sortedRoots = sortMenuNodes(roots).map(({ node }) => node);

  const childPaths = new Set<string>();
  sortedRoots.forEach((node) => {
    node.children.forEach((child) => childPaths.add(child.path));
  });

  const deduplicatedRoots = sortedRoots.filter(
    (node) => !(node.children.length === 0 && childPaths.has(node.path))
  );

  // Remove nos "orfaos": um pai (ex.: /financeiro "Resumo Financeiro") incluido
  // apenas por um filho permitido, mas cuja propria rota o usuario NAO acessa e
  // que ficou sem filhos visiveis (submenu colapsado). Evita expor item
  // administrativo indevido, como um profissional ver "Resumo Financeiro".
  const accessibleRoots = deduplicatedRoots.filter(
    (node) => node.children.length > 0 || isRouteInAllowedSet(node.path, allowedSet)
  );

  return moveStandaloneRoutesToEnd(accessibleRoots);
}

/** Verifica se a rota do no esta coberta pelas rotas permitidas (match exato ou sub-rota). */
function isRouteInAllowedSet(path: string, allowedSet: Set<string>): boolean {
  if (allowedSet.has(path)) return true;
  for (const allowed of allowedSet) {
    if (path.startsWith(`${allowed}/`)) return true;
  }
  return false;
}

export function buildFallbackSidebarMenu(allowedSet: Set<string>): SidebarMenuNode[] {
  // So o dono (que tem o proprio /financeiro) ve o hub financeiro. Um profissional
  // com apenas /financeiro/profissionais nao deve ver "Resumo Financeiro" — a visao
  // dele e "Minha Producao" (/minha-producao). Evita item administrativo indevido.
  const hasAnyFinanceAccess = allowedSet.has("/financeiro");
  const fiscalItems = FISCAL_GROUP_PATHS
    .filter((route) => allowedSet.has(route))
    .map((route) => MENU_REGISTRY[route as keyof typeof MENU_REGISTRY])
    .filter(Boolean);

  const entries: SidebarMenuNode[] = [];
  MAIN_MENU_ORDER.forEach((route) => {
    if (FINANCIAL_GROUP_PATHS.includes(route)) {
      return;
    }

    if (FISCAL_GROUP_PATHS.includes(route as typeof FISCAL_GROUP_PATHS[number])) {
      return;
    }

    if (REPORTS_GROUP_PATHS.includes(route as typeof REPORTS_GROUP_PATHS[number])) {
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

  // Financeiro vira um unico link para a pagina central /financeiro;
  // fechamento, comissoes e equipe sao acessados pelos cards da pagina.
  if (hasAnyFinanceAccess) {
    const financeInsertIndex = entries.findIndex((entry) => entry.path === "/auditoria");
    const financeLink: SidebarMenuNode = {
      id: "financeiro",
      path: "/financeiro",
      label: "Financeiro",
      icon: DollarSign,
      children: [],
    };

    if (financeInsertIndex >= 0) {
      entries.splice(financeInsertIndex, 0, financeLink);
    } else {
      entries.push(financeLink);
    }
  }

  if (fiscalItems.length > 0) {
    const fiscalItem = MENU_REGISTRY["/fiscal"];
    if (fiscalItem && allowedSet.has("/fiscal")) {
      const fiscalInsertIndex = entries.findIndex((entry) => entry.path === "/auditoria");
      const fiscalNode: SidebarMenuNode = {
        id: "fiscal",
        path: "/fiscal",
        label: fiscalItem.label,
        icon: fiscalItem.icon,
        children: [],
      };
      if (fiscalInsertIndex >= 0) {
        entries.splice(fiscalInsertIndex, 0, fiscalNode);
      } else {
        entries.push(fiscalNode);
      }
    }
  }

  // Relatorios viram um unico link para a pagina hub /relatorio;
  // os relatorios individuais sao acessados pelos cards do hub.
  const hasAnyReportAccess =
    allowedSet.has("/relatorio") ||
    REPORTS_GROUP_PATHS.some((route) => allowedSet.has(route));

  if (hasAnyReportAccess) {
    const reportsInsertIndex = entries.findIndex((entry) => entry.path === "/relatorio");
    const reportsLink: SidebarMenuNode = {
      id: "relatorios-hub",
      path: "/relatorio",
      label: "Relatórios",
      icon: MENU_REGISTRY["/relatorio"].icon,
      children: [],
    };

    if (reportsInsertIndex >= 0) {
      entries.splice(reportsInsertIndex, 1, reportsLink);
    } else {
      entries.push(reportsLink);
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
