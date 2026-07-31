import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ModuleTabs } from "@/components/navigation/module-tabs";
import { RouteContentLoader } from "@/components/ui/route-content-loader";

export default function Services() {
  const location = useLocation();
  const tabs = [
    { to: "/servicos", label: "Visão geral", isActive: location.pathname === "/servicos" },
    {
      to: "/servicos/importacoes",
      label: "Importações",
      isActive: location.pathname.startsWith("/servicos/importacoes"),
    },
  ];

  return (
    <MainLayout
      title="Serviços"
      subtitle="Organize o catálogo de serviços e acompanhe importações sem perder consistência operacional."
    >
      <div className="space-y-4 sm:space-y-6">
        <ModuleTabs items={tabs} pathname={location.pathname} />
        <Suspense fallback={<RouteContentLoader />}>
          <Outlet />
        </Suspense>
      </div>
    </MainLayout>
  );
}
