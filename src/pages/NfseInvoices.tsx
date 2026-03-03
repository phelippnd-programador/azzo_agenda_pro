import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { nfseApi, type NfseInvoice } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";

export default function NfseInvoices() {
  const [items, setItems] = useState<NfseInvoice[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  const filtered = items.filter((invoice) => {
    const key = `${invoice.numeroNfse || ""} ${invoice.numeroRps} ${invoice.customer?.name || ""} ${invoice.fiscalStatus}`.toLowerCase();
    return key.includes(search.toLowerCase());
  });

  return (
    <MainLayout title="NFS-e" subtitle="Gestao de rascunhos, autorizacao, cancelamento e PDF da NFS-e.">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Documentos NFS-e</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void load()} disabled={isLoading}>
              Atualizar
            </Button>
            <Button asChild>
              <Link to="/fiscal/nfse/nova">Nova NFS-e</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar por numero, RPS, status ou tomador"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="rounded-md border">
            <table className="w-full text-sm">
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
    </MainLayout>
  );
}
