import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Specialties from "@/pages/Specialties";
import SpecialtiesOverviewPage from "@/pages/specialties/SpecialtiesOverviewPage";

vi.mock("@/hooks/useSpecialties", () => ({
  useSpecialties: () => ({
    specialties: [
      {
        id: "specialty-1",
        name: "Coloracao",
        description: "Procedimentos tecnicos de coloracao",
      },
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    createSpecialty: vi.fn(),
    updateSpecialty: vi.fn(),
    deleteSpecialty: vi.fn(),
    deleteSelectedSpecialties: vi.fn(),
    deleteAllSpecialties: vi.fn(),
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
    allowedRoutes: ["/especialidades"],
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

describe("Specialties", () => {
  it("should render specialties page with view mode toggle", () => {
    render(
      <MemoryRouter initialEntries={["/especialidades"]}>
        <Routes>
          <Route path="/especialidades" element={<Specialties />}>
            <Route index element={<SpecialtiesOverviewPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Coloracao")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Nova Especialidade/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Visualizar especialidades em cards" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Visualizar especialidades em lista" })
    ).toBeInTheDocument();
  });
});
