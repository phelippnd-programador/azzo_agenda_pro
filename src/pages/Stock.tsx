import { Suspense, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ModuleTabs } from "@/components/navigation/module-tabs";
import { RouteContentLoader } from "@/components/ui/route-content-loader";
import { TutorialLauncherButton } from "@/components/tutorial/TutorialLauncherButton";
import { useTourStore } from "@/components/tutorial/tour-store";
import { STOCK_TOUR_FULL_ID, STOCK_TOUR_MODULE_OPTIONS } from "@/components/stock/tutorial/stock-tours";

const tabs = [
  { to: "/estoque/visao-geral", label: "Visao geral" },
  { to: "/estoque/itens", label: "Itens" },
  { to: "/estoque/movimentacoes", label: "Movimentacoes" },
  { to: "/estoque/importacoes", label: "Importacoes" },
  { to: "/estoque/inventarios", label: "Inventarios" },
  { to: "/estoque/fornecedores", label: "Fornecedores" },
  { to: "/estoque/pedidos-compra", label: "Pedidos" },
  { to: "/estoque/transferencias", label: "Transferencias" },
];

export default function Stock() {
  const location = useLocation();
  const startTourIfNeverSeen = useTourStore((state) => state.startTourIfNeverSeen);

  // Tutorial guiado do estoque: inicia automaticamente apenas no PRIMEIRO
  // acesso ao modulo (persistido por tour+versao). O pequeno atraso deixa a
  // aba atual montar antes do primeiro destaque.
  useEffect(() => {
    const timer = window.setTimeout(() => startTourIfNeverSeen(STOCK_TOUR_FULL_ID), 600);
    return () => window.clearTimeout(timer);
  }, [startTourIfNeverSeen]);

  if (location.pathname === "/estoque") {
    return <Navigate to="/estoque/visao-geral" replace />;
  }

  return (
    <MainLayout
      title="Estoque"
      subtitle="Centralize itens, saldos, reposicoes e rotinas operacionais do modulo de estoque."
    >
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ModuleTabs items={tabs} pathname={location.pathname} data-tour="stock-tabs" />
          <TutorialLauncherButton
            className="h-8 shrink-0 gap-1.5 self-start text-xs sm:h-9 sm:self-auto sm:text-sm"
            fullTour={{ id: STOCK_TOUR_FULL_ID, label: "Tour completo do estoque" }}
            modules={STOCK_TOUR_MODULE_OPTIONS}
          />
        </div>
        <Suspense fallback={<RouteContentLoader />}>
          <Outlet />
        </Suspense>
      </div>
    </MainLayout>
  );
}
