import { ImportJobsPage } from "@/components/imports/ImportJobsPage";
import { clientImportApi } from "@/lib/api";

export default function ClientImportsPage() {
  return (
    <ImportJobsPage
      entityLabel="clientes"
      insertOnlyLabel="Inserir somente novos"
      detailPathBuilder={(jobId) => `/clientes/importacoes/${jobId}`}
      templateFileBaseName="modelo-importacao-clientes"
      api={clientImportApi}
    />
  );
}
