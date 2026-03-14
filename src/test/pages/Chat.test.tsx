import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ChatPage from "@/pages/Chat";

const mocks = vi.hoisted(() => ({
  loadConversations: vi.fn().mockResolvedValue(undefined),
  loadMessages: vi.fn().mockResolvedValue(undefined),
  sendMessage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/hooks/useChat", () => ({
  useChat: () => ({
    conversations: [
      {
        id: "conv-1",
        clientId: "client-1",
        clientName: "Maria Silva",
        clientPhoneMasked: "(11) 99999-0000",
        manualModeEnabled: true,
        lastMessagePreview: "Ola",
        updatedAt: "2026-03-14T10:00:00Z",
        unreadCount: 1,
      },
    ],
    messages: [
      {
        id: "msg-1",
        direction: "OUTBOUND",
        status: "FAILED",
        content: "Mensagem teste",
        createdAt: "2026-03-14T10:01:00Z",
      },
    ],
    isLoadingConversations: false,
    isLoadingMessages: false,
    isSending: false,
    loadConversations: mocks.loadConversations,
    loadMessages: mocks.loadMessages,
    sendMessage: mocks.sendMessage,
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
    allowedRoutes: ["/chat"],
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

describe("ChatPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: ((this: EventSource, ev: Event) => unknown) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should render selected conversation with manual mode and failed message status", async () => {
    render(
      <MemoryRouter initialEntries={["/chat/conv-1"]}>
        <Routes>
          <Route path="/chat/:conversationId" element={<ChatPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Modo Manual")).toBeInTheDocument();
    expect(screen.getAllByText("Maria Silva").length).toBeGreaterThan(0);
    expect(screen.getByText("Modo Manual")).toBeInTheDocument();
    expect(screen.getByText("Mensagem teste")).toBeInTheDocument();
    expect(screen.getByText("Falhou")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enviar/i })).toBeInTheDocument();
  });
});
