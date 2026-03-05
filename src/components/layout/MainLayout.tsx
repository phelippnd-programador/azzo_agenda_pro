import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ChatInboxNotifier } from '@/components/chat/ChatInboxNotifier';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <ChatInboxNotifier />
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="lg:pl-64 xl:pl-72">
        <Header title={title} subtitle={subtitle} />

        <main className="p-3 sm:p-4 lg:p-6 xl:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
