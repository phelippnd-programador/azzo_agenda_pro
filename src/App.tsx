import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MenuPermissionsProvider } from "@/contexts/MenuPermissionsContext";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationsProvider } from "@/providers/NotificationsProvider";
import { AppRoutes } from "@/app/AppRoutes";

const queryClient = new QueryClient();

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
