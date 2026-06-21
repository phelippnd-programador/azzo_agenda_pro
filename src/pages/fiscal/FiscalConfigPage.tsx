import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NfseSettingsContent } from "@/pages/tax/NfseSettings";
import { TaxConfigContent } from "@/pages/tax/TaxConfig";
import { FiscalCertificatesSettingsContent } from "@/pages/tax/FiscalCertificatesSettings";

const VALID_SUBTABS = ["nfse", "impostos", "certificados"] as const;
type SubTab = (typeof VALID_SUBTABS)[number];

function isValidSubTab(value: string | null): value is SubTab {
  return VALID_SUBTABS.includes(value as SubTab);
}

export function FiscalConfigPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawSubtab = searchParams.get("subtab");
  const activeSubtab: SubTab = isValidSubTab(rawSubtab) ? rawSubtab : "nfse";

  const handleSubtabChange = (value: string) => {
    setSearchParams((prev) => {
      prev.set("subtab", value);
      return prev;
    });
  };

  return (
    <Tabs value={activeSubtab} onValueChange={handleSubtabChange}>
      <TabsList className="mb-6">
        <TabsTrigger value="nfse">NFS-e</TabsTrigger>
        <TabsTrigger value="impostos">Impostos</TabsTrigger>
        <TabsTrigger value="certificados">Certificados</TabsTrigger>
      </TabsList>

      <TabsContent value="nfse">
        <NfseSettingsContent />
      </TabsContent>

      <TabsContent value="impostos">
        <TaxConfigContent />
      </TabsContent>

      <TabsContent value="certificados">
        <FiscalCertificatesSettingsContent />
      </TabsContent>
    </Tabs>
  );
}
