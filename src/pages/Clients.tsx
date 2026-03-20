import { Outlet, useLocation } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ModuleTabs } from '@/components/navigation/module-tabs';

export default function Clients() {
  const location = useLocation();
  const tabs = [
    { to: '/clientes', label: 'Visao geral', isActive: location.pathname === '/clientes' },
    {
      to: '/clientes/importacoes',
      label: 'Importacoes',
      isActive: location.pathname.startsWith('/clientes/importacoes'),
    },
  ];

  return (
    <MainLayout title="Clientes" subtitle="Gerencie sua base de clientes e importacoes">
      <div className="space-y-4 sm:space-y-6">
        <ModuleTabs items={tabs} pathname={location.pathname} />
        <Outlet />
      </div>
    </MainLayout>
  );
}
