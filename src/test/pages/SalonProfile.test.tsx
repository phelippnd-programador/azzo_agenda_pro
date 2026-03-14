import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SalonProfile from "@/pages/SalonProfile";

const { getProfileMock, updateProfileMock, getAddressByCepMock, toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  getProfileMock: vi.fn(),
  updateProfileMock: vi.fn(),
  getAddressByCepMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children, title }: { children: React.ReactNode; title: string }) => <div><h1>{title}</h1>{children}</div>,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "owner-1", salonName: "Salao QA", email: "owner@qa.local", phone: "11999999999" },
  }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    salonApi: {
      ...actual.salonApi,
      getProfile: getProfileMock,
      updateProfile: updateProfileMock,
    },
    utilsApi: {
      ...actual.utilsApi,
      getAddressByCep: getAddressByCepMock,
    },
  };
});

vi.mock("sonner", () => ({ toast: { success: toastSuccessMock, error: toastErrorMock } }));

describe("SalonProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProfileMock.mockResolvedValue({
      salonName: "Salao QA",
      salonSlug: "salao-qa",
      publicBookingUrl: "https://qa.local/agendar/salao-qa",
      salonDescription: "Descricao",
      salonPhone: "11999999999",
      salonWhatsapp: "11988888888",
      salonCpfCnpj: "12345678901",
      salonEmail: "contato@qa.local",
      salonWebsite: "https://qa.local",
      salonInstagram: "@qa",
      salonFacebook: "qa-page",
      street: "Rua A",
      number: "123",
      neighborhood: "Centro",
      city: "Sao Paulo",
      state: "SP",
      zipCode: "01001-000",
      businessHours: [],
    });
    updateProfileMock.mockResolvedValue({ publicBookingUrl: "https://qa.local/agendar/salao-qa" });
    getAddressByCepMock.mockResolvedValue({ street: "Rua A", neighborhood: "Centro", city: "Sao Paulo", state: "SP", complement: "Sala 1" });
  });

  it("should render salon profile and booking link", async () => {
    render(
      <MemoryRouter initialEntries={["/perfil-salao"]}>
        <SalonProfile />
      </MemoryRouter>
    );

    expect(await screen.findByText("Link de Agendamento Publico")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Salao QA")).toBeInTheDocument();
  });

  it("should save salon profile", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/perfil-salao"]}>
        <SalonProfile />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: /Salvar Alteracoes/i }));

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalled();
    });
    expect(toastSuccessMock).toHaveBeenCalled();
  });
});
