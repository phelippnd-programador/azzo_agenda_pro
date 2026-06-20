import { useEffect, useState } from "react";
import { RefreshCw, Shield, ShieldAlert, ShieldCheck, ShieldOff } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { reportsApi } from "@/lib/api/reports";
import type { LicencaTenantItem, LicencasAdminReportResponse } from "@/lib/api/reports";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status?.includes("ACTIVE") || status?.includes("TRIAL")) return "default";
  if (status?.includes("EXPIRED") || status?.includes("BLOCKED")) return "destructive";
  return "secondary";
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: "Ativo",
    TRIAL_ACTIVE: "Trial",
    EXPIRED: "Expirado",
    BLOCKED: "Bloqueado",
    CANCELLED: "Cancelado",
    PENDING: "Pendente",
  };
  return map[status] ?? status ?? "-";
}

export default function LicenseReportPage() {
  const [data, setData] = useState<LicencasAdminReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await reportsApi.adminGetLicencas();
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erro ao carregar relatorio de licencas.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [reloadToken]);

  const filteredItems: LicencaTenantItem[] = (data?.items ?? []).filter((t) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      t.tenantNome?.toLowerCase().includes(q) ||
      t.tenantEmail?.toLowerCase().includes(q) ||
      t.planStatus?.toLowerCase().includes(q)
    );
  });

  return (
    <MainLayout
      title="Relatorio de licencas"
      subtitle="Visao administrativa de todos os tenants, status de plano e vencimentos."
    >
      <div className="space-y-6">
        {/* Summary cards */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Total
                </CardTitle>
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{data.totalTenants}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Ativos
                </CardTitle>
              </CardHeader>
              <CardContent><p className="text-2xl font-bold text-emerald-600">{data.ativosCount}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-500" /> Trial
                </CardTitle>
              </CardHeader>
              <CardContent><p className="text-2xl font-bold text-sky-600">{data.trialCount}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" /> Expirados
                </CardTitle>
              </CardHeader>
              <CardContent><p className={`text-2xl font-bold ${data.expiradosCount > 0 ? "text-amber-600" : ""}`}>{data.expiradosCount}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShieldOff className="w-4 h-4 text-red-500" /> Bloqueados
                </CardTitle>
              </CardHeader>
              <CardContent><p className={`text-2xl font-bold ${data.bloqueadosCount > 0 ? "text-red-600" : ""}`}>{data.bloqueadosCount}</p></CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Tenants</CardTitle>
                <CardDescription>Lista completa com status de licenca e vencimento.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por nome, email ou status..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="sm:w-72"
                />
                <Button variant="outline" size="sm" onClick={() => setReloadToken((t) => t + 1)} disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {error && (
              <div className="p-4 text-sm text-destructive">{error}</div>
            )}
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Nenhum tenant encontrado.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo Pagamento</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Dias Restantes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((t) => (
                    <TableRow key={t.tenantId} className={t.vencido ? "bg-destructive/5" : ""}>
                      <TableCell className="font-medium text-sm">{t.tenantNome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.tenantEmail ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(t.planStatus)} className="text-xs">
                          {statusLabel(t.planStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.billingType ?? "-"}</TableCell>
                      <TableCell className="text-sm">
                        {t.validUntil ? t.validUntil.split("T")[0] : "-"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {t.diasRestantes < 0 ? (
                          <span className="text-destructive font-medium">Vencido</span>
                        ) : (
                          <span className={t.diasRestantes <= 7 ? "text-amber-600 font-medium" : ""}>
                            {t.diasRestantes} dias
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
