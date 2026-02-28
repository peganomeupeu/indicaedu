import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, UserPlus, List, Trophy, Shield, LogOut, Menu, X, GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { profile, isAdmin, signOut } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/nova-indicacao', label: 'Nova Indicação', icon: UserPlus },
    { path: '/indicacoes', label: 'Indicações', icon: List },
    { path: '/ranking', label: 'Ranking', icon: Trophy },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 gradient-dark text-sidebar-foreground 
        transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
            <img src="/images/logo-audens-edu-branco.png" alt="Audens Edu" className="h-10 w-auto" />
            <button className="ml-auto lg:hidden text-sidebar-foreground/60" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive 
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md' 
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}
                  `}
                >
                  <item.icon className="w-4.5 h-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full gradient-primary text-xs font-bold text-primary-foreground">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-primary-foreground truncate">{profile?.full_name ?? '...'}</p>
                <p className="text-xs text-sidebar-foreground/50 truncate">{profile?.email ?? ''}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent justify-start gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center h-14 px-4 border-b border-border bg-card lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <img src="/images/logo-audens-edu-branco.png" alt="Audens Edu" className="h-7 w-auto ml-3 invert" />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
