import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  UserCircle,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Building2,
  Receipt,
  FileText,
  Calculator,
  Eye,
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Calendar, label: 'Agenda', path: '/agenda' },
  { icon: Scissors, label: 'Serviços', path: '/servicos' },
  { icon: Users, label: 'Profissionais', path: '/profissionais' },
  { icon: UserCircle, label: 'Clientes', path: '/clientes' },
  { icon: DollarSign, label: 'Financeiro', path: '/financeiro' },
  { icon: FileText, label: 'Emitir Nota Fiscal', path: '/emitir-nota' },
  { icon: Eye, label: 'Pré-visualização NF', path: '/nota-fiscal' },
  { icon: Receipt, label: 'Config. Impostos', path: '/config-impostos' },
  { icon: Calculator, label: 'Apuração Mensal', path: '/apuracao-mensal' },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 sm:w-72 bg-white border-r border-gray-200 transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 border-b border-gray-200">
            <Link to="/" className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900 truncate">Azzo</span>
              <span className="text-xs sm:text-sm font-medium text-violet-600 truncate">Agenda Pro</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden flex-shrink-0"
              onClick={onToggle}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-2 sm:px-3 space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) onToggle();
                    }}
                  >
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3 h-10 sm:h-11 text-sm',
                        isActive && 'bg-violet-100 text-violet-700 hover:bg-violet-100'
                      )}
                    >
                      <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Public booking link */}
            <div className="px-2 sm:px-3 mt-6">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-violet-50 to-pink-50 rounded-xl">
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Link de Agendamento
                </p>
                <Link to="/agendar/meu-salao">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-violet-200 text-violet-700 hover:bg-violet-50 text-xs sm:text-sm"
                  >
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Ver página pública</span>
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-2 sm:p-3 border-t border-gray-200 space-y-1">
            <Link 
              to="/perfil-salao"
              onClick={() => {
                if (window.innerWidth < 1024) onToggle();
              }}
            >
              <Button 
                variant={location.pathname === '/perfil-salao' ? 'secondary' : 'ghost'} 
                className={cn(
                  'w-full justify-start gap-3 h-10 sm:h-11 text-sm',
                  location.pathname === '/perfil-salao' && 'bg-violet-100 text-violet-700 hover:bg-violet-100'
                )}
              >
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">Perfil do Salão</span>
              </Button>
            </Link>
            <Link 
              to="/configuracoes"
              onClick={() => {
                if (window.innerWidth < 1024) onToggle();
              }}
            >
              <Button 
                variant={location.pathname === '/configuracoes' ? 'secondary' : 'ghost'} 
                className={cn(
                  'w-full justify-start gap-3 h-10 sm:h-11 text-sm',
                  location.pathname === '/configuracoes' && 'bg-violet-100 text-violet-700 hover:bg-violet-100'
                )}
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">Configurações</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-10 sm:h-11 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Sair</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-3 left-3 z-30 lg:hidden h-9 w-9"
        onClick={onToggle}
      >
        <Menu className="w-4 h-4" />
      </Button>
    </>
  );
}