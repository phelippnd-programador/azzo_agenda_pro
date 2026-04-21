import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageEmptyState, PageErrorState } from "@/components/ui/page-states";
import { useChat } from "@/hooks/useChat";
import type { ChatRealtimeEventPayload } from "@/types/chat";
import { chatMessageSchema, type ChatMessageForm } from "@/schemas/chat";
import { ChatSidebar, type ConversationFilter } from "@/components/chat/ChatSidebar";
import { ChatTimeline } from "@/components/chat/ChatTimeline";
import { ChatMessageComposer } from "@/components/chat/ChatMessageComposer";

export default function ChatPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [error, setError] = useState<string | null>(null);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [conversationQuery, setConversationQuery] = useState("");
  const [conversationFilter, setConversationFilter] = useState<ConversationFilter>("all");
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const activeConversationIdRef = useRef<string | undefined>(conversationId);
  const renderedConversationIdRef = useRef<string | undefined>(conversationId);
  const lastVisibleMessageIdRef = useRef<string | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const conversationsRefreshTimerRef = useRef<number | null>(null);
  const messagesRefreshTimerRef = useRef<number | null>(null);
  const form = useForm<ChatMessageForm>({
    resolver: zodResolver(chatMessageSchema),
    defaultValues: {
      message: "",
    },
  });
  const {
    conversations,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    loadConversations,
    loadMessages,
    sendMessage,
  } = useChat({ todayOnly: false, pageSize: 100 });
  const deferredConversationQuery = useDeferredValue(conversationQuery);
  const defaultConversation = conversations[0];

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === conversationId) ?? null,
    [conversations, conversationId]
  );

  const filteredConversations = useMemo(() => {
    const normalizedQuery = deferredConversationQuery.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const matchesQuery =
        !normalizedQuery ||
        (conversation.clientName || "").toLowerCase().includes(normalizedQuery) ||
        (conversation.clientPhoneMasked || "").toLowerCase().includes(normalizedQuery) ||
        (conversation.lastMessagePreview || "").toLowerCase().includes(normalizedQuery);

      if (!matchesQuery) return false;

      if (conversationFilter === "manual") {
        return Boolean(conversation.manualModeEnabled);
      }

      if (conversationFilter === "unread") {
        return (conversation.unreadCount || 0) > 0;
      }

      return true;
    });
  }, [conversationFilter, conversations, deferredConversationQuery]);

  useEffect(() => {
    loadConversations().catch(() => {
      setError("Nao foi possivel carregar o inbox do chat.");
    });
  }, [loadConversations]);

  useEffect(() => {
    if (isLoadingConversations) return;
    if (!conversations.length) return;
    if (conversationId && selectedConversation) return;
    const firstConversation = conversations[0];
    if (!firstConversation) return;
    navigate(`/chat/${firstConversation.id}`, { replace: true });
  }, [conversations, conversationId, isLoadingConversations, navigate, selectedConversation]);

  useEffect(() => {
    if (!conversationId || !selectedConversation) return;
    loadMessages(conversationId).catch(() => {
      setError("Nao foi possivel carregar a conversa selecionada.");
    });
  }, [conversationId, loadMessages, selectedConversation]);

  useEffect(() => {
    activeConversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    const apiBase =
      ((import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
        "http://localhost:8080/api/v1");
    const streamUrl = `${apiBase}/chat/stream`;
    const eventSource = new EventSource(streamUrl, { withCredentials: true });

    const scheduleConversationsRefresh = () => {
      if (conversationsRefreshTimerRef.current) return;
      conversationsRefreshTimerRef.current = window.setTimeout(() => {
        conversationsRefreshTimerRef.current = null;
        loadConversations({ background: true }).catch(() => null);
      }, 600);
    };

    const scheduleMessagesRefresh = (updatedConversationId: string) => {
      if (!updatedConversationId) return;
      if (messagesRefreshTimerRef.current) window.clearTimeout(messagesRefreshTimerRef.current);
      messagesRefreshTimerRef.current = window.setTimeout(() => {
        messagesRefreshTimerRef.current = null;
        loadMessages(updatedConversationId, { background: true }).catch(() => null);
      }, 220);
    };

    const handleChatUpdate = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as ChatRealtimeEventPayload;
        const updatedConversationId = payload.conversationId || null;
        const activeId = activeConversationIdRef.current || null;
        const isActiveConversation = Boolean(updatedConversationId && updatedConversationId === activeId);

        if (!updatedConversationId) {
          scheduleConversationsRefresh();
          return;
        }

        if (payload.type === "MARKER_UPDATED") {
          scheduleConversationsRefresh();
          return;
        }

        if (payload.type === "OUTBOUND_SENT" && isActiveConversation) {
          return;
        }

        if (isActiveConversation) {
          scheduleMessagesRefresh(updatedConversationId);
          return;
        }

        scheduleConversationsRefresh();
      } catch {
        scheduleConversationsRefresh();
      }
    };

    eventSource.addEventListener("chat-update", handleChatUpdate);
    eventSource.onerror = () => {
      // SSE reconecta automaticamente.
    };

    return () => {
      if (conversationsRefreshTimerRef.current) {
        window.clearTimeout(conversationsRefreshTimerRef.current);
      }
      if (messagesRefreshTimerRef.current) {
        window.clearTimeout(messagesRefreshTimerRef.current);
      }
      eventSource.removeEventListener("chat-update", handleChatUpdate);
      eventSource.close();
    };
  }, [loadConversations, loadMessages]);

  useLayoutEffect(() => {
    if (isLoadingMessages) return;
    const container = messagesContainerRef.current;
    if (!container) return;

    const latestMessageId = messages.at(-1)?.id ?? null;
    const conversationChanged = renderedConversationIdRef.current !== conversationId;
    const latestMessageChanged = latestMessageId !== lastVisibleMessageIdRef.current;

    if (conversationChanged || (latestMessageChanged && shouldAutoScrollRef.current)) {
      container.scrollTop = container.scrollHeight;
    }

    renderedConversationIdRef.current = conversationId;
    lastVisibleMessageIdRef.current = latestMessageId;
  }, [conversationId, isLoadingMessages, messages]);

  const appendEmoji = (emoji: string) => {
    const current = form.getValues("message") || "";
    form.setValue("message", `${current}${emoji}`, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setIsEmojiOpen(false);
  };

  const onSend = form.handleSubmit(async (values) => {
    if (!selectedConversation) return;
    const content = values.message.trim();
    try {
      await sendMessage(selectedConversation.clientId, content);
      form.reset({ message: "" });
    } catch {
      setError("Nao foi possivel enviar a mensagem.");
    }
  });

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceToBottom <= 48;
  };

  const handleReloadConversations = () => {
    setError(null);
    loadConversations().catch(() => {
      setError("Nao foi possivel carregar o inbox do chat.");
    });
  };

  if (error) {
    return (
      <MainLayout title="Chat" subtitle="Historico completo de conversas">
        <PageErrorState
          title="Falha ao carregar chat"
          description={error}
          action={{
            label: "Tentar novamente",
            onClick: handleReloadConversations,
          }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Chat" subtitle="Historico completo de mensagens por cliente">
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <ChatSidebar
          conversations={conversations}
          filteredConversations={filteredConversations}
          selectedConversationId={selectedConversation?.id}
          isLoading={isLoadingConversations}
          query={conversationQuery}
          onQueryChange={setConversationQuery}
          filter={conversationFilter}
          onFilterChange={setConversationFilter}
          onSelectConversation={(nextConversationId) => navigate(`/chat/${nextConversationId}`)}
          onReload={handleReloadConversations}
          onClearFilters={() => {
            setConversationQuery("");
            setConversationFilter("all");
          }}
        />

        <Card className="h-[calc(100vh-13rem)]">
          {!selectedConversation ? (
            <CardContent className="flex h-full items-center justify-center">
              <PageEmptyState
                title="Selecione uma conversa"
                description="Escolha um cliente no painel lateral para ver o historico completo e responder pelo inbox."
                action={
                  defaultConversation
                    ? {
                        label: "Abrir primeira conversa",
                        onClick: () => navigate(`/chat/${defaultConversation.id}`),
                      }
                    : undefined
                }
              />
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      {selectedConversation.clientName || "Cliente"}
                    </CardTitle>
                    <p className="truncate text-sm text-muted-foreground">
                      {selectedConversation.clientPhoneMasked || "Sem telefone"}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Badge variant="outline" className="shrink-0">
                      {messages.length} mensagens
                    </Badge>
                    {selectedConversation.manualModeEnabled ? (
                      <Badge variant="outline" className="shrink-0 border-amber-400 text-amber-600">
                        Modo Manual
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex h-[calc(100%-9rem)] flex-col">
                <ChatTimeline
                  messages={messages}
                  isLoading={isLoadingMessages}
                  onFocusComposer={() => form.setFocus("message")}
                  containerRef={messagesContainerRef}
                  onScroll={handleMessagesScroll}
                />
                <ChatMessageComposer
                  form={form}
                  isSending={isSending}
                  isEmojiOpen={isEmojiOpen}
                  onEmojiOpenChange={setIsEmojiOpen}
                  onAppendEmoji={appendEmoji}
                  onSubmit={onSend}
                />
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
