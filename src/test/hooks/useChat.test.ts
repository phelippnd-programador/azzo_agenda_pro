import { act, renderHook, waitFor } from "@testing-library/react";
import { useChat } from "@/hooks/useChat";
import type { ChatMessageListResponse } from "@/types/chat";

const mocks = vi.hoisted(() => ({
  listConversations: vi.fn(),
  listMessages: vi.fn(),
  markRead: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/api", () => ({
  chatApi: {
    listConversations: mocks.listConversations,
    listMessages: mocks.listMessages,
    markRead: mocks.markRead,
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function messagesResponse(overrides: Partial<ChatMessageListResponse> = {}): ChatMessageListResponse {
  return {
    items: [
      {
        id: "msg-1",
        conversationId: "conv-1",
        clientId: "client-1",
        direction: "INBOUND",
        content: "Ola",
        status: "READ",
        createdAt: "2026-03-14T10:00:00Z",
      },
    ],
    total: 1,
    page: 1,
    pageSize: 50,
    nextCursor: null,
    hasNext: false,
    ...overrides,
  };
}

describe("useChat", () => {
  beforeEach(() => {
    mocks.listConversations.mockReset();
    mocks.listMessages.mockReset();
    mocks.markRead.mockClear();
    mocks.listConversations.mockResolvedValue({
      items: [
        {
          id: "conv-1",
          clientId: "client-1",
          clientName: "Maria",
          channel: "WHATSAPP",
          appointmentMarker: "EM_ANDAMENTO",
          lastMessagePreview: "Ola",
          lastMessageAt: "2026-03-14T09:00:00Z",
          updatedAt: "2026-03-14T09:00:00Z",
          unreadCount: 1,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 50,
    });
  });

  it("chamar loadMessages duas vezes com a mesma resposta nao gera uma nova referencia de conversations (evita loop de recarga)", async () => {
    mocks.listMessages.mockResolvedValue(messagesResponse());

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.loadConversations();
    });

    await act(async () => {
      await result.current.loadMessages("conv-1");
    });

    const conversationsAfterFirstLoad = result.current.conversations;
    expect(mocks.markRead).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.loadMessages("conv-1", { background: true });
    });

    // Mesma referencia => nenhum re-render desnecessario disparado por
    // `conversations`/`selectedConversation` mudando de identidade sem que
    // nada tenha mudado de fato.
    expect(result.current.conversations).toBe(conversationsAfterFirstLoad);
  });

  it("loadMessages mantem uma identidade de funcao estavel entre chamadas (nao recria a cada troca de conversa)", async () => {
    mocks.listMessages.mockResolvedValue(messagesResponse());

    const { result } = renderHook(() => useChat());
    const firstReference = result.current.loadMessages;

    await act(async () => {
      await result.current.loadMessages("conv-1");
    });

    expect(result.current.loadMessages).toBe(firstReference);
  });

  it("atualiza a conversa quando o conteudo da ultima mensagem realmente muda", async () => {
    mocks.listMessages
      .mockResolvedValueOnce(messagesResponse())
      .mockResolvedValueOnce(
        messagesResponse({
          items: [
            {
              id: "msg-2",
              conversationId: "conv-1",
              clientId: "client-1",
              direction: "INBOUND",
              content: "Nova mensagem",
              status: "READ",
              createdAt: "2026-03-14T10:05:00Z",
            },
          ],
        })
      );

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.loadConversations();
      await result.current.loadMessages("conv-1");
    });

    const conversationsAfterFirstLoad = result.current.conversations;

    await act(async () => {
      await result.current.loadMessages("conv-1", { background: true });
    });

    expect(result.current.conversations).not.toBe(conversationsAfterFirstLoad);
    expect(result.current.conversations[0].lastMessagePreview).toBe("Nova mensagem");
  });

  it("usa um texto correto de fallback para mensagens sem conteudo (nao fala em 'expirado')", async () => {
    mocks.listMessages.mockResolvedValue(
      messagesResponse({
        items: [
          {
            id: "msg-1",
            conversationId: "conv-1",
            clientId: "client-1",
            direction: "INBOUND",
            content: null,
            status: "READ",
            createdAt: "2026-03-14T10:00:00Z",
          },
        ],
      })
    );

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.loadConversations();
      await result.current.loadMessages("conv-1");
    });

    await waitFor(() => {
      expect(result.current.conversations[0].lastMessagePreview).toBe("[Mensagem sem texto]");
    });
  });
});
