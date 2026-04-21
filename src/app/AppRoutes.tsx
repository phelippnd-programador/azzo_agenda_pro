import { Suspense } from "react";
import { Navigate, Routes, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { RouteContentLoader } from "@/components/ui/route-content-loader";
import { useAuth } from "@/contexts/AuthContext";
import { useMenuPermissions } from "@/contexts/MenuPermissionsContext";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { isFiscalOwnerPath } from "@/lib/fiscal-paths";
import {
  appRouteManifest,
  defaultProtectedRouteByRole,
  preferredProtectedRoutesByRole,
} from "@/app/route-manifest";
import { PublicRouteGroup } from "@/app/routes/public-route-group";
import { ProtectedRouteGroup } from "@/app/routes/protected-route-group";

const getFirstAllowedRoute = (
  allowedRoutes: string[] | null,
  role?: string | null,
) => {
  if (!allowedRoutes?.length) {
    return role === "PROFESSIONAL"
      ? defaultProtectedRouteByRole.PROFESSIONAL
      : defaultProtectedRouteByRole.DEFAULT;
  }

  const preferredRoutes =
    role === "PROFESSIONAL"
      ? preferredProtectedRoutesByRole.PROFESSIONAL
      : preferredProtectedRoutesByRole.DEFAULT;

  const preferredRoute = preferredRoutes.find((route) =>
    allowedRoutes.includes(route),
  );
  if (preferredRoute) {
    return preferredRoute;
  }

  const firstBusinessRoute = allowedRoutes.find(
    (route) => route !== appRouteManifest.shell.unauthorized,
  );

  return (
    firstBusinessRoute ||
    (role === "PROFESSIONAL"
      ? defaultProtectedRouteByRole.PROFESSIONAL
      : defaultProtectedRouteByRole.DEFAULT)
  );
};

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const {
    canAccess,
    isLoading: isPermissionsLoading,
    isEnforced,
  } = useMenuPermissions();

  if (isLoading || isPermissionsLoading || (isAuthenticated && !isEnforced)) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={appRouteManifest.public.login} replace />;
  }

  if (isFiscalOwnerPath(location.pathname) && user?.role !== "OWNER") {
    return <Navigate to={appRouteManifest.shell.unauthorized} replace />;
  }

  if (
    location.pathname.startsWith(appRouteManifest.settings.systemAdmin) &&
    user?.role !== "ADMIN"
  ) {
    return <Navigate to={appRouteManifest.shell.unauthorized} replace />;
  }

  if (!canAccess(location.pathname)) {
    return <Navigate to={appRouteManifest.shell.unauthorized} replace />;
  }

  return (
    <Suspense
      fallback={
        <MainLayout
          title="Carregando modulo"
          subtitle="Preparando o conteudo da pagina"
        >
          <RouteContentLoader />
        </MainLayout>
      }
    >
      {children}
    </Suspense>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const {
    allowedRoutes,
    isLoading: isPermissionsLoading,
    isEnforced,
  } = useMenuPermissions();

  if (isLoading || (isAuthenticated && (isPermissionsLoading || !isEnforced))) {
    return <FullScreenLoader />;
  }

  if (isAuthenticated) {
    return (
      <Navigate to={getFirstAllowedRoute(allowedRoutes, user?.role)} replace />
    );
  }

  return <Suspense fallback={<FullScreenLoader />}>{children}</Suspense>;
}

function PublicLazyRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<FullScreenLoader />}>{children}</Suspense>;
}

function RootRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const {
    allowedRoutes,
    isLoading: isPermissionsLoading,
    isEnforced,
  } = useMenuPermissions();

  if (isLoading || (isAuthenticated && (isPermissionsLoading || !isEnforced))) {
    return <FullScreenLoader />;
  }

  return (
    <Navigate
      to={
        isAuthenticated
          ? getFirstAllowedRoute(allowedRoutes, user?.role)
          : appRouteManifest.public.sales
      }
      replace
    />
  );
}

export function AppRoutes() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  return (
    <Routes>
      {PublicRouteGroup({
        RootRoute,
        PublicRoute,
        PublicLazyRoute,
      })}
      {ProtectedRouteGroup({ ProtectedRoute })}
    </Routes>
  );
}
