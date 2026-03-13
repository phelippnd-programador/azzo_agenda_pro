import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import {
  MenuPermissionsProvider,
  useMenuPermissions,
} from "@/contexts/MenuPermissionsContext";
import Index from "./pages/Index";
import Agenda from "./pages/Agenda";
import Services from "./pages/Services";
import Specialties from "./pages/Specialties";
import Professionals from "./pages/Professionals";
import ProfessionalProfile from "./pages/ProfessionalProfile";
import ProfessionalCommissionSettings from "./pages/ProfessionalCommissionSettings";
import Clients from "./pages/Clients";
import ClientProfile from "./pages/ClientProfile";
import SuggestionsPage from "./pages/Suggestions";
import ChatPage from "./pages/Chat";
import Stock from "./pages/Stock";
import StockOverview from "./pages/stock/StockOverview";
import StockItemsPage from "./pages/stock/StockItemsPage";
import StockMovementsPage from "./pages/stock/StockMovementsPage";
import StockImportsPage from "./pages/stock/StockImportsPage";
import StockImportDetailPage from "./pages/stock/StockImportDetailPage";
import StockInventoriesPage from "./pages/stock/StockInventoriesPage";
import StockSuppliersPage from "./pages/stock/StockSuppliersPage";
import StockPurchaseOrdersPage from "./pages/stock/StockPurchaseOrdersPage";
import StockTransfersPage from "./pages/stock/StockTransfersPage";
import StockSettingsPage from "./pages/stock/StockSettingsPage";
import Financial from "./pages/Financial";
import FinancialCommissions from "./pages/FinancialCommissions";
import ProfessionalFinancial from "./pages/ProfessionalFinancial";
import ProfessionalCommissionReport from "./pages/ProfessionalCommissionReport";
import Auditoria from "./pages/Auditoria";
import LgpdRequests from "./pages/LgpdRequests";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import Notifications from "./pages/Notifications";
import PublicBooking from "./pages/PublicBooking";
import Settings from "./pages/Settings";
import LicensePage from "./pages/LicensePage";
import SalonProfile from "./pages/SalonProfile";
import TaxConfig from "./pages/TaxConfig";
import FiscalCertificatesSettings from "./pages/FiscalCertificatesSettings";
import NfseSettings from "./pages/NfseSettings";
import NfseInvoices from "./pages/NfseInvoices";
import NfseInvoiceForm from "./pages/NfseInvoiceForm";
import NfseInvoiceDetails from "./pages/NfseInvoiceDetails";
import NfseInvoicePdf from "./pages/NfseInvoicePdf";
import SystemAdminPage from "./pages/SystemAdmin";
import InvoicePreview from "./pages/InvoicePreview";
import InvoiceEmission from "./pages/InvoiceEmission";
import ApuracaoMensal from "./pages/ApuracaoMensal";
import WhatsAppIntegration from "./pages/WhatsAppIntegration";
import Unauthorized from "./pages/Unauthorized";
import LegalDocument from "./pages/LegalDocument";
import { NotificationsProvider } from "@/providers/NotificationsProvider";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";

const SalePage = lazy(() => import("./pages/SalePage"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutError = lazy(() => import("./pages/CheckoutError"));

const queryClient = new QueryClient();

const getFirstAllowedRoute = (allowedRoutes: string[] | null) => {
  if (!allowedRoutes?.length) return "/dashboard";
  const firstBusinessRoute = allowedRoutes.find((route) => route !== "/unauthorized");
  return firstBusinessRoute || "/dashboard";
};

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const { canAccess, isLoading: isPermissionsLoading, isEnforced } = useMenuPermissions();
  const isFiscalOwnerOnlyPath =
    location.pathname.startsWith("/emitir-nota")
    || location.pathname.startsWith("/nota-fiscal")
    || location.pathname.startsWith("/apuracao-mensal")
    || location.pathname.startsWith("/configuracoes/fiscal")
    || location.pathname.startsWith("/fiscal/nfse")
    || location.pathname.startsWith("/config-impostos");
  const isSystemAdminPath = location.pathname.startsWith("/configuracoes/admin-sistema");

  if (isLoading || isPermissionsLoading || (isAuthenticated && !isEnforced)) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isFiscalOwnerOnlyPath && user?.role !== "OWNER") {
    return <Navigate to="/unauthorized" replace />;
  }

  if (isSystemAdminPath && user?.role !== "ADMIN") {
    return <Navigate to="/unauthorized" replace />;
  }

  if (!canAccess(location.pathname)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirects to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { allowedRoutes, isLoading: isPermissionsLoading, isEnforced } = useMenuPermissions();

  if (isLoading || (isAuthenticated && (isPermissionsLoading || !isEnforced))) {
    return <FullScreenLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to={getFirstAllowedRoute(allowedRoutes)} replace />;
  }

  return <>{children}</>;
}

function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const { allowedRoutes, isLoading: isPermissionsLoading, isEnforced } = useMenuPermissions();

  if (isLoading || (isAuthenticated && (isPermissionsLoading || !isEnforced))) {
    return <FullScreenLoader />;
  }

  return (
    <Navigate
      to={isAuthenticated ? getFirstAllowedRoute(allowedRoutes) : "/compras"}
      replace
    />
  );
}

function AppRoutes() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  return (
    <Suspense
      fallback={
        <FullScreenLoader />
      }
    >
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<RootRoute />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/recuperar-senha"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/cadastro"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route path="/agendar/:slug" element={<PublicBooking />} />
        <Route
          path="/termos-de-uso"
          element={<LegalDocument documentType="TERMS_OF_USE" fallbackTitle="Termos de Uso" />}
        />
        <Route
          path="/politica-privacidade"
          element={
            <LegalDocument
              documentType="PRIVACY_POLICY"
              fallbackTitle="Politica de Privacidade"
            />
          }
        />
        <Route path="/compras" element={<SalePage />} />
        <Route path="/compras/:productId" element={<SalePage />} />
        <Route path="/success" element={<CheckoutSuccess />} />
        <Route path="/error" element={<CheckoutError />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notificacoes"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agenda"
          element={
            <ProtectedRoute>
              <Agenda />
            </ProtectedRoute>
          }
        />
        <Route
          path="/servicos"
          element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          }
        />
        <Route
          path="/especialidades"
          element={
            <ProtectedRoute>
              <Specialties />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profissionais"
          element={
            <ProtectedRoute>
              <Professionals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profissionais/:id"
          element={
            <ProtectedRoute>
              <ProfessionalProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profissionais/:id/comissao"
          element={
            <ProtectedRoute>
              <ProfessionalCommissionSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <ProtectedRoute>
              <Clients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes/:id"
          element={
            <ProtectedRoute>
              <ClientProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sugestoes"
          element={
            <ProtectedRoute>
              <SuggestionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:conversationId"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estoque"
          element={
            <ProtectedRoute>
              <Stock />
            </ProtectedRoute>
          }
        >
          <Route path="visao-geral" element={<StockOverview />} />
          <Route path="itens" element={<StockItemsPage />} />
          <Route path="itens/novo" element={<StockItemsPage />} />
          <Route path="itens/:id/editar" element={<StockItemsPage />} />
          <Route path="movimentacoes" element={<StockMovementsPage />} />
          <Route path="movimentacoes/nova" element={<StockMovementsPage />} />
          <Route path="importacoes" element={<StockImportsPage />} />
          <Route path="importacoes/:jobId" element={<StockImportDetailPage />} />
          <Route path="inventarios" element={<StockInventoriesPage />} />
          <Route path="inventarios/novo" element={<StockInventoriesPage />} />
          <Route path="inventarios/:id" element={<StockInventoriesPage />} />
          <Route path="fornecedores" element={<StockSuppliersPage />} />
          <Route path="pedidos-compra" element={<StockPurchaseOrdersPage />} />
          <Route path="pedidos-compra/:id" element={<StockPurchaseOrdersPage />} />
          <Route path="transferencias" element={<StockTransfersPage />} />
          <Route path="configuracoes" element={<Navigate to="/configuracoes/estoque" replace />} />
        </Route>
        <Route
          path="/financeiro"
          element={
            <ProtectedRoute>
              <Financial />
            </ProtectedRoute>
          }
        />
        <Route
          path="/financeiro/comissoes"
          element={
            <ProtectedRoute>
              <FinancialCommissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/financeiro/comissoes/:professionalId"
          element={
            <ProtectedRoute>
              <ProfessionalCommissionReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/financeiro/profissionais"
          element={
            <ProtectedRoute>
              <ProfessionalFinancial />
            </ProtectedRoute>
          }
        />
        <Route
          path="/financeiro/licenca"
          element={
            <ProtectedRoute>
              <LicensePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auditoria"
          element={
            <ProtectedRoute>
              <Auditoria />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auditoria/lgpd"
          element={
            <ProtectedRoute>
              <LgpdRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes/estoque"
          element={
            <ProtectedRoute>
              <StockSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil-salao"
          element={
            <ProtectedRoute>
              <SalonProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes/fiscal/impostos"
          element={
            <ProtectedRoute>
              <TaxConfig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes/fiscal/certificados"
          element={
            <ProtectedRoute>
              <FiscalCertificatesSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes/fiscal/nfse"
          element={
            <ProtectedRoute>
              <NfseSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fiscal/nfse"
          element={
            <ProtectedRoute>
              <NfseInvoices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fiscal/nfse/nova"
          element={
            <ProtectedRoute>
              <NfseInvoiceForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fiscal/nfse/:id"
          element={
            <ProtectedRoute>
              <NfseInvoiceDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fiscal/nfse/:id/editar"
          element={
            <ProtectedRoute>
              <NfseInvoiceForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fiscal/nfse/:id/pdf"
          element={
            <ProtectedRoute>
              <NfseInvoicePdf />
            </ProtectedRoute>
          }
        />
        <Route
          path="/config-impostos"
          element={<Navigate to="/configuracoes/fiscal/impostos" replace />}
        />
        <Route
          path="/nota-fiscal"
          element={
            <ProtectedRoute>
              <InvoicePreview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emitir-nota"
          element={
            <ProtectedRoute>
              <InvoiceEmission />
            </ProtectedRoute>
          }
        />
        <Route
          path="/apuracao-mensal"
          element={
            <ProtectedRoute>
              <ApuracaoMensal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes/integracoes/whatsapp"
          element={
            <ProtectedRoute>
              <WhatsAppIntegration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes/admin-sistema"
          element={
            <ProtectedRoute>
              <SystemAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/unauthorized"
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MenuPermissionsProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <NotificationsProvider>
              <AppRoutes />
              <CookieConsentBanner />
            </NotificationsProvider>
          </BrowserRouter>
        </TooltipProvider>
      </MenuPermissionsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
