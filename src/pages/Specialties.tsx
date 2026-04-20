import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ModuleTabs } from "@/components/navigation/module-tabs";
import { RouteContentLoader } from "@/components/ui/route-content-loader";

export default function Specialties() {
  const location = useLocation();
  const tabs = [
    {
      to: "/especialidades",
      label: "Visao geral",
      isActive: location.pathname === "/especialidades",
    },
    {
      to: "/especialidades/importacoes",
      label: "Importacoes",
      isActive: location.pathname.startsWith("/especialidades/importacoes"),
    },
  ];

  return (
    <MainLayout
      title="Especialidades"
      subtitle="Gerencie as especialidades usadas no cadastro de profissionais e suas importacoes"
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
