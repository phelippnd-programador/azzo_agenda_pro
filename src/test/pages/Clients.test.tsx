import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Clients from "@/pages/Clients";
import ClientsOverviewPage from "@/pages/clients/ClientsOverviewPage";

vi.mock("@/hooks/useClients", () => ({
  useClients: () => ({
    clients: [
      {
        id: "client-1",
        name: "Maria Silva",
        email: "maria@qa.local",
        phone: "(11) 98888-0000",
        birthDate: null,
        notes: null,
        totalVisits: 3,
        totalSpent: 250,
        lastVisit: "2026-03-12",
      },
    ],
    pagination: { page: 1, limit: 20, total: 41, hasMore: true },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    goToPage: vi.fn(),
    createClient: vi.fn(),
    updateClient: vi.fn(),
    deleteClient: vi.fn(),
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "owner-1", role: "OWNER", name: "Owner QA" },
  }),
}));

vi.mock("@/contexts/MenuPermissionsContext", () => ({
  useMenuPermissions: () => ({
    isLoading: false,
    allowedRoutes: ["/clientes"],
    menuItems: [],
    hasRoutePermission: () => true,
    refreshPermissions: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/chat/ChatInboxNotifier", () => ({
  ChatInboxNotifier: () => null,
}));

describe("Clients", () => {
  it("should render client metrics and new client action", () => {
    render(
      <MemoryRouter initialEntries={["/clientes"]}>
        <Routes>
          <Route path="/clientes" element={<Clients />}>
            <Route index element={<ClientsOverviewPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Total de Clientes")).toBeInTheDocument();
    expect(screen.getByText("Ativos nesta pagina")).toBeInTheDocument();
    expect(screen.getByText("Faturamento na pagina")).toBeInTheDocument();
    expect(screen.getAllByText("Maria Silva").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Novo Cliente/i })).toBeInTheDocument();
    expect(screen.getByText("Pagina 1 de 3")).toBeInTheDocument();
  }, 10000);

  it("should open the client create dialog from the shared crud toolbar", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/clientes"]}>
        <Routes>
          <Route path="/clientes" element={<Clients />}>
            <Route index element={<ClientsOverviewPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: /Novo Cliente/i }));

    expect(screen.getByText("Novo Cliente")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Criar cliente/i })).toBeInTheDocument();
  });
});
