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
      "/financeiro/comissoes",
      "/financeiro/profissionais",
      "/estoque",
      "/sugestoes",
      "/configuracoes",
      "/perfil-salao",
    ],
    menuItems: null,
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
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should organize navigation by sections and keep labels concise", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Sidebar isMobileOpen={false} onToggleMobile={vi.fn()} isDesktopOpen />
      </MemoryRouter>
    );

    expect(screen.getByText("Hoje")).toBeInTheDocument();
    expect(screen.getByText("Base do negocio")).toBeInTheDocument();
    expect(screen.getByText("Gestao")).toBeInTheDocument();
    expect(screen.getByText("Financeiro")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir site de agendamento" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByText("Resumo Financeiro")).not.toBeInTheDocument();
    expect(screen.queryByText("Financeiro Profissionais")).not.toBeInTheDocument();
  }, 15000);
});
