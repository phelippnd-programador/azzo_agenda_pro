import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Professionals from "@/pages/Professionals";

const canAccessMock = vi.fn((path: string) => path === "/financeiro/comissoes");

vi.mock("@/hooks/useProfessionals", () => ({
  useProfessionals: () => ({
    professionals: [
      {
        id: "pro-1",
        name: "Ana Costa",
        email: "ana@qa.local",
        phone: "(11) 99999-0000",
        specialties: ["Cabelo"],
        isActive: true,
        workingHours: [],
      },
    ],
    professionalLimits: { currentCount: 1, maxProfessionals: 3, canCreate: true },
    pagination: { page: 1, limit: 20, total: 41, hasMore: true },
    isLoading: false,
    isLimitsLoading: false,
    error: null,
    refetch: vi.fn(),
    goToPage: vi.fn(),
    createProfessional: vi.fn(),
    updateProfessional: vi.fn(),
    deleteProfessional: vi.fn(),
    resetProfessionalPassword: vi.fn(),
  }),
}));

vi.mock("@/hooks/useSpecialties", () => ({
  useSpecialties: () => ({
    specialties: [{ id: "sp-1", name: "Cabelo" }],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
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
    allowedRoutes: ["/profissionais"],
    menuItems: [],
    hasRoutePermission: () => true,
    canAccess: canAccessMock,
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

describe("Professionals", () => {
  beforeEach(() => {
    canAccessMock.mockImplementation((path: string) => path === "/financeiro/comissoes");
  });

  it("should render professional list and new professional action", async () => {
    render(
      <MemoryRouter initialEntries={["/profissionais"]}>
        <Professionals />
      </MemoryRouter>
    );

    expect(await screen.findByText("Comissao por profissional")).toBeInTheDocument();
    expect(screen.getByText(/Financeiro > Comissoes/i)).toBeInTheDocument();
    expect(screen.getAllByText("Ana Costa").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Novo Profissional/i })).toBeInTheDocument();
    expect(screen.getByText("Pagina 1 de 3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Visualizar profissionais em cards" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Visualizar profissionais em lista" })
    ).toBeInTheDocument();
  }, 10000);

  it("should hide financial commissions guidance when route is not allowed", async () => {
    canAccessMock.mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={["/profissionais"]}>
        <Professionals />
      </MemoryRouter>
    );

    expect(await screen.findByText("Comissao por profissional")).toBeInTheDocument();
    expect(screen.queryByText(/Financeiro > Comissoes/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Use o perfil do profissional/i)).toBeInTheDocument();
  });

  it("should open the professional create dialog with consistent action labels", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/profissionais"]}>
        <Professionals />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: /Novo Profissional/i }));

    expect(screen.getByText("Novo Profissional")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Criar profissional/i })).toBeInTheDocument();
  }, 10000);
});
