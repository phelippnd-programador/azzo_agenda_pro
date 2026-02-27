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
  useParams,
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
import Financial from "./pages/Financial";
import ProfessionalFinancial from "./pages/ProfessionalFinancial";
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
import { NotificationsProvider } from "@/providers/NotificationsProvider";

const SalePage = lazy(() => import("./pages/SalePage"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutError = lazy(() => import("./pages/CheckoutError"));

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const { canAccess, isLoading: isPermissionsLoading } = useMenuPermissions();

  if (isLoading || isPermissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  function LegacySaleRedirect() {
    const { productId } = useParams();
    return <Navigate to={productId ? `/compras/${productId}` : "/compras"} replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
        </div>
      }
    >
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/compras"} replace />}
        />
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
        <Route path="/compras" element={<SalePage />} />
        <Route path="/compras/:productId" element={<SalePage />} />
        <Route path="/sale/:productId" element={<LegacySaleRedirect />} />
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
