import { MessageCircleMore, Search } from "lucide-react";
import type { ChatConversation } from "@/types/chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatConversationCard } from "@/components/chat/ChatConversationCard";

export type ConversationFilter = "all" | "manual" | "unread";

type ChatSidebarProps = {
  conversations: ChatConversation[];
  filteredConversations: ChatConversation[];
  selectedConversationId?: string;
  isLoading: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  filter: ConversationFilter;
  onFilterChange: (value: ConversationFilter) => void;
  onSelectConversation: (conversationId: string) => void;
  onReload: () => void;
  onClearFilters: () => void;
};

export function ChatSidebar({
  conversations,
  filteredConversations,
  selectedConversationId,
  isLoading,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  onSelectConversation,
  onReload,
  onClearFilters,
}: ChatSidebarProps) {
  const emptyStateClassName =
    "flex min-h-[18rem] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-background/55 px-4 py-8 text-center shadow-none sm:px-5";

  return (
    <Card className="flex h-[calc(100dvh-8rem)] min-w-0 flex-col overflow-hidden lg:h-[calc(100vh-13rem)]">
      <CardHeader className="shrink-0 pb-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircleMore className="h-4 w-4" />
              Todas as conversas
            </CardTitle>
            <Badge variant="outline" className="shrink-0">
              {filteredConversations.length}/{conversations.length}
            </Badge>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Buscar por cliente, telefone ou última mensagem"
              className="pl-9"
              aria-label="Buscar conversas"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => onFilterChange("all")}
              aria-pressed={filter === "all"}
            >
              Todas
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filter === "unread" ? "default" : "outline"}
              onClick={() => onFilterChange("unread")}
              aria-pressed={filter === "unread"}
            >
              Não lidas
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filter === "manual" ? "default" : "outline"}
              onClick={() => onFilterChange("manual")}
              aria-pressed={filter === "manual"}
            >
              Modo manual
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4 pr-3" aria-label="Lista de conversas">
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </>
        ) : conversations.length === 0 ? (
          <div className="flex min-h-full items-center py-1">
            <div className={emptyStateClassName}>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/10">
                <MessageCircleMore className="h-6 w-6 text-primary" />
              </div>
              <p className="text-base font-semibold text-foreground">Inbox sem conversas ainda</p>
              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                Assim que chegarem mensagens do WhatsApp ou Telegram, elas aparecem aqui. Se você esperava atendimento ativo, atualize o inbox.
              </p>
              <Button className="mt-4" onClick={onReload}>
                Atualizar inbox
              </Button>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex min-h-full items-center py-1">
            <div className={emptyStateClassName}>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/10">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <p className="text-base font-semibold text-foreground">Nenhuma conversa encontrada</p>
              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                Ajuste a busca ou troque o filtro para voltar ao inbox completo.
              </p>
              <Button className="mt-4" onClick={onClearFilters}>
                Limpar filtros
              </Button>
            </div>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ChatConversationCard
              key={conversation.id}
              conversation={conversation}
              selected={conversation.id === selectedConversationId}
              onClick={() => onSelectConversation(conversation.id)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
