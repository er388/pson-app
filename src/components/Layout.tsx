import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, Settings, BarChart3 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';

const tabs = [
  { path: '/', icon: ShoppingCart, labelKey: 'shoppingList' as const },
  { path: '/catalog', icon: Package, labelKey: 'catalog' as const },
  { path: '/stats', icon: BarChart3, labelKey: 'statistics' as const },
  { path: '/settings', icon: Settings, labelKey: 'settings' as const },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border backdrop-blur-lg bg-opacity-95 z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {tabs.map(tab => {
            const active = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center gap-0.5 px-3 py-2 transition-colors"
              >
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <tab.icon
                  size={20}
                  className={active ? 'text-primary' : 'text-muted-foreground'}
                />
                <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                  {t(tab.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
