import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageEmptyState, PageErrorState } from "@/components/ui/page-states";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircleMore, SendHorizontal } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import type { ChatAppointmentMarker, ChatMessage } from "@/types/chat";

const MARKER_LABELS: Record<ChatAppointmentMarker, string> = {
  NAO_INICIADO: "Nao iniciado",
  EM_ANDAMENTO: "Em andamento",
  PAUSADO: "Pausado",
  CONCLUIDO: "Concluido",
  NAO_COMPARECEU: "Nao compareceu",
  CANCELADO: "Cancelado",
};

const MARKER_ORDER: ChatAppointmentMarker[] = [
  "NAO_INICIADO",
  "EM_ANDAMENTO",
  "PAUSADO",
  "CONCLUIDO",
  "NAO_COMPARECEU",
  "CANCELADO",
];

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const messageStatusVariant = (message: ChatMessage) => {
  if (message.status === "FAILED") return "destructive" as const;
  if (message.status === "READ") return "default" as const;
  return "secondary" as const;
};

export default function ChatPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [draftMessage, setDraftMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const {
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

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedConversation) return;
    const content = draftMessage.trim();
    if (!content) return;
    try {
      await sendMessage(selectedConversation.clientId, content);
      setDraftMessage("");
      await Promise.all([
        loadConversations(),
        loadMessages(selectedConversation.id),
      ]);
    } catch {
      setError("Nao foi possivel enviar a mensagem.");
    }
  };

  const handleMarkerChange = async (value: string) => {
    if (!selectedConversation) return;
    const nextMarker = value as ChatAppointmentMarker;
    try {
      await updateMarker(selectedConversation.id, nextMarker);
      await loadConversations();
    } catch {
      setError("Nao foi possivel atualizar o marcador da conversa.");
    }
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
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="h-[calc(100vh-13rem)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircleMore className="w-4 h-4" />
              Conversas de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 overflow-y-auto h-[calc(100%-5rem)] pr-1">
            {isLoadingConversations ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
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
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => navigate(`/chat/${conversation.id}`)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {conversation.clientName || "Cliente"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.clientPhoneMasked || "Sem telefone"}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 ? (
                        <Badge variant="secondary">{conversation.unreadCount}</Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                      {conversation.lastMessagePreview || "Sem ultima mensagem."}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDateTime(conversation.lastMessageAt)}
                    </p>
                  </button>
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
                  <Select
                    value={selectedConversation.appointmentMarker}
                    onValueChange={handleMarkerChange}
                    disabled={isUpdatingMarker}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Marcador" />
                    </SelectTrigger>
                    <SelectContent>
                      {MARKER_ORDER.map((marker) => (
                        <SelectItem key={marker} value={marker}>
                          {MARKER_LABELS[marker]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="h-[calc(100%-9rem)] flex flex-col">
                <div className="flex-1 overflow-y-auto pr-1 space-y-3 py-3">
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
                    messages.map((message) => {
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
                            <Badge variant={messageStatusVariant(message)}>{message.status}</Badge>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSend} className="pt-3 border-t flex gap-2">
                  <Input
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    placeholder="Digite a mensagem para o cliente..."
                    maxLength={2000}
                    disabled={isSending}
                  />
                  <Button type="submit" disabled={isSending || !draftMessage.trim()}>
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

