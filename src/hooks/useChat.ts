import { useCallback, useState } from "react";
import { chatApi } from "@/lib/api";
import type {
  ChatAppointmentMarker,
  ChatConversation,
  ChatMessage,
} from "@/types/chat";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";

type UseChatOptions = {
  pageSize?: number;
  todayOnly?: boolean;
};

export function useChat(options: UseChatOptions = {}) {
  const pageSize = options.pageSize ?? 50;
  const todayOnly = options.todayOnly ?? true;
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingMarker, setIsUpdatingMarker] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      const response = await chatApi.listConversations({ page: 1, pageSize, todayOnly });
      setConversations(response.items || []);
    } catch (err) {
      const uiError = resolveUiError(err, "Erro ao carregar conversas do chat");
      toast.error(uiError.message);
      throw err;
    } finally {
      setIsLoadingConversations(false);
    }
  }, [pageSize, todayOnly]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) {
      setActiveConversationId(null);
      setMessages([]);
      return;
    }
    try {
      const isConversationChanged = activeConversationId !== conversationId;
      setActiveConversationId(conversationId);
      setIsLoadingMessages(true);
      if (isConversationChanged) {
        setMessages([]);
      }
      const response = await chatApi.listMessages(conversationId, { page: 1, pageSize: 200 });
      setMessages(response.items || []);
    } catch (err) {
      const uiError = resolveUiError(err, "Erro ao carregar mensagens da conversa");
      toast.error(uiError.message);
      throw err;
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeConversationId]);

  const sendMessage = useCallback(
    async (clientId: string, content: string) => {
      try {
        setIsSending(true);
        const response = await chatApi.sendMessage({ clientId, content });
        const nowIso = new Date().toISOString();

        setConversations((prev) => {
          const next = prev.map((conversation) =>
            conversation.clientId === clientId
              ? {
                  ...conversation,
                  lastMessagePreview: content,
                  lastMessageAt: nowIso,
                  updatedAt: nowIso,
                }
              : conversation
          );
          next.sort((a, b) => {
            const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return bTime - aTime;
          });
          return next;
        });

        setMessages((prev) => [
          ...prev,
          {
            id: response.messageId,
            conversationId: response.conversationId,
            clientId,
            direction: "OUTBOUND",
            content,
            status: response.status,
            createdAt: nowIso,
            sentAt: nowIso,
          },
        ]);
        return response;
      } catch (err) {
        const uiError = resolveUiError(err, "Erro ao enviar mensagem");
        toast.error(uiError.message);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    []
  );

  const updateMarker = useCallback(
    async (conversationId: string, marker: ChatAppointmentMarker) => {
      try {
        setIsUpdatingMarker(true);
        const response = await chatApi.updateAppointmentMarker(conversationId, marker);
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === response.conversationId
              ? { ...conversation, appointmentMarker: response.appointmentMarker, updatedAt: response.updatedAt }
              : conversation
          )
        );
        return response;
      } catch (err) {
        const uiError = resolveUiError(err, "Erro ao atualizar marcador da conversa");
        toast.error(uiError.message);
        throw err;
      } finally {
        setIsUpdatingMarker(false);
      }
    },
    []
  );

  return {
    conversations,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    isUpdatingMarker,
    loadConversations,
    loadMessages,
    sendMessage,
    updateMarker,
  };
}

