import { MessageCircleMore, Search } from "lucide-react";
import type { ChatConversation } from "@/types/chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageEmptyState } from "@/components/ui/page-states";
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
  return (
    <Card className="h-[calc(100vh-13rem)]">
      <CardHeader className="pb-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircleMore className="h-4 w-4" />
              Todas as Conversas
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
              placeholder="Buscar por cliente, telefone ou ultima mensagem"
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
              Nao lidas
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
      <CardContent
        className="h-[calc(100%-4.25rem)] space-y-2 overflow-y-auto pr-1"
        aria-label="Lista de conversas"
      >
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </>
        ) : conversations.length === 0 ? (
          <PageEmptyState
            title="Inbox sem conversas ainda"
            description="Assim que chegarem mensagens do WhatsApp, elas aparecem aqui. Se voce esperava atendimento ativo, atualize o inbox."
            action={{
              label: "Atualizar inbox",
              onClick: onReload,
            }}
          />
        ) : filteredConversations.length === 0 ? (
          <PageEmptyState
            title="Nenhuma conversa encontrada"
            description="Ajuste a busca ou troque o filtro para voltar ao inbox completo."
            action={{
              label: "Limpar filtros",
              onClick: onClearFilters,
            }}
          />
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
