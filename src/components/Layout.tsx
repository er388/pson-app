import { ReactNode, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, Settings, BarChart3, Clock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const tabs = [
  { path: '/', icon: ShoppingCart, labelKey: 'shoppingList' as const },
  { path: '/catalog', icon: Package, labelKey: 'catalog' as const },
  { path: '/history', icon: Clock, labelKey: 'history' as const },
  { path: '/stats', icon: BarChart3, labelKey: 'statistics' as const },
  { path: '/settings', icon: Settings, labelKey: 'settings' as const },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();

  const activeIndex = useMemo(() => {
    const idx = tabs.findIndex(tab => tab.path === location.pathname);
    return idx >= 0 ? idx : 0;
  }, [location.pathname]);

  const handleNav = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border backdrop-blur-lg bg-opacity-95 z-50">
        <div className="relative max-w-lg mx-auto">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 overflow-hidden">
            <div
              className="h-full transition-transform duration-300 ease-out"
              style={{
                width: `${100 / tabs.length}%`,
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            >
              <div className="mx-auto h-full w-8 rounded-full bg-primary" />
            </div>
          </div>

          <div
            className="grid items-center h-16"
            style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
          >
            {tabs.map(tab => {
              const active = location.pathname === tab.path;
              return (
                <button
                  key={tab.path}
                  onClick={() => handleNav(tab.path)}
                  className="relative flex w-full flex-col items-center gap-0.5 px-1 py-2 transition-colors"
                >
                  <tab.icon
                    size={18}
                    className={active ? 'text-primary' : 'text-muted-foreground'}
                  />
                  <span className={`text-[9px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                    {t(tab.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
