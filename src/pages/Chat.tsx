import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageEmptyState, PageErrorState } from "@/components/ui/page-states";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircleMore, SendHorizontal, Smile } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import type { ChatMessage } from "@/types/chat";
import { ChatConversationCard } from "@/components/chat/ChatConversationCard";
import { chatMessageSchema, type ChatMessageForm } from "@/schemas/chat";

const messageStatusVariant = (message: ChatMessage) => {
  if (message.status === "FAILED") return "destructive" as const;
  if (message.status === "READ") return "default" as const;
  return "secondary" as const;
};

const MESSAGE_STATUS_LABELS: Record<ChatMessage["status"], string> = {
  QUEUED: "Na fila",
  SENT: "Enviado",
  DELIVERED: "Entregue",
  READ: "Lido",
  FAILED: "Falhou",
};

const EMOJI_OPTIONS = [
  "\u{1F600}",
  "\u{1F601}",
  "\u{1F602}",
  "\u{1F609}",
  "\u{1F60A}",
  "\u{1F60D}",
  "\u{1F91D}",
  "\u{1F44F}",
  "\u{1F64F}",
  "\u{1F44D}",
  "\u{2764}\u{FE0F}",
  "\u{1F389}",
  "\u{2728}",
  "\u{1F4C5}",
  "\u{1F487}\u{200D}\u{2640}\u{FE0F}",
  "\u{1F485}",
];

export default function ChatPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [error, setError] = useState<string | null>(null);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const activeConversationIdRef = useRef<string | undefined>(conversationId);
  const renderedConversationIdRef = useRef<string | undefined>(conversationId);
  const lastVisibleMessageIdRef = useRef<string | null>(null);
  const shouldAutoScrollRef = useRef(true);
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
  } = useChat({ todayOnly: true, pageSize: 100 });

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === conversationId) ?? null,
    [conversations, conversationId]
  );

  useEffect(() => {
    loadConversations().catch(() => {
      setError("Nao foi possivel carregar o inbox do chat.");
    });
  }, [loadConversations]);

  useEffect(() => {
    if (isLoadingConversations) return;
    if (!conversations.length) return;
    if (conversationId && selectedConversation) {
      loadMessages(conversationId).catch(() => {
        setError("Nao foi possivel carregar a conversa selecionada.");
      });
      return;
    }
    const firstConversation = conversations[0];
    if (!firstConversation) return;
    navigate(`/chat/${firstConversation.id}`, { replace: true });
  }, [
    conversations,
    conversationId,
    isLoadingConversations,
    loadMessages,
    navigate,
    selectedConversation,
  ]);

  useEffect(() => {
    activeConversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    const apiBase =
      ((import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
        "http://localhost:8080/api/v1");
    const streamUrl = `${apiBase}/chat/stream`;
    const eventSource = new EventSource(streamUrl, { withCredentials: true });
    let refreshTimer: number | null = null;

    const scheduleRefresh = (updatedConversationId?: string | null) => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        loadConversations().catch(() => null);
        const activeId = activeConversationIdRef.current;
        if (activeId && (!updatedConversationId || updatedConversationId === activeId)) {
          loadMessages(activeId).catch(() => null);
        }
      }, 250);
    };

    const handleChatUpdate = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as { conversationId?: string };
        scheduleRefresh(payload.conversationId || null);
      } catch {
        scheduleRefresh();
      }
    };

    eventSource.addEventListener("chat-update", handleChatUpdate);
    eventSource.onerror = () => {
      // SSE reconecta automaticamente.
    };

    return () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
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

  const watchedMessage = form.watch("message");

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

  if (error) {
    return (
      <MainLayout title="Chat" subtitle="Conversas do dia">
        <PageErrorState
          title="Falha ao carregar chat"
          description={error}
          action={{
            label: "Tentar novamente",
            onClick: () => {
              setError(null);
              loadConversations().catch(() => {
                setError("Nao foi possivel carregar o inbox do chat.");
              });
            },
          }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Chat" subtitle="Mensagens do dia por cliente">
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="h-[calc(100vh-13rem)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircleMore className="w-4 h-4" />
              Conversas de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 overflow-y-auto h-[calc(100%-4.25rem)] pr-1">
            {isLoadingConversations ? (
              <>
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </>
            ) : conversations.length === 0 ? (
              <PageEmptyState
                title="Sem conversas hoje"
                description="Assim que houver mensagens no WhatsApp, elas aparecem aqui."
              />
            ) : (
              conversations.map((conversation) => {
                const isSelected = conversation.id === selectedConversation?.id;
                return (
                  <ChatConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    selected={isSelected}
                    onClick={() => navigate(`/chat/${conversation.id}`)}
                  />
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="h-[calc(100vh-13rem)]">
          {!selectedConversation ? (
            <CardContent className="h-full flex items-center justify-center">
              <PageEmptyState
                title="Selecione uma conversa"
                description="Escolha um cliente no painel lateral para ver as mensagens."
              />
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">
                      {selectedConversation.clientName || "Cliente"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedConversation.clientPhoneMasked || "Sem telefone"}
                    </p>
                  </div>
                  {selectedConversation.manualModeEnabled ? (
                    <Badge variant="outline" className="shrink-0 text-amber-600 border-amber-400">
                      Modo Manual
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="h-[calc(100%-9rem)] flex flex-col">
                <div
                  ref={messagesContainerRef}
                  onScroll={handleMessagesScroll}
                  className="flex-1 overflow-y-auto pr-1 space-y-3 py-3"
                >
                  {isLoadingMessages ? (
                    <>
                      <Skeleton className="h-14 w-2/3" />
                      <Skeleton className="h-14 w-2/3 ml-auto" />
                    </>
                  ) : messages.length === 0 ? (
                    <PageEmptyState
                      title="Sem mensagens nesta conversa"
                      description="Envie uma mensagem para iniciar o atendimento."
                    />
                  ) : (
                    <>
                      {messages.map((message) => {
                        const isOutbound = message.direction === "OUTBOUND";
                        return (
                          <div
                            key={message.id}
                            className={`max-w-[80%] rounded-2xl p-3 border ${
                              isOutbound
                                ? "ml-auto bg-primary/10 border-primary/20"
                                : "bg-muted/40 border-border"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {message.content || "[Conteudo expirado]"}
                            </p>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="text-[11px] text-muted-foreground">
                                {formatDateTime(message.createdAt)}
                              </span>
                              <Badge variant={messageStatusVariant(message)}>
                                {MESSAGE_STATUS_LABELS[message.status] ?? message.status}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                <form onSubmit={onSend} className="pt-3 border-t flex gap-2">
                  <Input
                    {...form.register("message")}
                    placeholder="Digite a mensagem para o cliente..."
                    maxLength={2000}
                    disabled={isSending}
                  />
                  <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" size="icon" disabled={isSending} aria-label="Selecionar emoji">
                        <Smile className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-56 p-2">
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="h-7 w-7 rounded hover:bg-accent text-base"
                            onClick={() => appendEmoji(emoji)}
                            aria-label={`Inserir ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button type="submit" disabled={isSending || !(watchedMessage || "").trim()}>
                    <SendHorizontal className="w-4 h-4 mr-2" />
                    Enviar
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
