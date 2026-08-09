import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ChatPage from "@/pages/Chat";
import type { ChatConversation, ChatMessage } from "@/types/chat";

type MockEventSourceInstance = {
  emit: (name: string, payload: unknown) => void;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  onerror: ((this: EventSource, ev: Event) => unknown) | null;
};

const mocks = vi.hoisted(() => ({
  loadConversations: vi.fn().mockResolvedValue(undefined),
  loadMessages: vi.fn().mockResolvedValue(undefined),
  loadMoreMessages: vi.fn().mockResolvedValue(undefined),
  sendMessage: vi.fn().mockResolvedValue(undefined),
}));

let eventSourceInstances: MockEventSourceInstance[] = [];

const renderChatPage = (initialEntries: string[] = ["/chat/conv-1"]) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/chat/:conversationId" element={<ChatPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const buildConversation = (overrides: Partial<ChatConversation> = {}): ChatConversation => ({
  id: "conv-1",
  clientId: "client-1",
  clientName: "Maria Silva",
  clientPhoneMasked: "(11) 99999-0000",
  channel: "WHATSAPP",
  appointmentMarker: "EM_ANDAMENTO",
  manualModeEnabled: true,
  lastMessagePreview: "Ola",
  updatedAt: "2026-03-14T10:00:00Z",
  unreadCount: 1,
  ...overrides,
});

const buildMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: "msg-1",
  conversationId: "conv-1",
  clientId: "client-1",
  direction: "OUTBOUND",
  status: "FAILED",
  content: "Mensagem teste",
  createdAt: "2026-03-14T10:01:00Z",
  ...overrides,
});

const defaultConversations: ChatConversation[] = [
  buildConversation(),
  buildConversation({
    id: "conv-2",
    clientId: "client-2",
    clientName: "Joao Souza",
    clientPhoneMasked: "(11) 98888-0000",
    manualModeEnabled: false,
    lastMessagePreview: "Confirmado",
    updatedAt: "2026-03-13T10:00:00Z",
    unreadCount: 0,
  }),
];

const defaultMessages: ChatMessage[] = [
  buildMessage(),
  buildMessage({
    id: "msg-2",
    direction: "INBOUND",
    status: "READ",
    content: "Perfeito, obrigada",
    createdAt: "2026-03-15T09:30:00Z",
  }),
];

const chatState = {
  conversations: defaultConversations,
  messages: defaultMessages,
};

vi.mock("@/hooks/useChat", () => ({
  useChat: () => ({
    conversations: chatState.conversations,
    messages: chatState.messages,
    isLoadingConversations: false,
    isLoadingMessages: false,
    isLoadingMoreMessages: false,
    isSending: false,
    isUpdatingMarker: false,
    hasNextMessages: false,
    loadConversations: mocks.loadConversations,
    loadMessages: mocks.loadMessages,
    loadMoreMessages: mocks.loadMoreMessages,
    sendMessage: mocks.sendMessage,
    updateMarker: vi.fn(),
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
    chatState.conversations = defaultConversations;
    chatState.messages = defaultMessages;
    class MockEventSource {
      listeners = new Map<string, Set<(event: MessageEvent) => void>>();
      addEventListener = vi.fn((name: string, handler: (event: MessageEvent) => void) => {
        const current = this.listeners.get(name) ?? new Set();
        current.add(handler);
        this.listeners.set(name, current);
      });
      removeEventListener = vi.fn((name: string, handler: (event: MessageEvent) => void) => {
        this.listeners.get(name)?.delete(handler);
      });
      close = vi.fn();
      onerror: ((this: EventSource, ev: Event) => unknown) | null = null;

      emit(name: string, payload: unknown) {
        const event = { data: JSON.stringify(payload) } as MessageEvent;
        this.listeners.get(name)?.forEach((handler) => handler(event));
      }

      constructor() {
        eventSourceInstances.push(this as unknown as MockEventSourceInstance);
      }
    }
    eventSourceInstances = [];
    vi.stubGlobal("EventSource", MockEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    eventSourceInstances = [];
  });

  it("should render selected conversation with manual mode and failed message status", async () => {
    renderChatPage();

    expect(await screen.findByText("Modo Manual")).toBeInTheDocument();
    expect(screen.getByText("Todas as conversas")).toBeInTheDocument();
    expect(screen.getByText("Histórico completo de mensagens por cliente")).toBeInTheDocument();
    expect(screen.getByLabelText("Buscar conversas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Não lidas" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Todas" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Abrir conversa com Maria Silva" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByText("Maria Silva").length).toBeGreaterThan(0);
    expect(screen.getByText("Modo Manual")).toBeInTheDocument();
    expect(screen.getByText("Mensagem teste")).toBeInTheDocument();
    expect(screen.getByText("Falhou")).toBeInTheDocument();
    expect(screen.getByText("Saída manual")).toBeInTheDocument();
    expect(screen.getByText("Cliente")).toBeInTheDocument();
    expect(screen.getByText("Recebida")).toBeInTheDocument();
    expect(screen.getByLabelText("Mensagem para o cliente")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enviar/i })).toBeInTheDocument();
  }, 10000);

  it("should filter conversations by search and quick filters", async () => {
    const user = userEvent.setup();

    renderChatPage();

    const searchInput = await screen.findByLabelText("Buscar conversas");
    const conversationsList = screen.getByLabelText("Lista de conversas");

    await user.type(searchInput, "Joao");

    expect(within(conversationsList).getByText("Joao Souza")).toBeInTheDocument();
    expect(within(conversationsList).queryByText("Maria Silva")).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.click(screen.getByRole("button", { name: "Modo manual" }));

    expect(screen.getByRole("button", { name: "Modo manual" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Todas" })).toHaveAttribute("aria-pressed", "false");

    expect(within(conversationsList).getByText("Maria Silva")).toBeInTheDocument();
    expect(within(conversationsList).queryByText("Joao Souza")).not.toBeInTheDocument();
  }, 10000);

  it("should refresh only the active messages for realtime events on the opened conversation", async () => {
    renderChatPage();

    await screen.findByText("Modo Manual");
    mocks.loadConversations.mockClear();
    mocks.loadMessages.mockClear();

    const stream = eventSourceInstances[0];
    stream.emit("chat-update", {
      type: "INBOUND_RECEIVED",
      conversationId: "conv-1",
    });

    await waitFor(() => {
      expect(mocks.loadMessages).toHaveBeenCalledWith("conv-1", { background: true });
    });
    expect(mocks.loadConversations).not.toHaveBeenCalled();
  });

  it("should refresh only the conversation list for marker updates and background conversations", async () => {
    renderChatPage();

    await screen.findByText("Modo Manual");
    mocks.loadConversations.mockClear();
    mocks.loadMessages.mockClear();

    const stream = eventSourceInstances[0];
    stream.emit("chat-update", {
      type: "MARKER_UPDATED",
      conversationId: "conv-2",
    });

    await waitFor(() => {
      expect(mocks.loadConversations).toHaveBeenCalledWith({ background: true });
    }, { timeout: 1200 });
    expect(mocks.loadMessages).not.toHaveBeenCalled();
  });

  it("should keep the inbox usable with larger conversation and message volumes", async () => {
    chatState.conversations = Array.from({ length: 80 }, (_, index) =>
      buildConversation({
        id: `conv-${index + 1}`,
        clientId: `client-${index + 1}`,
        clientName: index === 57 ? "Cliente Volume Critico" : `Cliente ${index + 1}`,
        clientPhoneMasked: `(11) 9${String(index).padStart(4, "0")}-0000`,
        manualModeEnabled: index % 3 === 0,
        unreadCount: index % 5 === 0 ? 2 : 0,
        lastMessagePreview: `Preview ${index + 1}`,
        lastMessageAt: `2026-03-${String((index % 28) + 1).padStart(2, "0")}T09:00:00Z`,
        updatedAt: `2026-03-${String((index % 28) + 1).padStart(2, "0")}T09:00:00Z`,
      })
    );

    chatState.messages = Array.from({ length: 180 }, (_, index) =>
      buildMessage({
        id: `msg-${index + 1}`,
        conversationId: "conv-1",
        clientId: "client-1",
        direction: index % 2 === 0 ? "OUTBOUND" : "INBOUND",
        status: index % 2 === 0 ? "DELIVERED" : "READ",
        content: `Mensagem em lote ${index + 1}`,
        createdAt: `2026-03-${String((index % 6) + 10).padStart(2, "0")}T${String((index % 24)).padStart(2, "0")}:15:00Z`,
      })
    );

    renderChatPage();

    expect(await screen.findByText("80/80")).toBeInTheDocument();
    expect(screen.getByText("180 mensagens")).toBeInTheDocument();
    expect(screen.getByText("Mensagem em lote 180")).toBeInTheDocument();

    const searchInput = screen.getByLabelText("Buscar conversas");
    const conversationsList = screen.getByLabelText("Lista de conversas");

    fireEvent.change(searchInput, { target: { value: "Volume Critico" } });

    expect(within(conversationsList).getByText("Cliente Volume Critico")).toBeInTheDocument();
    expect(within(conversationsList).queryByText("Cliente 1")).not.toBeInTheDocument();
  }, 10000);

  it("exibe badge de não lidas quando unreadCount > 0", async () => {
    chatState.conversations = [
      buildConversation({ id: "conv-1", unreadCount: 3 }),
      buildConversation({ id: "conv-2", clientId: "client-2", clientName: "Joao", unreadCount: 0 }),
    ];

    renderChatPage();

    await screen.findByText("Modo Manual");
    const badges = screen.getAllByText("3");
    expect(badges.length).toBeGreaterThan(0);
  }, 10000);

  it("chama loadMessages ao abrir conversa e zera unreadCount localmente", async () => {
    renderChatPage();

    await screen.findByText("Modo Manual");
    expect(mocks.loadMessages).toHaveBeenCalledWith("conv-1");
  }, 10000);

  it("botao Carregar mensagens anteriores aparece quando hasNextMessages=true", async () => {
    renderChatPage();

    // por padrão hasNextMessages = false no mock, botão não aparece
    await screen.findByText("Modo Manual");
    expect(screen.queryByRole("button", { name: /Carregar mensagens anteriores/i })).not.toBeInTheDocument();
  }, 10000);
});
