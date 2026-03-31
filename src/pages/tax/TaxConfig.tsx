import { MainLayout } from "@/components/layout/MainLayout";
import { TaxConfigForm } from "@/components/fiscal/TaxConfigForm";

export default function TaxConfig() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuracao de Impostos</h1>
          <p className="text-muted-foreground mt-2">
            Configure as aliquotas de impostos para emissao de notas fiscais
          </p>
        </div>
        <TaxConfigForm />
      </div>
    </MainLayout>
  );
}
