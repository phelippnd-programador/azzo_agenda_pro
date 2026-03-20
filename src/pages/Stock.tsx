import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ModuleTabs } from "@/components/navigation/module-tabs";

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

  if (location.pathname === "/estoque") {
    return <Navigate to="/estoque/visao-geral" replace />;
  }

  return (
      <MainLayout title="Estoque" subtitle="Controle de itens, movimentacoes e importacoes">
      <div className="space-y-4 sm:space-y-6">
        <ModuleTabs items={tabs} pathname={location.pathname} />
        <Outlet />
      </div>
    </MainLayout>
  );
}
