import { ImportJobsPage } from "@/components/imports/ImportJobsPage";
import { specialtyImportApi } from "@/lib/api";

export default function SpecialtyImportsPage() {
  return (
    <ImportJobsPage
      entityLabel="especialidades"
      insertOnlyLabel="Inserir somente novas"
      detailPathBuilder={(jobId) => `/especialidades/importacoes/${jobId}`}
      templateFileBaseName="modelo-importacao-especialidades"
      api={specialtyImportApi}
    />
  );
}
