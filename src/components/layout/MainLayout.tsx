import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ChatInboxNotifier } from '@/components/chat/ChatInboxNotifier';
import { PageErrorState } from '@/components/ui/page-states';
import { FullScreenLoader } from '@/components/ui/full-screen-loader';
import { useLicenseAccess } from '@/hooks/useLicenseAccess';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [isCheckingLicenseStatus, setIsCheckingLicenseStatus] = useState(true);
  const { status: licenseStatus, isBlocked: isPlanExpired, refreshStatus } = useLicenseAccess();

  const isLicenseRoute = location.pathname === '/financeiro/licenca';

  useEffect(() => {
    try {
      const cached = localStorage.getItem("desktop_sidebar_open");
      if (cached === "0") {
        setDesktopSidebarOpen(false);
      }
    } catch {
      // ignore localStorage issues
    }
  }, []);

  useEffect(() => {
    if (isLicenseRoute) {
      setIsCheckingLicenseStatus(false);
      return;
    }
    if (licenseStatus === 'BLOCKED' || licenseStatus === 'ACTIVE') {
      setIsCheckingLicenseStatus(false);
      return;
    }

    let cancelled = false;

    const checkSubscription = async () => {
      setIsCheckingLicenseStatus(true);
      try {
        await refreshStatus();
      } catch {
        // se falhar, mantemos o estado atual em memoria/cache
      } finally {
        if (!cancelled) setIsCheckingLicenseStatus(false);
      }
    };

    void checkSubscription();

    return () => {
      cancelled = true;
    };
  }, [isLicenseRoute, licenseStatus, location.pathname, refreshStatus]);

  const toggleDesktopSidebar = () => {
    setDesktopSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("desktop_sidebar_open", next ? "1" : "0");
      } catch {
        // ignore localStorage issues
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <ChatInboxNotifier />
      <Sidebar
        isMobileOpen={mobileSidebarOpen}
        onToggleMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        isDesktopOpen={desktopSidebarOpen}
      />

      <div className={desktopSidebarOpen ? "lg:pl-60" : "lg:pl-0"}>
        <Header
          title={title}
          subtitle={subtitle}
          onToggleDesktopSidebar={toggleDesktopSidebar}
          isDesktopSidebarOpen={desktopSidebarOpen}
        />

        <main className="p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="mx-auto max-w-screen-2xl">
          {!isLicenseRoute && isCheckingLicenseStatus ? (
            <FullScreenLoader />
          ) : !isLicenseRoute && isPlanExpired ? (
            <PageErrorState
              title="Plano vencido"
              description="Seu plano esta vencido. Regularize o pagamento para continuar usando o sistema."
              action={{
                label: 'Ir para Licenca',
                onClick: () => navigate('/financeiro/licenca'),
              }}
            />
          ) : (
            children
          )}
          </div>
        </main>
      </div>
    </div>
  );
}
