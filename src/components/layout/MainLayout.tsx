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

const DESKTOP_SIDEBAR_STORAGE_KEY = 'desktop_sidebar_open';

function getInitialDesktopSidebarOpen() {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    const stored = window.localStorage.getItem(DESKTOP_SIDEBAR_STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(getInitialDesktopSidebarOpen);
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

  useEffect(() => {
    try {
      window.localStorage.setItem(DESKTOP_SIDEBAR_STORAGE_KEY, String(desktopSidebarOpen));
    } catch {
      // ignore localStorage issues
    }
  }, [desktopSidebarOpen]);

  return (
    <div className="min-h-screen bg-[hsl(var(--shell))]">
      <Suspense fallback={null}>
        <ChatInboxNotifier />
      </Suspense>
      <Sidebar
        isMobileOpen={mobileSidebarOpen}
        onToggleMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        isDesktopOpen={desktopSidebarOpen}
        onToggleDesktop={() => setDesktopSidebarOpen((current) => !current)}
      />
      <div className={desktopSidebarOpen ? 'lg:pl-80' : 'lg:pl-20'}>
        <Header
          title={title}
          subtitle={subtitle}
          onToggleDesktopSidebar={() => setDesktopSidebarOpen((current) => !current)}
          isDesktopSidebarOpen={desktopSidebarOpen}
        />
        <main className="overflow-x-hidden px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-5 lg:px-8 lg:pb-10 lg:pt-6">
          <div className="mx-auto max-w-[1680px]">
          {!isLicenseRoute && isPlanExpired ? (
            <PageErrorState
              title="Plano vencido"
              description="Seu plano está vencido. Regularize o pagamento para continuar usando o sistema."
              action={{
                label: 'Ir para Licença',
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
