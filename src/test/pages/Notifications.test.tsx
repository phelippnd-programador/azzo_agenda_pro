import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Notifications from "@/pages/Notifications";

const { fetchAllMock, fetchNextPageMock, removeNotificationMock, clearAllNotificationsMock, markNotificationAsReadMock, markAllAsReadMock } = vi.hoisted(() => ({
  fetchAllMock: vi.fn(),
  fetchNextPageMock: vi.fn(),
  removeNotificationMock: vi.fn(),
  clearAllNotificationsMock: vi.fn(),
  markNotificationAsReadMock: vi.fn(),
  markAllAsReadMock: vi.fn(),
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div><h1>{title}</h1>{children}</div>
  ),
}));

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => ({
    notifications: [{
      id: "notif-1",
      message: "Lembrete enviado",
      status: "FAILED",
      channel: "WHATSAPP_DELIVERY_ERROR",
      destination: "+5511999999999",
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      viewed: false,
      viewedAt: null,
      errorMessage: "Token invalido",
    }],
    unreadCount: 1,
    loading: false,
    error: null,
    lastFetchAt: new Date().toISOString(),
    hasMore: false,
    currentFilters: { failedOnly: false, limit: 20 },
    fetchAll: fetchAllMock,
    fetchNextPage: fetchNextPageMock,
    removeNotification: removeNotificationMock,
    clearAllNotifications: clearAllNotificationsMock,
    markNotificationAsRead: markNotificationAsReadMock,
    markAllAsRead: markAllAsReadMock,
  }),
}));

describe("Notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllNotificationsMock.mockResolvedValue(true);
    removeNotificationMock.mockResolvedValue(true);
    markNotificationAsReadMock.mockResolvedValue(undefined);
  });

  it("should render notifications list and actions", async () => {
    render(
      <MemoryRouter initialEntries={["/notificacoes"]}>
        <Notifications />
      </MemoryRouter>
    );

    expect(await screen.findByText("Lista de notificações")).toBeInTheDocument();
    expect(screen.getAllByText("Lembrete enviado").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Marcar todas como lidas/i })).toBeInTheDocument();
  });

  it("should open notification details", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/notificacoes"]}>
        <Notifications />
      </MemoryRouter>
    );

    const detailButtons = await screen.findAllByRole("button", { name: /Ver detalhe da notificação/i });
    await user.click(detailButtons[0]);

    expect(await screen.findByText("Detalhes da notificação")).toBeInTheDocument();
    expect(screen.getByText("Erro de envio")).toBeInTheDocument();
  });
});
