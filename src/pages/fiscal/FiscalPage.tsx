import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NfseInvoicesContent } from "@/pages/tax/NfseInvoices";
import { InvoiceEmissionContent } from "@/pages/tax/InvoiceEmission";
import { ApuracaoMensalContent } from "@/pages/tax/ApuracaoMensal";
import { FiscalConfigPage } from "@/pages/fiscal/FiscalConfigPage";
import { useTourStore } from "@/components/tutorial/tour-store";
import { NFSE_EMISSION_TOUR_ID } from "@/components/fiscal/tutorial/nfse-emission-tour";

const VALID_TABS = ["notas", "emissao", "apuracao", "config"] as const;
type FiscalTab = (typeof VALID_TABS)[number];

function isValidTab(value: string | null): value is FiscalTab {
  return VALID_TABS.includes(value as FiscalTab);
}

export default function FiscalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: FiscalTab = isValidTab(rawTab) ? rawTab : "notas";
  const startTour = useTourStore((state) => state.startTour);
  const startTourIfNeverSeen = useTourStore((state) => state.startTourIfNeverSeen);

  // Tutorial guiado de emissão: inicia automaticamente apenas no PRIMEIRO
  // acesso ao módulo fiscal (persistido por tour+versão). O pequeno atraso
  // deixa a aba montar antes do primeiro destaque.
  useEffect(() => {
    const timer = window.setTimeout(() => startTourIfNeverSeen(NFSE_EMISSION_TOUR_ID), 600);
    return () => window.clearTimeout(timer);
  }, [startTourIfNeverSeen]);

  const handleTabChange = (value: string) => {
    setSearchParams((prev) => {
      prev.set("tab", value);
      // limpar subtab ao trocar aba principal
      prev.delete("subtab");
      return prev;
    });
  };

  return (
    <MainLayout
      title="Fiscal"
      subtitle="Gestao de notas fiscais, emissao, apuracao mensal e configuracoes fiscais."
    >
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <TabsList data-tour="fiscal-tabs">
            <TabsTrigger value="notas">NFS-e</TabsTrigger>
            <TabsTrigger value="emissao">Emissao</TabsTrigger>
            <TabsTrigger value="apuracao">Apuracao</TabsTrigger>
            <TabsTrigger value="config">Configuracoes</TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => startTour(NFSE_EMISSION_TOUR_ID)}
          >
            <HelpCircle className="h-4 w-4" />
            Como emitir uma NFS-e
          </Button>
        </div>

        <TabsContent value="notas">
          <NfseInvoicesContent />
        </TabsContent>

        <TabsContent value="emissao">
          <InvoiceEmissionContent />
        </TabsContent>

        <TabsContent value="apuracao">
          <ApuracaoMensalContent />
        </TabsContent>

        <TabsContent value="config">
          <FiscalConfigPage />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
