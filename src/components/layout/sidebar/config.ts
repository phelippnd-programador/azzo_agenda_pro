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
  FileText,
  LayoutDashboard,
  Lightbulb,
  MessageCircleMore,
  Receipt,
  Scissors,
  Settings,
  ShieldCheck,
  Tag,
  type LucideIcon,
  User,
  UserCircle,
  Users,
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
    label: "Relatorios",
    path: appRouteManifest.reports.root,
  },
  [appRouteManifest.shell.notifications]: {
    icon: Bell,
    label: "Notificacoes",
    path: appRouteManifest.shell.notifications,
  },
  [appRouteManifest.shell.agenda]: {
    icon: Calendar,
    label: "Agenda",
    path: appRouteManifest.shell.agenda,
  },
  [appRouteManifest.services.root]: {
    icon: Scissors,
    label: "Servicos",
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
  [appRouteManifest.clients.root]: {
    icon: UserCircle,
    label: "Clientes",
    path: appRouteManifest.clients.root,
  },
  [appRouteManifest.shell.suggestions]: {
    icon: Lightbulb,
    label: "Sugestoes",
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
  [appRouteManifest.finance.commissions]: {
    icon: Receipt,
    label: "Comissoes",
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
  [appRouteManifest.fiscal.invoiceEmission]: {
    icon: FileText,
    label: "Emitir Nota Fiscal",
    path: appRouteManifest.fiscal.invoiceEmission,
  },
  [appRouteManifest.fiscal.invoicePreview]: {
    icon: Eye,
    label: "Preview NF",
    path: appRouteManifest.fiscal.invoicePreview,
  },
  [appRouteManifest.fiscal.monthlyTaxStatement]: {
    icon: Calculator,
    label: "Apuracao Mensal",
    path: appRouteManifest.fiscal.monthlyTaxStatement,
  },
  [appRouteManifest.settings.root]: {
    icon: Settings,
    label: "Configuracoes",
    path: appRouteManifest.settings.root,
  },
  [appRouteManifest.profiles.user]: {
    icon: User,
    label: "Perfil",
    path: appRouteManifest.profiles.user,
  },
  [appRouteManifest.profiles.salon]: {
    icon: Building2,
    label: "Perfil do Salao",
    path: appRouteManifest.profiles.salon,
  },
} as const satisfies Record<string, SidebarMenuItem>;

export const MAIN_MENU_ORDER = [
  appRouteManifest.shell.dashboard,
  appRouteManifest.shell.notifications,
  appRouteManifest.shell.agenda,
  appRouteManifest.reports.root,
  appRouteManifest.services.root,
  appRouteManifest.specialties.root,
  appRouteManifest.professionals.root,
  appRouteManifest.clients.root,
  appRouteManifest.shell.suggestions,
  appRouteManifest.chat.root,
  appRouteManifest.stock.root,
  appRouteManifest.finance.root,
  appRouteManifest.finance.commissions,
  appRouteManifest.finance.professionals,
  appRouteManifest.finance.license,
  appRouteManifest.audit.root,
  appRouteManifest.audit.lgpd,
  appRouteManifest.settings.systemAdmin,
  appRouteManifest.fiscal.invoiceEmission,
  appRouteManifest.fiscal.invoicePreview,
  appRouteManifest.fiscal.monthlyTaxStatement,
] as const;

export const FINANCIAL_GROUP_PATHS = [
  appRouteManifest.finance.root,
  appRouteManifest.finance.commissions,
  appRouteManifest.finance.professionals,
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
  Boxes,
  User,
  MessageCircleMore,
  Lightbulb,
};

export const DYNAMIC_BOTTOM_ROUTES = new Set([
  appRouteManifest.profiles.salon,
  appRouteManifest.settings.root,
]);

export const STANDALONE_LAST_ROUTES = new Set([appRouteManifest.finance.license]);
export const GROUP_ONLY_ROUTES = new Set([appRouteManifest.reports.root]);

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
    label: "Perfil do Salao",
    icon: Building2,
    isVisible: (role: string | null | undefined, allowedSet: Set<string>) =>
      role === "OWNER" && allowedSet.has(appRouteManifest.profiles.salon),
  },
  {
    path: appRouteManifest.settings.root,
    label: "Configuracoes",
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
    label: "Base do negocio",
    paths: new Set([
      appRouteManifest.clients.root,
      appRouteManifest.services.root,
      appRouteManifest.specialties.root,
      appRouteManifest.professionals.root,
    ]),
  },
  {
    id: "gestao",
    label: "Gestao",
    paths: new Set([
      appRouteManifest.finance.root,
      appRouteManifest.stock.root,
      appRouteManifest.shell.suggestions,
      appRouteManifest.audit.root,
      appRouteManifest.settings.systemAdmin,
      appRouteManifest.fiscal.invoiceEmission,
      appRouteManifest.fiscal.invoicePreview,
      appRouteManifest.fiscal.monthlyTaxStatement,
    ]),
  },
] as const;
