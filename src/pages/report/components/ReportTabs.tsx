import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { appRouteManifest } from "@/app/route-manifest";
import { ModuleTabs, type ModuleTabItem } from "@/components/navigation/module-tabs";
import { useMenuPermissions } from "@/contexts/MenuPermissionsContext";

type ReportTabDefinition = {
  to: string;
  label: string;
};

const REPORT_TAB_DEFINITIONS: ReportTabDefinition[] = [
  { to: appRouteManifest.reports.appointments, label: "Agendamentos" },
  { to: appRouteManifest.reports.noShow, label: "No-show" },
  { to: appRouteManifest.reports.abandonment, label: "Abandono" },
  { to: appRouteManifest.reports.financeiro, label: "Financeiro" },
  { to: appRouteManifest.reports.vendas, label: "Vendas" },
  { to: appRouteManifest.reports.clientes, label: "Clientes" },
  { to: appRouteManifest.reports.estoque, label: "Estoque" },
  { to: appRouteManifest.reports.ocupacao, label: "Ocupação" },
  { to: appRouteManifest.reports.catalogo, label: "Catálogo avançado" },
  { to: appRouteManifest.reports.gerencial, label: "Gerencial" },
  { to: appRouteManifest.reports.licencas, label: "Licenças" },
];

export function useVisibleReportTabs() {
  const { allowedRoutes } = useMenuPermissions();
  const allowedSet = useMemo(() => new Set(allowedRoutes ?? []), [allowedRoutes]);

  return useMemo(
    () => REPORT_TAB_DEFINITIONS.filter((tab) => allowedSet.has(tab.to)),
    [allowedSet]
  );
}

export function ReportTabs() {
  const location = useLocation();
  const visibleTabs = useVisibleReportTabs();

  if (visibleTabs.length === 0) {
    return null;
  }

  const items: ModuleTabItem[] = visibleTabs.map((tab) => ({
    to: tab.to,
    label: tab.label,
    isActive: (pathname) => pathname === tab.to || pathname.startsWith(`${tab.to}/`),
  }));

  return (
    <div className="print:hidden">
      <ModuleTabs items={items} pathname={location.pathname} />
    </div>
  );
}
