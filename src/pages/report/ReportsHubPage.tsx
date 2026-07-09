import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CalendarX2,
  CalendarCheck2,
  DollarSign,
  Grid3X3,
  MessageCircleMore,
  ShieldCheck,
  ShoppingCart,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageEmptyState } from "@/components/ui/page-states";
import { appRouteManifest } from "@/app/route-manifest";
import { useMenuPermissions } from "@/contexts/MenuPermissionsContext";

type ReportCard = {
  path: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const REPORT_CARDS: ReportCard[] = [
  {
    path: appRouteManifest.reports.appointments,
    title: "Agendamentos",
    description: "Volume, ocupação e desempenho dos agendamentos por período e profissional.",
    icon: CalendarCheck2,
  },
  {
    path: appRouteManifest.reports.noShow,
    title: "No-show",
    description: "Faltas e ausências de clientes, com impacto na agenda e no faturamento.",
    icon: CalendarX2,
  },
  {
    path: appRouteManifest.reports.abandonment,
    title: "Abandono",
    description: "Clientes que deixaram de frequentar e resultados da reativação por WhatsApp.",
    icon: MessageCircleMore,
  },
  {
    path: appRouteManifest.reports.financeiro,
    title: "Financeiro",
    description: "Receitas, despesas e resultado do salão em cada período.",
    icon: DollarSign,
  },
  {
    path: appRouteManifest.reports.vendas,
    title: "Vendas",
    description: "Vendas de produtos e serviços, ticket médio e itens mais vendidos.",
    icon: ShoppingCart,
  },
  {
    path: appRouteManifest.reports.clientes,
    title: "Clientes",
    description: "Base de clientes, frequência de visitas e comportamento de consumo.",
    icon: UserCircle,
  },
  {
    path: appRouteManifest.reports.estoque,
    title: "Estoque",
    description: "Posição de estoque, movimentações e itens abaixo do mínimo.",
    icon: Boxes,
  },
  {
    path: appRouteManifest.reports.ocupacao,
    title: "Ocupacao",
    description: "Mapa de calor por dia e horario para identificar picos, ociosidade e oportunidades.",
    icon: Grid3X3,
  },
  {
    path: appRouteManifest.reports.gerencial,
    title: "Gerencial",
    description: "Visão executiva consolidada com os principais indicadores do negócio.",
    icon: BarChart3,
  },
  {
    path: appRouteManifest.reports.licencas,
    title: "Licenças",
    description: "Licenças e planos ativos, vencimentos e histórico de cobrança.",
    icon: ShieldCheck,
  },
];

export default function ReportsHubPage() {
  const { allowedRoutes } = useMenuPermissions();
  const allowedSet = new Set(allowedRoutes ?? []);
  const visibleReports = REPORT_CARDS.filter((report) => allowedSet.has(report.path));

  return (
    <MainLayout
      title="Relatórios"
      subtitle="Escolha um relatório para acompanhar o desempenho do seu salão."
    >
      {visibleReports.length === 0 ? (
        <PageEmptyState
          title="Nenhum relatório disponível"
          description="Seu perfil de acesso ainda não possui relatórios liberados. Fale com o responsável pelo salão para solicitar acesso."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleReports.map((report) => (
            <Card key={report.path} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <report.icon className="h-4 w-4 text-primary" />
                  {report.title}
                </CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to={report.path}>
                    Abrir relatório
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
