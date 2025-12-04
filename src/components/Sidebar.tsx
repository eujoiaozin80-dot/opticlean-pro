import { useState } from 'react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  Rocket,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoOpticlean from '@/assets/logo-opticlean.png';

interface SidebarProps {
  userRole: string;
  onLogout: () => void;
}

const Sidebar = ({ userRole, onLogout }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isFounder = userRole === 'founder';

  const mainItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Monitoramento', url: '/monitoring', icon: Activity },
    { title: 'Processos', url: '/processes', icon: Cpu },
    { title: 'Inicialização', url: '/startup', icon: Rocket },
    { title: 'Configurações', url: '/settings', icon: Settings },
  ];

  const adminItems = isFounder
    ? [
        { title: 'Admin', url: '/admin', icon: Shield },
        { title: 'Usuários', url: '/users', icon: Users },
      ]
    : [];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={`${
        collapsed ? 'w-[72px]' : 'w-64'
      } glass-strong transition-all duration-300 flex flex-col relative min-h-screen`}
    >
      {/* Header */}
      <div className={`p-4 border-b border-border/50 ${collapsed ? 'px-3' : ''}`}>
        <div className="flex items-center gap-3">
          <img 
            src={logoOpticlean} 
            alt="OptiClean Pro" 
            className={`${collapsed ? 'w-10 h-10' : 'w-9 h-9'} transition-all`}
          />
          {!collapsed && (
            <div className="animate-fade-in">
              <h2 className="font-semibold text-foreground">OptiClean Pro</h2>
              <p className="text-xs text-muted-foreground">
                {isFounder ? 'Administrador' : 'v1.1.0'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[72px] bg-card border border-border text-foreground rounded-full p-1.5 shadow-md hover:bg-muted transition-colors z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {/* Main Section */}
        {!collapsed && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
            Menu
          </p>
        )}
        {mainItems.map((item, index) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
              isActive(item.url)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            } ${collapsed ? 'justify-center' : ''}`}
            activeClassName="bg-primary/10 text-primary"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <item.icon className={`${collapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]'} flex-shrink-0 transition-all`} />
            {!collapsed && (
              <span className="font-medium text-sm">{item.title}</span>
            )}
            {isActive(item.url) && !collapsed && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </NavLink>
        ))}

        {/* Admin Section */}
        {isFounder && adminItems.length > 0 && (
          <>
            {!collapsed && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 mt-4">
                Administração
              </p>
            )}
            {adminItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive(item.url)
                    ? 'bg-secondary/10 text-secondary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                } ${collapsed ? 'justify-center' : ''}`}
                activeClassName="bg-secondary/10 text-secondary"
              >
                <item.icon className={`${collapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]'} flex-shrink-0`} />
                {!collapsed && (
                  <span className="font-medium text-sm">{item.title}</span>
                )}
                {isActive(item.url) && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary" />
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Logout Button */}
      <div className={`p-3 border-t border-border/50 ${collapsed ? 'px-3' : ''}`}>
        <Button
          onClick={onLogout}
          variant="ghost"
          className={`w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${
            collapsed ? 'px-0 justify-center' : ''
          }`}
        >
          <LogOut className={`w-[18px] h-[18px] ${collapsed ? '' : 'mr-2'}`} />
          {!collapsed && <span className="font-medium text-sm">Sair</span>}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
