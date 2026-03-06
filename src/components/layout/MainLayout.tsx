import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ChatInboxNotifier } from '@/components/chat/ChatInboxNotifier';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

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

        <main className="p-3 sm:p-4 lg:p-6 xl:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
