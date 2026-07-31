import { ImportJobsPage } from "@/components/imports/ImportJobsPage";
import { serviceImportApi } from "@/lib/api";

export default function ServiceImportsPage() {
  return (
    <ImportJobsPage
      entityLabel="servicos"
      insertOnlyLabel="Inserir somente novos"
      detailPathBuilder={(jobId) => `/servicos/importacoes/${jobId}`}
      templateFileBaseName="modelo-importacao-servicos"
      api={serviceImportApi}
    />
  );
}
