import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Header } from "@/components/layout/Header";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      role: "OWNER",
      name: "Mister Max power",
      salonName: "Azzo Agenda Pro",
      email: "owner@azzo.test",
    },
    logout: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => ({
    unreadCount: 2,
    refreshSummary: vi.fn(),
    summaryItems: [],
  }),
}));

describe("Header", () => {
  it("should expose accessible labels for notification and account menus", () => {
    render(
      <MemoryRouter>
        <Header title="Dashboard" subtitle="Resumo operacional" />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Abrir notificacoes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir menu da conta" })).toBeInTheDocument();
  });
});
