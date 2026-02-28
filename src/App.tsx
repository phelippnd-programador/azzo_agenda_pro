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
import Clients from "./pages/Clients";
import Stock from "./pages/Stock";
import StockOverview from "./pages/stock/StockOverview";
import StockItemsPage from "./pages/stock/StockItemsPage";
import StockMovementsPage from "./pages/stock/StockMovementsPage";
import StockImportsPage from "./pages/stock/StockImportsPage";
import StockImportDetailPage from "./pages/stock/StockImportDetailPage";
import StockFeaturePlaceholderPage from "./pages/stock/StockFeaturePlaceholderPage";
import Financial from "./pages/Financial";
import ProfessionalFinancial from "./pages/ProfessionalFinancial";
import Auditoria from "./pages/Auditoria";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import Notifications from "./pages/Notifications";
import PublicBooking from "./pages/PublicBooking";
import Settings from "./pages/Settings";
import LicensePage from "./pages/LicensePage";
import SalonProfile from "./pages/SalonProfile";
import TaxConfig from "./pages/TaxConfig";
import InvoicePreview from "./pages/InvoicePreview";
import InvoiceEmission from "./pages/InvoiceEmission";
import ApuracaoMensal from "./pages/ApuracaoMensal";
import WhatsAppIntegration from "./pages/WhatsAppIntegration";
import Unauthorized from "./pages/Unauthorized";
import LegalDocument from "./pages/LegalDocument";
import { NotificationsProvider } from "@/providers/NotificationsProvider";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

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
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const { canAccess, isLoading: isPermissionsLoading } = useMenuPermissions();

  if (isLoading || isPermissionsLoading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccess(location.pathname)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirects to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { allowedRoutes, isLoading: isPermissionsLoading } = useMenuPermissions();

  if (isLoading || (isAuthenticated && isPermissionsLoading)) {
    return <FullScreenLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to={getFirstAllowedRoute(allowedRoutes)} replace />;
  }

  return <>{children}</>;
}

function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const { allowedRoutes, isLoading: isPermissionsLoading } = useMenuPermissions();

  if (isLoading || (isAuthenticated && isPermissionsLoading)) {
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
          path="/clientes"
          element={
            <ProtectedRoute>
              <Clients />
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
          <Route
            path="inventarios"
            element={
              <StockFeaturePlaceholderPage
                title="Inventarios"
                description="Contagem ciclica e conciliacao de divergencias de estoque."
              />
            }
          />
          <Route
            path="inventarios/novo"
            element={
              <StockFeaturePlaceholderPage
                title="Novo inventario"
                description="Abertura de inventario para contagem por periodo, item ou categoria."
              />
            }
          />
          <Route
            path="inventarios/:id"
            element={
              <StockFeaturePlaceholderPage
                title="Detalhe de inventario"
                description="Acompanhamento da contagem, divergencias e fechamento do inventario."
              />
            }
          />
          <Route
            path="fornecedores"
            element={
              <StockFeaturePlaceholderPage
                title="Fornecedores"
                description="Cadastro e gestao de fornecedores para compras de insumos."
              />
            }
          />
          <Route
            path="pedidos-compra"
            element={
              <StockFeaturePlaceholderPage
                title="Pedidos de compra"
                description="Fluxo de criacao, envio e recebimento de pedidos de compra."
              />
            }
          />
          <Route
            path="pedidos-compra/:id"
            element={
              <StockFeaturePlaceholderPage
                title="Detalhe do pedido de compra"
                description="Itens, status de recebimento parcial e lancamentos financeiros relacionados."
              />
            }
          />
          <Route
            path="transferencias"
            element={
              <StockFeaturePlaceholderPage
                title="Transferencias"
                description="Transferencia de estoque entre filiais e controle de envio/recebimento."
              />
            }
          />
          <Route
            path="configuracoes"
            element={
              <StockFeaturePlaceholderPage
                title="Configuracoes de estoque"
                description="Parametros operacionais, alertas e politicas de reposicao."
              />
            }
          />
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
          path="/configuracoes"
          element={
            <ProtectedRoute>
              <Settings />
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
          path="/config-impostos"
          element={
            <ProtectedRoute>
              <TaxConfig />
            </ProtectedRoute>
          }
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
            </NotificationsProvider>
          </BrowserRouter>
        </TooltipProvider>
      </MenuPermissionsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
