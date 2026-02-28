import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/estoque/visao-geral", label: "Visao geral" },
  { to: "/estoque/itens", label: "Itens" },
  { to: "/estoque/movimentacoes", label: "Movimentacoes" },
  { to: "/estoque/importacoes", label: "Importacoes" },
  { to: "/estoque/inventarios", label: "Inventarios" },
];

export default function Stock() {
  const location = useLocation();

  if (location.pathname === "/estoque") {
    return <Navigate to="/estoque/visao-geral" replace />;
  }

  return (
    <MainLayout title="Estoque" subtitle="Controle de itens, movimentacoes e importacoes">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center rounded-md border px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
        <Outlet />
      </div>
    </MainLayout>
  );
}
