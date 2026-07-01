import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Services from "@/pages/Services";
import ServicesOverviewPage from "@/pages/services/ServicesOverviewPage";

const { createServiceMock } = vi.hoisted(() => ({
  createServiceMock: vi.fn(),
}));

vi.mock("@/hooks/useServices", () => ({
  useServices: () => ({
    services: [
      {
        id: "svc-1",
        name: "Corte Feminino",
        description: "Corte com finalizacao",
        duration: 60,
        price: 80,
        category: "Cabelo",
        professionalIds: [],
        isActive: true,
      },
    ],
    pagination: { page: 1, limit: 20, total: 41, hasMore: true },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    goToPage: vi.fn(),
    createService: createServiceMock,
    updateService: vi.fn(),
    deleteService: vi.fn(),
    deleteSelectedServices: vi.fn(),
    deleteAllServices: vi.fn(),
  }),
}));

vi.mock("@/hooks/useProfessionals", () => ({
  useProfessionals: () => ({
    professionals: [{ id: "pro-1", name: "Ana Costa", isActive: true }],
    isLoading: false,
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
    allowedRoutes: ["/servicos"],
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

describe("Services", () => {
  beforeEach(() => {
    createServiceMock.mockReset();
    createServiceMock.mockResolvedValue(undefined);
  });

  it("should render services list and category filters", async () => {
    render(
      <MemoryRouter initialEntries={["/servicos"]}>
        <Routes>
          <Route path="/servicos" element={<Services />}>
            <Route index element={<ServicesOverviewPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Corte Feminino")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Novo Servi/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cabelo" })).toBeInTheDocument();
    expect(screen.getByText("Pagina 1 de 3")).toBeInTheDocument();
    expect(screen.getAllByRole("button").length).toBeGreaterThan(2);
  }, 10000);

  it("should open the service create dialog with the shared submit pattern", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/servicos"]}>
        <Routes>
          <Route path="/servicos" element={<Services />}>
            <Route index element={<ServicesOverviewPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: /Novo servico/i }));

    expect(screen.getAllByText("Novo servico").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Criar servico/i })).toBeInTheDocument();
  }, 10000);

  it("should preserve Brazilian thousands and decimal separators when creating a service", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/servicos"]}>
        <Routes>
          <Route path="/servicos" element={<Services />}>
            <Route index element={<ServicesOverviewPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: /Novo servico/i }));
    await user.type(screen.getByPlaceholderText("Ex: Corte Feminino"), "Escova Premium");
    await user.clear(screen.getByPlaceholderText("60"));
    await user.type(screen.getByPlaceholderText("60"), "90");
    await user.clear(screen.getByPlaceholderText("0,00"));
    await user.type(screen.getByPlaceholderText("0,00"), "1.000,00");
    await user.click(screen.getByRole("button", { name: /Criar servico/i }));

    expect(createServiceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Escova Premium",
        duration: 90,
        price: 1000,
      })
    );
  });

  it("should show inline validation for required service fields", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/servicos"]}>
        <Routes>
          <Route path="/servicos" element={<Services />}>
            <Route index element={<ServicesOverviewPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: /Novo servico/i }));
    await user.clear(screen.getByPlaceholderText("60"));
    await user.clear(screen.getByPlaceholderText("0,00"));
    await user.click(screen.getByRole("button", { name: /Criar servico/i }));

    expect(screen.getByText("Informe o nome do servico.")).toBeInTheDocument();
    expect(screen.getByText("Informe uma duracao valida em minutos.")).toBeInTheDocument();
    expect(screen.getByText("Informe um preco maior que zero.")).toBeInTheDocument();
    expect(createServiceMock).not.toHaveBeenCalled();
  });
});
