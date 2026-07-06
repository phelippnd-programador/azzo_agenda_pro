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
    // Usuario tem acesso ao hub de relatorios (root) e aos filhos ocultos
    const allowedSet = new Set(["/relatorio", "/relatorio/financeiro", "/relatorio/vendas", "/agenda"]);

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

  it("should NOT show an inaccessible parent hub included only via a child (professional case)", () => {
    // Profissional tem apenas /financeiro/profissionais (sua propria producao),
    // NAO /financeiro (Resumo Financeiro). O pai nao deve aparecer no menu.
    const items: CurrentMenuPermissionItem[] = [
      menuItem({ id: "fin-root", route: "/financeiro", label: "Resumo Financeiro", displayOrder: 10 }),
      menuItem({
        id: "fin-prof",
        route: "/financeiro/profissionais",
        label: "Equipe",
        parentId: "fin-root",
        displayOrder: 11,
        sidebarVisible: false,
      }),
      menuItem({ id: "agenda", route: "/agenda", label: "Agenda", displayOrder: 1 }),
    ];
    const allowedSet = new Set(["/financeiro/profissionais", "/agenda"]);

    const nodes = buildDynamicSidebarMenu(items, allowedSet);
    const paths = (nodes ?? []).map((node) => node.path);
    expect(paths).toContain("/agenda");
    expect(paths).not.toContain("/financeiro");
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
  it("should render finance as a single link without children (owner has root)", () => {
    const allowedSet = new Set([
      "/dashboard",
      "/financeiro",
      "/financeiro/fechamento-caixa",
      "/financeiro/comissoes",
    ]);

    const nodes = buildFallbackSidebarMenu(allowedSet);
    const financeNode = nodes.find((node) => node.path === "/financeiro");

    expect(financeNode).toBeDefined();
    expect(financeNode?.children).toHaveLength(0);
    expect(nodes.map((node) => node.path)).not.toContain("/financeiro/fechamento-caixa");
  });

  it("should NOT show finance hub when user only has a finance child (professional)", () => {
    // Profissional so tem /financeiro/profissionais — nao deve ver "Financeiro".
    const allowedSet = new Set(["/dashboard", "/agenda", "/financeiro/profissionais"]);
    const nodes = buildFallbackSidebarMenu(allowedSet);
    expect(nodes.map((node) => node.path)).not.toContain("/financeiro");
  });

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
