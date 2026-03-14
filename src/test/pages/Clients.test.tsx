import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Clients from "@/pages/Clients";

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
    pagination: { page: 1, limit: 20, total: 1, hasMore: false },
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
  it("should render client metrics and new client action", async () => {
    render(
      <MemoryRouter initialEntries={["/clientes"]}>
        <Clients />
      </MemoryRouter>
    );

    expect(await screen.findByText("Total de Clientes")).toBeInTheDocument();
    expect(screen.getAllByText("Maria Silva").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Novo Cliente/i })).toBeInTheDocument();
  });
});
