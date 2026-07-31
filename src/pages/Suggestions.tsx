import { useEffect, useState } from "react";
import { Loader2, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageEmptyState, PageListLoadingState } from "@/components/ui/page-states";
import { suggestionsApi } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { SuggestionItem } from "@/types/suggestion";

const SUGGESTION_CATEGORIES = ["BUG", "MELHORIA", "FUNCIONALIDADE", "USABILIDADE", "OUTRO"] as const;

const CATEGORY_LABELS: Record<(typeof SUGGESTION_CATEGORIES)[number], string> = {
  BUG: "Bug",
  MELHORIA: "Melhoria",
  FUNCIONALIDADE: "Funcionalidade",
  USABILIDADE: "Usabilidade",
  OUTRO: "Outro",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em análise",
  ANSWERED: "Respondida",
  CLOSED: "Fechada",
  REJECTED: "Não aplicada",
};

export default function SuggestionsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<(typeof SUGGESTION_CATEGORIES)[number]>("MELHORIA");
  const [items, setItems] = useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSuggestions = async () => {
    try {
      setIsLoading(true);
      const response = await suggestionsApi.list(50);
      setItems(response.items || []);
    } catch {
      toast.error("Não foi possível carregar sugestões.");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSuggestions();
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Informe título e descrição da sugestão.");
      return;
    }

    try {
      setIsSubmitting(true);
      await suggestionsApi.create({
        category,
        title: title.trim(),
        message: message.trim(),
        sourcePage: window.location.pathname,
      });
      setTitle("");
      setMessage("");
      setCategory("MELHORIA");
      toast.success("Sugestão enviada com sucesso.");
      await loadSuggestions();
    } catch {
      toast.error("Falha ao enviar sugestão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout
      title="Sugestões"
      subtitle="Envie ideias e melhorias para evoluirmos o sistema com base no uso real."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Nova sugestão</CardTitle>
            <CardDescription>
              Conte o problema, o impacto e como você imagina a melhoria.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="suggestion-category">Categoria</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as (typeof SUGGESTION_CATEGORIES)[number])}>
                <SelectTrigger id="suggestion-category">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {SUGGESTION_CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {CATEGORY_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="suggestion-title">Título</Label>
              <Input
                id="suggestion-title"
                placeholder="Ex.: melhorar confirmação de agenda"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={160}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suggestion-message">Descrição</Label>
              <Textarea
                id="suggestion-message"
                placeholder="Descreva sua sugestão com o máximo de contexto útil."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                maxLength={5000}
              />
            </div>
            <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar sugestão"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas sugestões do seu salão</CardTitle>
            <CardDescription>
              Acompanhe o que já foi enviado por você e pela equipe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <PageListLoadingState metricCount={0} itemCount={4} itemHeightClassName="h-28" showHeader={false} showToolbar={false} />
            ) : items.length === 0 ? (
              <PageEmptyState
                title="Nenhuma sugestão cadastrada"
                description="Quando alguém do salão enviar uma ideia, ela aparecerá aqui com categoria, origem e status."
              />
            ) : (
              items.map((item) => (
                <article key={item.id} className="space-y-2 rounded-lg border border-border/70 bg-background/55 p-4 transition-colors hover:bg-muted/45">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="min-w-0 flex-1 font-medium text-foreground">{item.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{CATEGORY_LABELS[item.category as (typeof SUGGESTION_CATEGORIES)[number]] || item.category || "Melhoria"}</Badge>
                      <Badge variant="outline">{STATUS_LABELS[item.status || "OPEN"] || item.status || "Aberta"}</Badge>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{item.message}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      {item.userName || "Usuário"}
                    </span>
                    <span>{formatDateTime(item.createdAt)}</span>
                    {item.sourcePage ? <span>Origem: {item.sourcePage}</span> : null}
                  </div>
                </article>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
