import { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMenuPermissions } from "@/contexts/MenuPermissionsContext";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { isFiscalOwnerPath } from "@/lib/fiscal-paths";
import {
  appRouteManifest,
  defaultProtectedRouteByRole,
  preferredProtectedRoutesByRole,
} from "@/app/route-manifest";
import ForgotPassword from "@/pages/ForgotPassword";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ResetPassword from "@/pages/ResetPassword";
import PublicBooking from "@/pages/appointments/PublicBooking";

const Index = lazy(() => import("@/pages/Index"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Services = lazy(() => import("@/pages/Services"));
const ServicesOverviewPage = lazy(() => import("@/pages/services/ServicesOverviewPage"));
const ServiceImportsPage = lazy(() => import("@/pages/services/ServiceImportsPage"));
const ServiceImportDetailPage = lazy(() => import("@/pages/services/ServiceImportDetailPage"));
const Specialties = lazy(() => import("@/pages/Specialties"));
const SpecialtiesOverviewPage = lazy(
  () => import("@/pages/specialties/SpecialtiesOverviewPage")
);
const SpecialtyImportsPage = lazy(() => import("@/pages/specialties/SpecialtyImportsPage"));
const SpecialtyImportDetailPage = lazy(
  () => import("@/pages/specialties/SpecialtyImportDetailPage")
);
const Professionals = lazy(() => import("@/pages/Professionals"));
const ProfessionalProfile = lazy(() => import("@/pages/ProfessionalProfile"));
const ProfessionalCommissionSettings = lazy(
  () => import("@/pages/ProfessionalCommissionSettings")
);
const Clients = lazy(() => import("@/pages/Clients"));
const ClientProfile = lazy(() => import("@/pages/ClientProfile"));
const ClientImportsPage = lazy(() => import("@/pages/clients/ClientImportsPage"));
const ClientImportDetailPage = lazy(() => import("@/pages/clients/ClientImportDetailPage"));
const ClientsOverviewPage = lazy(() => import("@/pages/clients/ClientsOverviewPage"));
const SuggestionsPage = lazy(() => import("@/pages/Suggestions"));
const ChatPage = lazy(() => import("@/pages/Chat"));
const Stock = lazy(() => import("@/pages/Stock"));
const StockOverview = lazy(() => import("@/pages/stock/StockOverview"));
const StockItemsPage = lazy(() => import("@/pages/stock/StockItemsPage"));
const StockMovementsPage = lazy(() => import("@/pages/stock/StockMovementsPage"));
const StockImportsPage = lazy(() => import("@/pages/stock/StockImportsPage"));
const StockImportDetailPage = lazy(() => import("@/pages/stock/StockImportDetailPage"));
const StockInventoriesPage = lazy(() => import("@/pages/stock/StockInventoriesPage"));
const StockSuppliersPage = lazy(() => import("@/pages/stock/StockSuppliersPage"));
const StockPurchaseOrdersPage = lazy(
  () => import("@/pages/stock/StockPurchaseOrdersPage")
);
const StockTransfersPage = lazy(() => import("@/pages/stock/StockTransfersPage"));
const StockSettingsPage = lazy(() => import("@/pages/stock/StockSettingsPage"));
const FinancialCommissions = lazy(() => import("@/pages/FinancialCommissions"));
const ProfessionalFinancial = lazy(() => import("@/pages/ProfessionalFinancial"));
const ProfessionalCommissionReport = lazy(
  () => import("@/pages/report/ProfessionalCommissionReport")
);
const Auditoria = lazy(() => import("@/pages/Auditoria"));
const LgpdRequests = lazy(() => import("@/pages/LgpdRequests"));
const Settings = lazy(() => import("@/pages/Settings"));
const LicensePage = lazy(() => import("@/pages/LicensePage"));
const SalonProfile = lazy(() => import("@/pages/SalonProfile"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const AppointmentManagementReport = lazy(
  () => import("@/pages/report/AppointmentManagementReport")
);
const AbandonmentReport = lazy(() => import("@/pages/report/AbandonmentReport"));
const NoShowReport = lazy(() => import("@/pages/report/NoShowReport"));
const TaxConfig = lazy(() => import("@/pages/tax/TaxConfig"));
const FiscalCertificatesSettings = lazy(
  () => import("@/pages/tax/FiscalCertificatesSettings")
);
const NfseSettings = lazy(() => import("@/pages/tax/NfseSettings"));
const NfseInvoices = lazy(() => import("@/pages/tax/NfseInvoices"));
const NfseInvoiceForm = lazy(() => import("@/pages/tax/NfseInvoiceForm"));
const NfseInvoiceDetails = lazy(() => import("@/pages/tax/NfseInvoiceDetails"));
const NfseInvoicePdf = lazy(() => import("@/pages/tax/NfseInvoicePdf"));
const InvoicePreview = lazy(() => import("@/pages/tax/InvoicePreview"));
const InvoiceEmission = lazy(() => import("@/pages/tax/InvoiceEmission"));
const ApuracaoMensal = lazy(() => import("@/pages/tax/ApuracaoMensal"));
const WhatsAppIntegration = lazy(() => import("@/pages/WhatsAppIntegration"));
const Unauthorized = lazy(() => import("@/pages/Unauthorized"));
const LegalDocument = lazy(() => import("@/pages/LegalDocument"));
const SalePage = lazy(() => import("@/pages/SalePage"));
const CheckoutSuccess = lazy(() => import("@/pages/CheckoutSuccess"));
const CheckoutError = lazy(() => import("@/pages/CheckoutError"));
const Agenda = lazy(() => import("@/pages/appointments/Agenda"));
const Financial = lazy(() => import("@/pages/Financial"));
const SystemAdminPage = lazy(() => import("@/pages/SystemAdmin"));

const getFirstAllowedRoute = (
  allowedRoutes: string[] | null,
  role?: string | null
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

  const preferredRoute = preferredRoutes.find((route) => allowedRoutes.includes(route));
  if (preferredRoute) {
    return preferredRoute;
  }

  const firstBusinessRoute = allowedRoutes.find(
    (route) => route !== appRouteManifest.shell.unauthorized
  );

  return firstBusinessRoute ||
    (role === "PROFESSIONAL"
      ? defaultProtectedRouteByRole.PROFESSIONAL
      : defaultProtectedRouteByRole.DEFAULT);
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

  return <>{children}</>;
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
    return <Navigate to={getFirstAllowedRoute(allowedRoutes, user?.role)} replace />;
  }

  return <>{children}</>;
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
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path={appRouteManifest.public.root} element={<RootRoute />} />
        <Route
          path={appRouteManifest.public.login}
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path={appRouteManifest.public.forgotPassword}
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route path={appRouteManifest.public.resetPassword} element={<ResetPassword />} />
        <Route
          path={appRouteManifest.public.register}
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route path={appRouteManifest.public.publicBooking} element={<PublicBooking />} />
        <Route
          path={appRouteManifest.public.termsOfUse}
          element={<LegalDocument documentType="TERMS_OF_USE" fallbackTitle="Termos de Uso" />}
        />
        <Route
          path={appRouteManifest.public.privacyPolicy}
          element={
            <LegalDocument
              documentType="PRIVACY_POLICY"
              fallbackTitle="Politica de Privacidade"
            />
          }
        />
        <Route path={appRouteManifest.public.sales} element={<SalePage />} />
        <Route path={appRouteManifest.public.salesProduct} element={<SalePage />} />
        <Route path={appRouteManifest.public.checkoutSuccess} element={<CheckoutSuccess />} />
        <Route path={appRouteManifest.public.checkoutError} element={<CheckoutError />} />

        <Route
          path={appRouteManifest.shell.dashboard}
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.shell.notifications}
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.shell.agenda}
          element={
            <ProtectedRoute>
              <Agenda />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.reports.root}
          element={
            <ProtectedRoute>
              <Navigate to={appRouteManifest.reports.appointments} replace />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.reports.appointments}
          element={
            <ProtectedRoute>
              <AppointmentManagementReport />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.reports.noShow}
          element={
            <ProtectedRoute>
              <NoShowReport />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.reports.abandonment}
          element={
            <ProtectedRoute>
              <AbandonmentReport />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.reports.legacyRoot}
          element={
            <ProtectedRoute>
              <Navigate to={appRouteManifest.reports.appointments} replace />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.reports.legacyAppointments}
          element={
            <ProtectedRoute>
              <Navigate to={appRouteManifest.reports.appointments} replace />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.reports.legacyAppointmentsPlural}
          element={
            <ProtectedRoute>
              <Navigate to={appRouteManifest.reports.appointments} replace />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.reports.legacyNoShow}
          element={
            <ProtectedRoute>
              <Navigate to={appRouteManifest.reports.noShow} replace />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.reports.legacyAbandonment}
          element={
            <ProtectedRoute>
              <Navigate to={appRouteManifest.reports.abandonment} replace />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.reports.agendaNoShow}
          element={
            <ProtectedRoute>
              <Navigate to={appRouteManifest.reports.noShow} replace />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.reports.agendaNoShowWildcard}
          element={
            <ProtectedRoute>
              <Navigate to={appRouteManifest.reports.noShow} replace />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.services.root}
          element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          }
        >
          <Route index element={<ServicesOverviewPage />} />
          <Route path={appRouteManifest.services.imports} element={<ServiceImportsPage />} />
          <Route
            path={appRouteManifest.services.importDetail}
            element={<ServiceImportDetailPage />}
          />
        </Route>
        <Route
          path={appRouteManifest.specialties.root}
          element={
            <ProtectedRoute>
              <Specialties />
            </ProtectedRoute>
          }
        >
          <Route index element={<SpecialtiesOverviewPage />} />
          <Route path={appRouteManifest.specialties.imports} element={<SpecialtyImportsPage />} />
          <Route
            path={appRouteManifest.specialties.importDetail}
            element={<SpecialtyImportDetailPage />}
          />
        </Route>
        <Route
          path={appRouteManifest.professionals.root}
          element={
            <ProtectedRoute>
              <Professionals />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.professionals.profile}
          element={
            <ProtectedRoute>
              <ProfessionalProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.professionals.commission}
          element={
            <ProtectedRoute>
              <ProfessionalCommissionSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.clients.root}
          element={
            <ProtectedRoute>
              <Clients />
            </ProtectedRoute>
          }
        >
          <Route index element={<ClientsOverviewPage />} />
          <Route path={appRouteManifest.clients.imports} element={<ClientImportsPage />} />
          <Route
            path={appRouteManifest.clients.importDetail}
            element={<ClientImportDetailPage />}
          />
        </Route>
        <Route
          path={appRouteManifest.clients.profile}
          element={
            <ProtectedRoute>
              <ClientProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.shell.suggestions}
          element={
            <ProtectedRoute>
              <SuggestionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.chat.root}
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.chat.conversation}
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.stock.root}
          element={
            <ProtectedRoute>
              <Stock />
            </ProtectedRoute>
          }
        >
          <Route path={appRouteManifest.stock.overview} element={<StockOverview />} />
          <Route path={appRouteManifest.stock.items} element={<StockItemsPage />} />
          <Route path={appRouteManifest.stock.itemCreate} element={<StockItemsPage />} />
          <Route path={appRouteManifest.stock.itemEdit} element={<StockItemsPage />} />
          <Route path={appRouteManifest.stock.movements} element={<StockMovementsPage />} />
          <Route path={appRouteManifest.stock.movementCreate} element={<StockMovementsPage />} />
          <Route path={appRouteManifest.stock.imports} element={<StockImportsPage />} />
          <Route
            path={appRouteManifest.stock.importDetail}
            element={<StockImportDetailPage />}
          />
          <Route path={appRouteManifest.stock.inventories} element={<StockInventoriesPage />} />
          <Route
            path={appRouteManifest.stock.inventoryCreate}
            element={<StockInventoriesPage />}
          />
          <Route
            path={appRouteManifest.stock.inventoryDetail}
            element={<StockInventoriesPage />}
          />
          <Route path={appRouteManifest.stock.suppliers} element={<StockSuppliersPage />} />
          <Route
            path={appRouteManifest.stock.purchaseOrders}
            element={<StockPurchaseOrdersPage />}
          />
          <Route
            path={appRouteManifest.stock.purchaseOrderDetail}
            element={<StockPurchaseOrdersPage />}
          />
          <Route path={appRouteManifest.stock.transfers} element={<StockTransfersPage />} />
          <Route
            path={appRouteManifest.stock.settingsAlias}
            element={<Navigate to={appRouteManifest.settings.stock} replace />}
          />
        </Route>
        <Route
          path={appRouteManifest.finance.root}
          element={
            <ProtectedRoute>
              <Financial />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.finance.commissions}
          element={
            <ProtectedRoute>
              <FinancialCommissions />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.finance.professionalCommission}
          element={
            <ProtectedRoute>
              <ProfessionalCommissionReport />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.finance.professionals}
          element={
            <ProtectedRoute>
              <ProfessionalFinancial />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.finance.license}
          element={
            <ProtectedRoute>
              <LicensePage />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.audit.root}
          element={
            <ProtectedRoute>
              <Auditoria />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.audit.lgpd}
          element={
            <ProtectedRoute>
              <LgpdRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.settings.root}
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.settings.stock}
          element={
            <ProtectedRoute>
              <StockSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.profiles.user}
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.profiles.salon}
          element={
            <ProtectedRoute>
              <SalonProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.settings.fiscalTaxes}
          element={
            <ProtectedRoute>
              <TaxConfig />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.settings.fiscalCertificates}
          element={
            <ProtectedRoute>
              <FiscalCertificatesSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.settings.fiscalNfse}
          element={
            <ProtectedRoute>
              <NfseSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.fiscal.invoices}
          element={
            <ProtectedRoute>
              <NfseInvoices />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.fiscal.invoiceCreate}
          element={
            <ProtectedRoute>
              <NfseInvoiceForm />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.fiscal.invoiceDetail}
          element={
            <ProtectedRoute>
              <NfseInvoiceDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.fiscal.invoiceEdit}
          element={
            <ProtectedRoute>
              <NfseInvoiceForm />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.fiscal.invoicePdf}
          element={
            <ProtectedRoute>
              <NfseInvoicePdf />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.fiscal.taxAlias}
          element={<Navigate to={appRouteManifest.settings.fiscalTaxes} replace />}
        />
        <Route
          path={appRouteManifest.fiscal.invoicePreview}
          element={
            <ProtectedRoute>
              <InvoicePreview />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.fiscal.invoiceEmission}
          element={
            <ProtectedRoute>
              <InvoiceEmission />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.fiscal.monthlyTaxStatement}
          element={
            <ProtectedRoute>
              <ApuracaoMensal />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.settings.whatsapp}
          element={
            <ProtectedRoute>
              <WhatsAppIntegration />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.settings.systemAdmin}
          element={
            <ProtectedRoute>
              <SystemAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={appRouteManifest.shell.unauthorized}
          element={
            <ProtectedRoute>
              <Unauthorized />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}
