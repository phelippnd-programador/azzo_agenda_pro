import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { nfseApi, type NfseAccountingExportFormat, type NfseInvoice } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";

export function NfseInvoicesContent() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const toDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [items, setItems] = useState<NfseInvoice[]>([]);
  const [search, setSearch] = useState("");
  const [exportFrom, setExportFrom] = useState(toDateInput(firstDay));
  const [exportTo, setExportTo] = useState(toDateInput(now));
  const [exportStatus, setExportStatus] = useState("AUTHORIZED,CANCELLED");
  const [exportFormat, setExportFormat] = useState<NfseAccountingExportFormat>("CSV");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const showError = (error: unknown, fallbackMessage: string) => {
    const uiError = resolveUiError(error, fallbackMessage);
    toast.error(uiError.code ? `[${uiError.code}] ${uiError.message}` : uiError.message);
  };

  const load = async () => {
    try {
      setIsLoading(true);
      const response = await nfseApi.listInvoices({ page: 1, pageSize: 100 });
      setItems(response.items || []);
    } catch (error) {
      showError(error, "Erro ao carregar NFS-e");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const extensionByFormat: Record<NfseAccountingExportFormat, string> = {
    CSV: "csv",
    XLSX: "xlsx",
    ZIP_XML: "zip",
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await nfseApi.downloadAccountingExport({
        from: exportFrom,
        to: exportTo,
        status: exportStatus,
        format: exportFormat,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nfse-contabil-${exportFrom}-${exportTo}.${extensionByFormat[exportFormat]}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Exportacao contabil gerada com sucesso.");
    } catch (error) {
      showError(error, "Erro ao exportar dados contabeis NFS-e");
    } finally {
      setIsExporting(false);
    }
  };

  const filtered = items.filter((invoice) => {
    const key = `${invoice.numeroNfse || ""} ${invoice.numeroRps} ${invoice.customer?.name || ""} ${invoice.fiscalStatus}`.toLowerCase();
    return key.includes(search.toLowerCase());
  });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Documentos NFS-e</CardTitle>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => void load()} disabled={isLoading}>
            Atualizar
          </Button>
          <Button asChild data-tour="nfse-nova">
            <Link to="/fiscal/nfse/nova">Nova NFS-e</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border p-3">
          <p className="mb-2 text-sm font-medium">Exportacao contabil</p>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            <DateInput value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
            <DateInput value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
            <Input
              placeholder="Status (ex: AUTHORIZED,CANCELLED)"
              value={exportStatus}
              onChange={(e) => setExportStatus(e.target.value)}
            />
            <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as NfseAccountingExportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CSV">CSV</SelectItem>
                <SelectItem value="XLSX">XLSX</SelectItem>
                <SelectItem value="ZIP_XML">ZIP XML</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => void handleExport()} disabled={isExporting || !exportFrom || !exportTo}>
              {isExporting ? "Exportando..." : "Exportar"}
            </Button>
          </div>
        </div>
        <Input
          placeholder="Buscar por numero, RPS, status ou tomador"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left">Numero</th>
                <th className="p-2 text-left">RPS</th>
                <th className="p-2 text-left">Tomador</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="p-2 text-muted-foreground" colSpan={5}>
                    Nenhuma NFS-e encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((invoice) => (
                  <tr key={invoice.id} className="border-b">
                    <td className="p-2">{invoice.numeroNfse || "--"}</td>
                    <td className="p-2">{invoice.numeroRps}</td>
                    <td className="p-2">{invoice.customer?.name}</td>
                    <td className="p-2">{invoice.fiscalStatus}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/fiscal/nfse/${invoice.id}`}>Detalhes</Link>
                        </Button>
                        {invoice.fiscalStatus === "DRAFT" && (
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/fiscal/nfse/${invoice.id}/editar`}>Editar</Link>
                          </Button>
                        )}
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/fiscal/nfse/${invoice.id}/pdf`}>PDF</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NfseInvoices() {
  return (
    <MainLayout title="Fiscal" subtitle="Gestao de notas fiscais, emissao e apuracao mensal.">
      <NfseInvoicesContent />
    </MainLayout>
  );
}
