import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MenuPermissionsProvider } from "@/contexts/MenuPermissionsContext";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { AppUpdateBanner } from "@/components/layout/AppUpdateBanner";
import { PwaInstallBanner } from "@/components/layout/PwaInstallBanner";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationsProvider } from "@/providers/NotificationsProvider";
import { AttendanceConfirmationProvider } from "@/providers/AttendanceConfirmationProvider";
import { AppRoutes } from "@/app/AppRoutes";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <MenuPermissionsProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <NotificationsProvider>
                <AttendanceConfirmationProvider>
                  <AppUpdateBanner />
                  <AppRoutes />
                  <PwaInstallBanner />
                  <CookieConsentBanner />
                </AttendanceConfirmationProvider>
              </NotificationsProvider>
            </BrowserRouter>
          </TooltipProvider>
        </MenuPermissionsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
