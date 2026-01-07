import { useState } from 'react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  Rocket,
  Settings,
  Shield,
  LogOut,
  Users,
  Activity,
  Download,
  Zap,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppUpdates } from '@/hooks/useAppUpdates';
import { UpdateDialog } from '@/components/UpdateDialog';

interface SidebarProps {
  userRole: string;
  onLogout: () => void;
}

const Sidebar = ({ userRole, onLogout }: SidebarProps) => {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const location = useLocation();
  const isFounder = userRole === 'founder';
  const { available, downloaded, currentVersion } = useAppUpdates();

  const mainItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Monitoramento', url: '/monitoring', icon: Activity },
    { title: 'Processos', url: '/processes', icon: Cpu },
    { title: 'Otimização', url: '/optimization', icon: Zap },
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
    <aside className="w-[72px] bg-card/80 backdrop-blur-xl border-r border-border/50 flex flex-col min-h-screen">
      {/* Close Button */}
      <div className="p-4 flex justify-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground"
          onClick={onLogout}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-2">
        {mainItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={`flex items-center justify-center py-3 mx-2 rounded-xl transition-all duration-200 group relative ${
              isActive(item.url)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
            activeClassName="bg-primary text-primary-foreground"
          >
            <item.icon className="w-5 h-5" />
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {item.title}
            </div>
          </NavLink>
        ))}

        {/* Admin Section */}
        {isFounder && adminItems.length > 0 && (
          <>
            <div className="mx-4 my-3 border-t border-border/50" />
            {adminItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                className={`flex items-center justify-center py-3 mx-2 rounded-xl transition-all duration-200 group relative ${
                  isActive(item.url)
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
                activeClassName="bg-secondary text-secondary-foreground"
              >
                <item.icon className="w-5 h-5" />
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {item.title}
                </div>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Update Indicator */}
      {(available || downloaded) && (
        <div className="p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowUpdateDialog(true)}
            className="w-full aspect-square text-primary hover:bg-primary/10 animate-pulse"
          >
            <Download className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Logout Button */}
      <div className="p-2 border-t border-border/50">
        <Button
          onClick={onLogout}
          variant="ghost"
          size="icon"
          className="w-full aspect-square text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Update Dialog */}
      {typeof window !== 'undefined' && window.electronAPI && (
        <UpdateDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog} />
      )}
    </aside>
  );
};

export default Sidebar;
