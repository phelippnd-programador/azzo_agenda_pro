import { AlertTriangle, MessageSquareText } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { WhatsAppReactivationQueue } from "@/components/dashboard/WhatsAppReactivationQueue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AbandonmentReport() {
  return (
    <MainLayout
      title="Relatorio de abandono"
      subtitle="Fila operacional para acompanhar conversas pausadas, excecoes e retomadas do WhatsApp."
    >
      <div className="space-y-6">
        <Alert>
          <MessageSquareText className="h-4 w-4" />
          <AlertTitle>Uso operacional</AlertTitle>
          <AlertDescription>
            Esta pagina concentra os abandonos recentes do WhatsApp para o time revisar contexto,
            identificar excecoes e assumir o atendimento quando necessario.
          </AlertDescription>
        </Alert>

        <Alert className="border-amber-200 bg-amber-50 text-amber-950">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Leitura recomendada</AlertTitle>
          <AlertDescription>
            Priorize primeiro os casos destacados como excecao ou intervencao manual necessaria.
          </AlertDescription>
        </Alert>

        <WhatsAppReactivationQueue />
      </div>
    </MainLayout>
  );
}
