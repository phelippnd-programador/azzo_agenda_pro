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
import { suggestionsApi } from "@/lib/api";
import type { SuggestionItem } from "@/types/suggestion";

const SUGGESTION_CATEGORIES = ["BUG", "MELHORIA", "FUNCIONALIDADE", "USABILIDADE", "OUTRO"] as const;

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
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
      toast.error("Nao foi possivel carregar sugestoes.");
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
      toast.error("Informe titulo e descricao da sugestao.");
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
      toast.success("Sugestao enviada com sucesso.");
      await loadSuggestions();
    } catch {
      toast.error("Falha ao enviar sugestao.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout
      title="Sugestoes"
      subtitle="Envie ideias e melhorias para evoluirmos o sistema com base no uso real."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nova sugestao</CardTitle>
            <CardDescription>
              Conte o problema, o impacto e como voce imagina a melhoria.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Select value={category} onValueChange={(value) => setCategory(value as (typeof SUGGESTION_CATEGORIES)[number])}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {SUGGESTION_CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Titulo da sugestao"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={160}
              />
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="Descreva sua sugestao..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                maxLength={5000}
              />
            </div>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar sugestao"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ultimas sugestoes do seu tenant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando sugestoes...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma sugestao cadastrada.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{item.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{item.category || "MELHORIA"}</Badge>
                      <Badge variant="outline">{item.status || "OPEN"}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.message}</p>
                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      {item.userName || "Usuario"}
                    </span>
                    <span>{formatDateTime(item.createdAt)}</span>
                    {item.sourcePage ? <span>Origem: {item.sourcePage}</span> : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
