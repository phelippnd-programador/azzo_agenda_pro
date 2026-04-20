import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ModuleTabs } from "@/components/navigation/module-tabs";
import { RouteContentLoader } from "@/components/ui/route-content-loader";

export default function Services() {
  const location = useLocation();
  const tabs = [
    { to: "/servicos", label: "Visao geral", isActive: location.pathname === "/servicos" },
    {
      to: "/servicos/importacoes",
      label: "Importacoes",
      isActive: location.pathname.startsWith("/servicos/importacoes"),
    },
  ];

  return (
    <MainLayout title="Servicos" subtitle="Gerencie os servicos oferecidos e suas importacoes">
      <div className="space-y-4 sm:space-y-6">
        <ModuleTabs items={tabs} pathname={location.pathname} />
        <Suspense fallback={<RouteContentLoader />}>
          <Outlet />
        </Suspense>
      </div>
    </MainLayout>
  );
}
