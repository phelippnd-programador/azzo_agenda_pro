import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProfessionalProfile from "@/pages/ProfessionalProfile";

const { getByIdMock } = vi.hoisted(() => ({
  getByIdMock: vi.fn(),
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {children}
    </div>
  ),
}));

vi.mock("@/contexts/MenuPermissionsContext", () => ({
  useMenuPermissions: () => ({
    canAccess: (route: string) => route.includes("/comissao"),
  }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    professionalsApi: {
      ...actual.professionalsApi,
      getById: getByIdMock,
    },
  };
});

describe("ProfessionalProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getByIdMock.mockResolvedValue({
      id: "prof-1",
      name: "Ana Profissional",
      email: "ana@qa.local",
      phone: "11999999999",
      isActive: true,
      specialties: ["Corte", "Coloracao"],
    });
  });

  it("should render professional profile data", async () => {
    render(
      <MemoryRouter initialEntries={["/profissionais/prof-1"]}>
        <Routes>
          <Route path="/profissionais/:id" element={<ProfessionalProfile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Perfil do Profissional" })).toBeInTheDocument();
    expect(screen.getAllByText("Ana Profissional").length).toBeGreaterThan(0);
    expect(screen.getByText("Comissao do profissional")).toBeInTheDocument();
    expect(screen.getByText("Corte, Coloracao")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
  });

  it("should show commission action when route is allowed", async () => {
    render(
      <MemoryRouter initialEntries={["/profissionais/prof-1"]}>
        <Routes>
          <Route path="/profissionais/:id" element={<ProfessionalProfile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("button", { name: /Configurar comissao/i })).toBeInTheDocument();
  });
});
