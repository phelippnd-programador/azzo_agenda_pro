import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import ReportsHubPage from "@/pages/report/ReportsHubPage";

const menuPermissionsMock = vi.hoisted(() => ({
  allowedRoutes: ["/relatorio", "/relatorio/estoque", "/relatorio/clientes"],
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) => (
    <main>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
    </main>
  ),
}));

vi.mock("@/contexts/MenuPermissionsContext", () => ({
  useMenuPermissions: () => ({
    allowedRoutes: menuPermissionsMock.allowedRoutes,
  }),
}));

describe("ReportsHubPage", () => {
  it("deve renderizar abas apenas para relatorios permitidos", () => {
    render(
      <MemoryRouter initialEntries={["/relatorio"]}>
        <ReportsHubPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("tab", { name: "Estoque" })).toHaveAttribute("href", "/relatorio/estoque");
    expect(screen.getByRole("tab", { name: "Clientes" })).toHaveAttribute("href", "/relatorio/clientes");
    expect(screen.queryByRole("tab", { name: "Financeiro" })).not.toBeInTheDocument();
    expect(screen.queryByText("Abrir relatorio")).not.toBeInTheDocument();
  });
});
