import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Agenda from "./pages/Agenda";
import Services from "./pages/Services";
import Professionals from "./pages/Professionals";
import Clients from "./pages/Clients";
import Financial from "./pages/Financial";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PublicBooking from "./pages/PublicBooking";
import Settings from "./pages/Settings";
import SalonProfile from "./pages/SalonProfile";
import TaxConfig from "./pages/TaxConfig";
import InvoicePreview from "./pages/InvoicePreview";
import InvoiceEmission from "./pages/InvoiceEmission";
import ApuracaoMensal from "./pages/ApuracaoMensal";

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
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

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Index />
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
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;