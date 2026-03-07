import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ChatInboxNotifier } from '@/components/chat/ChatInboxNotifier';
import { PageErrorState } from '@/components/ui/page-states';
import { FullScreenLoader } from '@/components/ui/full-screen-loader';

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
  const [isPlanExpired, setIsPlanExpired] = useState(false);

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
      setIsPlanExpired(false);
      return;
    }

    let cancelled = false;

    const checkSubscription = async () => {
      setIsCheckingLicenseStatus(true);
      try {
        const baseUrl = ((import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8080/api/v1').replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/billing/subscriptions/current`, {
          credentials: 'include',
        });

        if (response.status === 401) {
          if (!cancelled) setIsPlanExpired(false);
          return;
        }

        if (response.status === 402) {
          if (!cancelled) setIsPlanExpired(true);
          return;
        }

        if (!response.ok) {
          if (!cancelled) setIsPlanExpired(false);
          return;
        }

        const payload = (await response.json()) as {
          status?: string | null;
          licenseStatus?: string | null;
          paymentStatus?: string | null;
          currentPaymentStatus?: string | null;
        };

        const status = String(payload.status || '').toUpperCase();
        const licenseStatus = String(payload.licenseStatus || '').toUpperCase();
        const paymentStatus = String(payload.currentPaymentStatus || payload.paymentStatus || '').toUpperCase();

        const expired =
          licenseStatus === 'EXPIRED' ||
          status === 'EXPIRED' ||
          status === 'OVERDUE' ||
          paymentStatus === 'OVERDUE';

        if (!cancelled) {
          setIsPlanExpired(expired);
          try {
            if (expired) {
              sessionStorage.setItem('azzo_plan_expired_blocked', '1');
            } else {
              sessionStorage.removeItem('azzo_plan_expired_blocked');
            }
          } catch {
            // ignore storage issues
          }
        }
      } catch {
        if (!cancelled) {
          try {
            setIsPlanExpired(sessionStorage.getItem('azzo_plan_expired_blocked') === '1');
          } catch {
            setIsPlanExpired(false);
          }
        }
      } finally {
        if (!cancelled) setIsCheckingLicenseStatus(false);
      }
    };

    void checkSubscription();

    return () => {
      cancelled = true;
    };
  }, [isLicenseRoute]);

  useEffect(() => {
    if (isLicenseRoute) return;
    try {
      if (sessionStorage.getItem('azzo_plan_expired_blocked') === '1') {
        setIsPlanExpired(true);
      }
    } catch {
      // ignore storage issues
    }
  }, [isLicenseRoute, location.pathname]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ blocked?: boolean }>;
      setIsPlanExpired(Boolean(customEvent.detail?.blocked));
      setIsCheckingLicenseStatus(false);
    };

    window.addEventListener('azzo:plan-expired-changed', handler as EventListener);
    return () => {
      window.removeEventListener('azzo:plan-expired-changed', handler as EventListener);
    };
  }, []);

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

      <div className={desktopSidebarOpen ? "lg:pl-64 xl:pl-72" : "lg:pl-0"}>
        <Header
          title={title}
          subtitle={subtitle}
          onToggleDesktopSidebar={toggleDesktopSidebar}
          isDesktopSidebarOpen={desktopSidebarOpen}
        />

        <main className="p-3 sm:p-4 lg:p-6 xl:p-8 overflow-x-hidden">
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
        </main>
      </div>
    </div>
  );
}
