const prefetchedPrefixes = new Set<string>();

const routePrefetchers: Array<{
  prefix: string;
  load: () => Promise<unknown>;
}> = [
  {
    prefix: "/dashboard",
    load: () => import("@/pages/Index"),
  },
  {
    prefix: "/agenda",
    load: () => import("@/pages/appointments/Agenda"),
  },
  {
    prefix: "/chat",
    load: () => import("@/pages/Chat"),
  },
  {
    prefix: "/clientes",
    load: () =>
      Promise.all([
        import("@/pages/Clients"),
        import("@/pages/clients/ClientsOverviewPage"),
      ]),
  },
  {
    prefix: "/servicos",
    load: () =>
      Promise.all([
        import("@/pages/Services"),
        import("@/pages/services/ServicesOverviewPage"),
      ]),
  },
  {
    prefix: "/especialidades",
    load: () =>
      Promise.all([
        import("@/pages/Specialties"),
        import("@/pages/specialties/SpecialtiesOverviewPage"),
      ]),
  },
  {
    prefix: "/profissionais",
    load: () => import("@/pages/Professionals"),
  },
  {
    prefix: "/configuracoes",
    load: () => import("@/pages/Settings"),
  },
  {
    prefix: "/notificacoes",
    load: () => import("@/pages/Notifications"),
  },
  {
    prefix: "/estoque",
    load: () =>
      Promise.all([
        import("@/pages/Stock"),
        import("@/pages/stock/StockOverview"),
      ]),
  },
  {
    prefix: "/financeiro",
    load: () => import("@/pages/Financial"),
  },
  {
    prefix: "/relatorio",
    load: () => import("@/pages/report/AppointmentManagementReport"),
  },
  {
    prefix: "/perfil-salao",
    load: () => import("@/pages/SalonProfile"),
  },
];

export function prefetchRouteModule(pathname: string) {
  const match = routePrefetchers.find(({ prefix }) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!match || prefetchedPrefixes.has(match.prefix)) {
    return;
  }

  prefetchedPrefixes.add(match.prefix);
  void match.load().catch(() => {
    prefetchedPrefixes.delete(match.prefix);
  });
}
