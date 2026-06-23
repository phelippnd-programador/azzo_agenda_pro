import { Bell, FileText, MessageCircle, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const OPTIONAL_CARDS = [
  {
    icon: MessageCircle,
    title: "WhatsApp Business",
    description: "Envie confirmações e lembretes automáticos de agendamento pelo WhatsApp.",
    href: "/configuracoes/integracoes/whatsapp",
    recommended: true,
  },
  {
    icon: Bell,
    title: "Notificações",
    description: "Configure e-mails e alertas para você e seus clientes.",
    href: "/configuracoes",
    recommended: false,
  },
  {
    icon: FileText,
    title: "Dados fiscais (NFS-e)",
    description: "Configure a emissão de nota fiscal de serviço eletrônica.",
    href: "/configuracoes/fiscal/nfse",
    recommended: false,
  },
  {
    icon: Settings,
    title: "Política de cancelamento",
    description: "Defina regras para cancelamentos e eventuais multas.",
    href: "/configuracoes",
    recommended: false,
  },
];

export function StepOptional() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Configurações adicionais</h2>
        <p className="text-sm text-muted-foreground">
          Você pode configurar isso agora ou depois, quando quiser.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONAL_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="relative">
              <CardContent className="pt-4 pb-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{card.title}</p>
                      {card.recommended && (
                        <Badge className="text-[10px] h-4 px-1.5 bg-primary/15 text-primary border-0 font-medium">
                          Recomendado
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    asChild
                  >
                    <a href={card.href} target="_blank" rel="noopener noreferrer">
                      Configurar
                    </a>
                  </Button>
                  <span className="text-xs text-muted-foreground">Pode configurar depois</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
