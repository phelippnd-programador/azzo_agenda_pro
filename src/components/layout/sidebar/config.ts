import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  Calculator,
  Calendar,
  CreditCard,
  DollarSign,
  Eye,
  FileSearch,
  FileSpreadsheet,
  FileText,
  Grid3X3,
  LayoutDashboard,
  Lightbulb,
  MapPinned,
  MessageCircleMore,
  MessageSquareDashed,
  Package,
  Receipt,
  Scissors,
  ShoppingCart,
  Settings,
  ShieldCheck,
  Tag,
  type LucideIcon,
  TrendingUp,
  User,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";
import { appRouteManifest } from "@/app/route-manifest";
import type { SidebarMenuItem } from "./types";

export const MENU_REGISTRY = {
  [appRouteManifest.shell.dashboard]: {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: appRouteManifest.shell.dashboard,
  },
  [appRouteManifest.reports.root]: {
    icon: BarChart3,
    label: "Relatórios",
    path: appRouteManifest.reports.root,
  },
  [appRouteManifest.reports.appointments]: {
    icon: BarChart3,
    label: "Agendamentos",
    path: appRouteManifest.reports.appointments,
  },
  [appRouteManifest.reports.noShow]: {
    icon: Calendar,
    label: "No-show",
    path: appRouteManifest.reports.noShow,
  },
  [appRouteManifest.reports.abandonment]: {
    icon: MessageCircleMore,
    label: "Abandono",
    path: appRouteManifest.reports.abandonment,
  },
  [appRouteManifest.reports.financeiro]: {
    icon: DollarSign,
    label: "Financeiro",
    path: appRouteManifest.reports.financeiro,
  },
  [appRouteManifest.reports.estoque]: {
    icon: Package,
    label: "Estoque",
    path: appRouteManifest.reports.estoque,
  },
  [appRouteManifest.reports.vendas]: {
    icon: ShoppingCart,
    label: "Vendas",
    path: appRouteManifest.reports.vendas,
  },
  [appRouteManifest.reports.clientes]: {
    icon: UserCircle,
    label: "Clientes",
    path: appRouteManifest.reports.clientes,
  },
  [appRouteManifest.reports.licencas]: {
    icon: ShieldCheck,
    label: "Licenças",
    path: appRouteManifest.reports.licencas,
  },
  [appRouteManifest.reports.ocupacao]: {
    icon: Grid3X3,
    label: "Ocupacao",
    path: appRouteManifest.reports.ocupacao,
  },
  [appRouteManifest.reports.catalogo]: {
    icon: FileSpreadsheet,
    label: "Catalogo avancado",
    path: appRouteManifest.reports.catalogo,
  },
  [appRouteManifest.reports.gerencial]: {
    icon: BarChart3,
    label: "Gerencial",
    path: appRouteManifest.reports.gerencial,
  },
  [appRouteManifest.shell.notifications]: {
    icon: Bell,
    label: "Notificações",
    path: appRouteManifest.shell.notifications,
  },
  [appRouteManifest.shell.agenda]: {
    icon: Calendar,
    label: "Agenda",
    path: appRouteManifest.shell.agenda,
  },
  [appRouteManifest.services.root]: {
    icon: Scissors,
    label: "Serviços",
    path: appRouteManifest.services.root,
  },
  [appRouteManifest.specialties.root]: {
    icon: Tag,
    label: "Especialidades",
    path: appRouteManifest.specialties.root,
  },
  [appRouteManifest.professionals.root]: {
    icon: Users,
    label: "Profissionais",
    path: appRouteManifest.professionals.root,
  },
  [appRouteManifest.professionals.myHistory]: {
    icon: TrendingUp,
    label: "Minha Produção",
    path: appRouteManifest.professionals.myHistory,
  },
  [appRouteManifest.clients.root]: {
    icon: UserCircle,
    label: "Clientes",
    path: appRouteManifest.clients.root,
  },
  [appRouteManifest.shell.suggestions]: {
    icon: Lightbulb,
    label: "Sugestões",
    path: appRouteManifest.shell.suggestions,
  },
  [appRouteManifest.chat.root]: {
    icon: MessageCircleMore,
    label: "Chat",
    path: appRouteManifest.chat.root,
  },
  [appRouteManifest.stock.root]: {
    icon: Boxes,
    label: "Estoque",
    path: appRouteManifest.stock.root,
  },
  [appRouteManifest.finance.root]: {
    icon: DollarSign,
    label: "Financeiro",
    path: appRouteManifest.finance.root,
  },
  [appRouteManifest.finance.cashClosing]: {
    icon: Wallet,
    label: "Fechamento de Caixa",
    path: appRouteManifest.finance.cashClosing,
  },
  [appRouteManifest.finance.commissions]: {
    icon: Receipt,
    label: "Comissões",
    path: appRouteManifest.finance.commissions,
  },
  [appRouteManifest.finance.professionals]: {
    icon: BarChart3,
    label: "Equipe",
    path: appRouteManifest.finance.professionals,
  },
  [appRouteManifest.finance.license]: {
    icon: CreditCard,
    label: "Plano",
    path: appRouteManifest.finance.license,
  },
  [appRouteManifest.pos.root]: {
    icon: ShoppingCart,
    label: "Comanda / PDV",
    path: appRouteManifest.pos.root,
  },
  [appRouteManifest.packages.root]: {
    icon: Package,
    label: "Pacotes",
    path: appRouteManifest.packages.root,
  },
  [appRouteManifest.memberships.root]: {
    icon: CreditCard,
    label: "Clube de Assinaturas",
    path: appRouteManifest.memberships.root,
  },
  [appRouteManifest.fiscal.root]: {
    icon: Receipt,
    label: "Fiscal",
    path: appRouteManifest.fiscal.root,
  },
  [appRouteManifest.audit.root]: {
    icon: ShieldCheck,
    label: "Auditoria",
    path: appRouteManifest.audit.root,
  },
  [appRouteManifest.audit.lgpd]: {
    icon: FileSearch,
    label: "LGPD",
    path: appRouteManifest.audit.lgpd,
  },
  [appRouteManifest.settings.systemAdmin]: {
    icon: ShieldCheck,
    label: "Admin",
    path: appRouteManifest.settings.systemAdmin,
  },
  [appRouteManifest.settings.root]: {
    icon: Settings,
    label: "Configurações",
    path: appRouteManifest.settings.root,
  },
  [appRouteManifest.settings.reactivation]: {
    icon: MessageSquareDashed,
    label: "Reativação WhatsApp",
    path: appRouteManifest.settings.reactivation,
  },
  [appRouteManifest.profiles.user]: {
    icon: User,
    label: "Perfil",
    path: appRouteManifest.profiles.user,
  },
  [appRouteManifest.profiles.salon]: {
    icon: Building2,
    label: "Perfil do Salão",
    path: appRouteManifest.profiles.salon,
  },
} as const satisfies Record<string, SidebarMenuItem>;

export const MAIN_MENU_ORDER = [
  appRouteManifest.shell.dashboard,
  appRouteManifest.shell.notifications,
  appRouteManifest.shell.agenda,
  appRouteManifest.reports.root,
  appRouteManifest.reports.appointments,
  appRouteManifest.reports.noShow,
  appRouteManifest.reports.abandonment,
  appRouteManifest.reports.financeiro,
  appRouteManifest.reports.estoque,
  appRouteManifest.reports.vendas,
  appRouteManifest.reports.clientes,
  appRouteManifest.reports.licencas,
  appRouteManifest.reports.ocupacao,
  appRouteManifest.reports.catalogo,
  appRouteManifest.reports.gerencial,
  appRouteManifest.services.root,
  appRouteManifest.specialties.root,
  appRouteManifest.professionals.root,
  appRouteManifest.professionals.myHistory,
  appRouteManifest.clients.root,
  appRouteManifest.shell.suggestions,
  appRouteManifest.chat.root,
  appRouteManifest.stock.root,
  appRouteManifest.finance.root,
  appRouteManifest.finance.cashClosing,
  appRouteManifest.finance.commissions,
  appRouteManifest.finance.professionals,
  appRouteManifest.finance.license,
  appRouteManifest.pos.root,
  appRouteManifest.packages.root,
  appRouteManifest.memberships.root,
  appRouteManifest.fiscal.root,
  appRouteManifest.audit.root,
  appRouteManifest.audit.lgpd,
  appRouteManifest.settings.systemAdmin,
  appRouteManifest.settings.reactivation,
] as const;

export const FINANCIAL_GROUP_PATHS = [
  appRouteManifest.finance.root,
  appRouteManifest.finance.cashClosing,
  appRouteManifest.finance.commissions,
  appRouteManifest.finance.professionals,
] as const;

export const REPORTS_GROUP_PATHS = [
  appRouteManifest.reports.appointments,
  appRouteManifest.reports.noShow,
  appRouteManifest.reports.abandonment,
  appRouteManifest.reports.financeiro,
  appRouteManifest.reports.estoque,
  appRouteManifest.reports.vendas,
  appRouteManifest.reports.clientes,
  appRouteManifest.reports.licencas,
  appRouteManifest.reports.ocupacao,
  appRouteManifest.reports.catalogo,
  appRouteManifest.reports.gerencial,
] as const;

export const FISCAL_GROUP_PATHS = [
  appRouteManifest.fiscal.root,
] as const;

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  Tag,
  UserCircle,
  DollarSign,
  Settings,
  Bell,
  Building2,
  Receipt,
  FileText,
  Calculator,
  Eye,
  CreditCard,
  BarChart3,
  ShieldCheck,
  FileSearch,
  FileSpreadsheet,
  Boxes,
  Grid3X3,
  User,
  MessageCircleMore,
  MessageSquareDashed,
  MapPinned,
  Lightbulb,
  Wallet,
};

export const DYNAMIC_BOTTOM_ROUTES = new Set([
  appRouteManifest.profiles.salon,
  appRouteManifest.settings.root,
]);

export const STANDALONE_LAST_ROUTES = new Set([appRouteManifest.finance.license]);
// "/relatorio" agora tem pagina hub propria, entao o grupo tambem e clicavel
export const GROUP_ONLY_ROUTES = new Set<string>([]);

export const HIDDEN_MENU_ROUTES = new Set([
  appRouteManifest.shell.unauthorized,
  `${appRouteManifest.stock.root}/${appRouteManifest.stock.overview}`,
  `${appRouteManifest.stock.root}/${appRouteManifest.stock.items}`,
  `${appRouteManifest.stock.root}/${appRouteManifest.stock.movements}`,
  `${appRouteManifest.stock.root}/${appRouteManifest.stock.imports}`,
  `${appRouteManifest.stock.root}/${appRouteManifest.stock.inventories}`,
  `${appRouteManifest.stock.root}/${appRouteManifest.stock.suppliers}`,
  `${appRouteManifest.stock.root}/${appRouteManifest.stock.purchaseOrders}`,
  `${appRouteManifest.stock.root}/${appRouteManifest.stock.transfers}`,
  `${appRouteManifest.clients.root}/${appRouteManifest.clients.imports}`,
  `${appRouteManifest.clients.root}/${appRouteManifest.clients.importDetail}`,
  `${appRouteManifest.services.root}/${appRouteManifest.services.imports}`,
  `${appRouteManifest.services.root}/${appRouteManifest.services.importDetail}`,
  `${appRouteManifest.specialties.root}/${appRouteManifest.specialties.imports}`,
  `${appRouteManifest.specialties.root}/${appRouteManifest.specialties.importDetail}`,
  appRouteManifest.profiles.user,
]);

export const SIDEBAR_BOTTOM_ITEMS = [
  {
    path: appRouteManifest.profiles.salon,
    label: "Perfil do Salão",
    icon: Building2,
    isVisible: (role: string | null | undefined, allowedSet: Set<string>) =>
      role === "OWNER" && allowedSet.has(appRouteManifest.profiles.salon),
  },
  {
    path: appRouteManifest.settings.root,
    label: "Configurações",
    icon: Settings,
    isVisible: (_role: string | null | undefined, allowedSet: Set<string>) =>
      allowedSet.has(appRouteManifest.settings.root),
  },
] as const;

export const SIDEBAR_SECTIONS = [
  {
    id: "hoje",
    label: "Hoje",
    paths: new Set([
      appRouteManifest.shell.dashboard,
      appRouteManifest.shell.agenda,
      appRouteManifest.chat.root,
      appRouteManifest.shell.notifications,
      appRouteManifest.reports.root,
    ]),
  },
  {
    id: "base",
    label: "Base do negócio",
    paths: new Set([
      appRouteManifest.clients.root,
      appRouteManifest.services.root,
      appRouteManifest.specialties.root,
      appRouteManifest.professionals.root,
    ]),
  },
  {
    id: "gestao",
    label: "Gestão",
    paths: new Set([
      appRouteManifest.finance.root,
      appRouteManifest.stock.root,
      appRouteManifest.memberships.root,
      appRouteManifest.shell.suggestions,
      appRouteManifest.audit.root,
      appRouteManifest.settings.systemAdmin,
      appRouteManifest.fiscal.root,
      appRouteManifest.professionals.myHistory,
    ]),
  },
] as const;
