import { describe, expect, it } from "vitest";
import {
  buildDynamicSidebarMenu,
  buildFallbackSidebarMenu,
} from "@/components/layout/sidebar/menu-builder";
import type { CurrentMenuPermissionItem } from "@/types/menu-permissions";

const menuItem = (
  overrides: Partial<CurrentMenuPermissionItem> & Pick<CurrentMenuPermissionItem, "id" | "route" | "label">,
): CurrentMenuPermissionItem => ({
  parentId: null,
  displayOrder: 0,
  iconKey: null,
  active: true,
  ...overrides,
});

describe("buildDynamicSidebarMenu", () => {
  it("should hide items with sidebarVisible=false but keep the parent visible", () => {
    const items: CurrentMenuPermissionItem[] = [
      menuItem({ id: "reports-root", route: "/relatorio", label: "Relatórios", displayOrder: 10 }),
      menuItem({
        id: "reports-financeiro",
        route: "/relatorio/financeiro",
        label: "Financeiro",
        parentId: "reports-root",
        displayOrder: 11,
        sidebarVisible: false,
      }),
      menuItem({
        id: "reports-vendas",
        route: "/relatorio/vendas",
        label: "Vendas",
        parentId: "reports-root",
        displayOrder: 12,
        sidebarVisible: false,
      }),
      menuItem({ id: "agenda", route: "/agenda", label: "Agenda", displayOrder: 1 }),
    ];
    // Usuario tem acesso apenas aos relatorios filhos (nao a rota raiz)
    const allowedSet = new Set(["/relatorio/financeiro", "/relatorio/vendas", "/agenda"]);

    const nodes = buildDynamicSidebarMenu(items, allowedSet);

    expect(nodes).not.toBeNull();
    const paths = (nodes ?? []).map((node) => node.path);
    expect(paths).toContain("/relatorio");
    expect(paths).toContain("/agenda");
    expect(paths).not.toContain("/relatorio/financeiro");
    expect(paths).not.toContain("/relatorio/vendas");

    const reportsNode = (nodes ?? []).find((node) => node.path === "/relatorio");
    expect(reportsNode?.children ?? []).toHaveLength(0);
  });

  it("should keep items without the flag visible (backward compatible)", () => {
    const items: CurrentMenuPermissionItem[] = [
      menuItem({ id: "agenda", route: "/agenda", label: "Agenda" }),
    ];
    const nodes = buildDynamicSidebarMenu(items, new Set(["/agenda"]));
    expect((nodes ?? []).map((node) => node.path)).toContain("/agenda");
  });
});

describe("buildFallbackSidebarMenu", () => {
  it("should render reports as a single hub link without children", () => {
    const allowedSet = new Set([
      "/dashboard",
      "/relatorio/financeiro",
      "/relatorio/vendas",
    ]);

    const nodes = buildFallbackSidebarMenu(allowedSet);
    const reportsNode = nodes.find((node) => node.path === "/relatorio");

    expect(reportsNode).toBeDefined();
    expect(reportsNode?.children).toHaveLength(0);
    expect(nodes.map((node) => node.path)).not.toContain("/relatorio/financeiro");
  });
});
