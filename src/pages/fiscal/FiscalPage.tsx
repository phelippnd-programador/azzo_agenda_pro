import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NfseInvoicesContent } from "@/pages/tax/NfseInvoices";
import { InvoiceEmissionContent } from "@/pages/tax/InvoiceEmission";
import { ApuracaoMensalContent } from "@/pages/tax/ApuracaoMensal";
import { FiscalConfigPage } from "@/pages/fiscal/FiscalConfigPage";

const VALID_TABS = ["notas", "emissao", "apuracao", "config"] as const;
type FiscalTab = (typeof VALID_TABS)[number];

function isValidTab(value: string | null): value is FiscalTab {
  return VALID_TABS.includes(value as FiscalTab);
}

export default function FiscalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: FiscalTab = isValidTab(rawTab) ? rawTab : "notas";

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
        <TabsList className="mb-6">
          <TabsTrigger value="notas">NFS-e</TabsTrigger>
          <TabsTrigger value="emissao">Emissao</TabsTrigger>
          <TabsTrigger value="apuracao">Apuracao</TabsTrigger>
          <TabsTrigger value="config">Configuracoes</TabsTrigger>
        </TabsList>

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
