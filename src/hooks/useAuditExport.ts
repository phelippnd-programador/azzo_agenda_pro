import { useState } from "react";
import { toast } from "sonner";
import { auditoriaApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type { AuditExportRequestDto, AuditExportResponseDto } from "@/types/auditoria";

export function useAuditExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<AuditExportResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportEvents = async (payload: AuditExportRequestDto) => {
    try {
      setIsExporting(true);
      const result = await auditoriaApi.exportEvents(payload);
      setLastExport(result);
      setError(null);
      toast.success("Exportacao gerada com sucesso.");
      return result;
    } catch (err) {
      const uiError = resolveUiError(err, "Erro ao exportar eventos de auditoria.");
      setError(uiError.message);
      toast.error(uiError.message);
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    lastExport,
    error,
    exportEvents,
  };
}
