import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { role: "OWNER" },
    logout: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/contexts/MenuPermissionsContext", () => ({
  useMenuPermissions: () => ({
    allowedRoutes: [
      "/dashboard",
      "/agenda",
      "/notificacoes",
      "/chat",
      "/clientes",
      "/servicos",
      "/especialidades",
      "/profissionais",
      "/financeiro",
      "/financeiro/fechamento-caixa",
      "/financeiro/comissoes",
      "/financeiro/profissionais",
      "/estoque",
      "/sugestoes",
      "/configuracoes",
      "/perfil-salao",
    ],
    menuItems: [
      {
        id: "finance-root",
        route: "/financeiro",
        label: "Resumo Financeiro",
        parentId: null,
        displayOrder: 120,
        iconKey: "DollarSign",
        active: true,
      },
      {
        id: "finance-cash-closing",
        route: "/financeiro/fechamento-caixa",
        label: "Fechamento de Caixa",
        parentId: "finance-root",
        displayOrder: 121,
        iconKey: "Wallet",
        active: true,
      },
      {
        id: "finance-commissions",
        route: "/financeiro/comissoes",
        label: "Comissoes",
        parentId: "finance-root",
        displayOrder: 122,
        iconKey: "Receipt",
        active: true,
      },
      {
        id: "finance-professionals",
        route: "/financeiro/profissionais",
        label: "Financeiro Profissionais",
        parentId: "finance-root",
        displayOrder: 123,
        iconKey: "BarChart3",
        active: true,
      },
    ],
  }),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1440,
    });
    localStorage.setItem("salon_public_slug", "studio-qa");
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("should organize navigation by sections and keep labels concise", async () => {
    render(
      <MemoryRouter initialEntries={["/financeiro"]}>
        <Sidebar isMobileOpen={false} onToggleMobile={vi.fn()} isDesktopOpen />
      </MemoryRouter>
    );

    expect(screen.getByText("Gestao")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir site de agendamento" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resumo Financeiro" })).toBeInTheDocument();
    expect(screen.getAllByText("Resumo Financeiro")).toHaveLength(1);
    expect(await screen.findByRole("link", { name: "Resumo" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Fechamento de Caixa" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Comissoes" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Financeiro Profissionais" })).toBeInTheDocument();
  }, 15000);

  it("should keep only the child link active on nested finance routes", async () => {
    render(
      <MemoryRouter initialEntries={["/financeiro/comissoes"]}>
        <Sidebar isMobileOpen={false} onToggleMobile={vi.fn()} isDesktopOpen />
      </MemoryRouter>
    );

    const resumoLink = await screen.findByRole("link", { name: "Resumo" });
    const comissoesLink = await screen.findByRole("link", { name: "Comissoes" });

    expect(resumoLink).not.toHaveAttribute("aria-current", "page");
    expect(comissoesLink).toHaveAttribute("aria-current", "page");
  });
});
