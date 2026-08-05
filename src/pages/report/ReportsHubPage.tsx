import { MainLayout } from "@/components/layout/MainLayout";
import { PageEmptyState } from "@/components/ui/page-states";
import { ReportTabs, useVisibleReportTabs } from "@/pages/report/components/ReportTabs";

export default function ReportsHubPage() {
  const visibleReports = useVisibleReportTabs();

  return (
    <MainLayout
      title="Relatórios"
      subtitle="Escolha um relatório para acompanhar o desempenho do seu salão."
    >
      {visibleReports.length === 0 ? (
        <PageEmptyState
          title="Nenhum relatório disponível"
          description="Seu perfil de acesso ainda não possui relatórios liberados. Fale com o responsável pelo salão para solicitar acesso."
        />
      ) : (
        <div className="space-y-4">
          <ReportTabs />
          <PageEmptyState
            title="Selecione um relatório"
            description="Use as abas acima para abrir a visão permitida para o seu perfil."
          />
        </div>
      )}
    </MainLayout>
  );
}
