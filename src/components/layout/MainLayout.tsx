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

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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

  return (
    <div className="min-h-screen bg-[hsl(var(--shell))]">
      <Suspense fallback={null}>
        <ChatInboxNotifier />
      </Suspense>
      <Sidebar
        isMobileOpen={mobileSidebarOpen}
        onToggleMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        isDesktopOpen
      />
      <div className="lg:pl-72">
        <Header
          title={title}
          subtitle={subtitle}
        />
        <main className="overflow-x-hidden px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-5 lg:px-8 lg:pb-10 lg:pt-6">
          <div className="mx-auto max-w-[1680px]">
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
