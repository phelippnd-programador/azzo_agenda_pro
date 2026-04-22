import { Suspense, lazy, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PageErrorState } from '@/components/ui/page-states';
import { useLicenseAccess } from '@/hooks/useLicenseAccess';

const ChatInboxNotifier = lazy(() =>
  import('@/components/chat/ChatInboxNotifier').then((module) => ({
    default: module.ChatInboxNotifier,
  }))
);

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

function getInitialDesktopSidebarState() {
  try {
    return localStorage.getItem('desktop_sidebar_open') !== '0';
  } catch {
    return true;
  }
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(
    getInitialDesktopSidebarState,
  );
  const { status: licenseStatus, isBlocked: isPlanExpired, refreshStatus } = useLicenseAccess();

  const isLicenseRoute = location.pathname === '/financeiro/licenca';

  useEffect(() => {
    if (
      isLicenseRoute ||
      licenseStatus === 'BLOCKED' ||
      licenseStatus === 'ACTIVE'
    ) {
      return;
    }

    const checkSubscription = async () => {
      try {
        await refreshStatus();
      } catch {
        // se falhar, mantemos o estado atual em memoria/cache
      }
    };

    void checkSubscription();
  }, [isLicenseRoute, licenseStatus, refreshStatus]);

  const toggleDesktopSidebar = () => {
    setDesktopSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('desktop_sidebar_open', next ? '1' : '0');
      } catch {
        // ignore localStorage issues
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--shell))]">
      <Suspense fallback={null}>
        <ChatInboxNotifier />
      </Suspense>
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

        <main className="overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-screen-2xl">
          {!isLicenseRoute && isPlanExpired ? (
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
