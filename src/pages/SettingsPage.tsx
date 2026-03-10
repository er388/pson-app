import { useState } from 'react';
import { Globe, Palette, Store, Plus, Trash2, Bookmark, ArrowUpFromLine, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/lib/i18n';
import { useStores, useThemeMode, useTemplates, ThemeMode } from '@/lib/useStore';
import CategoryManager from '@/components/CategoryManager';
import DataManager from '@/components/DataManager';
import CloudBackup from '@/components/CloudBackup';
import LoyaltyCardManager from '@/components/LoyaltyCardManager';
import { toast } from '@/hooks/use-toast';

const THEME_OPTIONS: { value: ThemeMode; emoji: string }[] = [
  { value: 'light', emoji: '☀️' },
  { value: 'dark', emoji: '🌙' },
  { value: 'black', emoji: '⬛' },
  { value: 'green', emoji: '🟢' },
  { value: 'blue', emoji: '🔵' },
];

const STARTUP_PAGES = [
  { value: 'last', path: '' },
  { value: 'shoppingList', path: '/' },
  { value: 'catalog', path: '/catalog' },
  { value: 'history', path: '/history' },
  { value: 'statistics', path: '/stats' },
  { value: 'settings', path: '/settings' },
] as const;

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { stores, addStore, removeStore } = useStores();
  const [theme, setTheme] = useThemeMode();
  const [newStore, setNewStore] = useState('');
  const { templates, removeTemplate } = useTemplates();
  const [smartUncheck, setSmartUncheck] = useState(() => {
    try { return localStorage.getItem('smartcart-smart-uncheck') !== 'false'; } catch { return true; }
  });
  const [startupPage, setStartupPage] = useState(() => {
    try { return localStorage.getItem('smartcart-startup-page') || 'last'; } catch { return 'last'; }
  });

  const handleAddStore = () => {
    if (newStore.trim()) {
      addStore(newStore.trim());
      setNewStore('');
    }
  };

  const handleStartupChange = (val: string) => {
    setStartupPage(val);
    localStorage.setItem('smartcart-startup-page', val);
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
      <h1 className="text-2xl font-bold text-foreground mb-6">{t('settings')}</h1>

      {/* Language */}
      <section className="mb-6">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
          <Globe size={20} className="text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{t('language')}</p>
          </div>
          <div className="flex bg-secondary rounded-xl p-0.5">
            <button
              onClick={() => setLang('el')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${lang === 'el' ? 'bg-primary text-primary-foreground' : 'text-secondary-foreground'}`}
            >
              🇬🇷 Ελληνικά
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-secondary-foreground'}`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>
      </section>

      {/* Theme Mode - 5 options */}
      <section className="mb-6">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-3">
            <Palette size={20} className="text-primary" />
            <p className="text-sm font-medium text-foreground">{t('themeMode')}</p>
          </div>
          <div className="flex gap-1.5">
            {THEME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                  theme === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <span className="text-base">{opt.emoji}</span>
                {t((`theme${opt.value.charAt(0).toUpperCase() + opt.value.slice(1)}`) as any)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Smart Uncheck */}
      <section className="mb-6">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
          <ArrowUpFromLine size={20} className="text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{t('smartUncheck')}</p>
          </div>
          <Switch checked={smartUncheck} onCheckedChange={(v) => { setSmartUncheck(v); localStorage.setItem('smartcart-smart-uncheck', String(v)); }} />
        </div>
      </section>

      {/* Startup Page */}
      <section className="mb-6">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-3">
            <Home size={20} className="text-primary" />
            <p className="text-sm font-medium text-foreground">{t('startupPage')}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleStartupChange('last')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                startupPage === 'last' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {t('lastVisited')}
            </button>
            {STARTUP_PAGES.slice(1).map(sp => (
              <button
                key={sp.value}
                onClick={() => handleStartupChange(sp.path)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  startupPage === sp.path ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {t(sp.value as any)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stores */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Store size={14} /> {t('stores')}
        </h2>
        <div className="space-y-1.5 mb-3">
          {stores.map(s => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <Store size={16} className="text-muted-foreground" />
              <span className="flex-1 text-sm font-medium text-foreground">{s.name}</span>
              <button
                onClick={() => removeStore(s.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newStore}
            onChange={e => setNewStore(e.target.value)}
            placeholder={t('storeName')}
            className="rounded-xl text-sm h-10"
            onKeyDown={e => e.key === 'Enter' && handleAddStore()}
          />
          <Button onClick={handleAddStore} size="sm" className="rounded-xl px-4 h-10">
            <Plus size={16} />
          </Button>
        </div>
      </section>

      {/* Loyalty Cards */}
      <LoyaltyCardManager />

      {/* Categories */}
      <CategoryManager />

      {/* Templates */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Bookmark size={14} /> {t('templates')}
        </h2>
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground p-3">{t('noTemplates')}</p>
        ) : (
          <div className="space-y-1.5">
            {templates.map(tpl => (
              <div key={tpl.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <Bookmark size={16} className="text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">{tpl.name}</span>
                  <p className="text-xs text-muted-foreground">{tpl.items.length} {t('itemsCount')}</p>
                </div>
                <button
                  onClick={() => { removeTemplate(tpl.id); toast({ title: t('templateDeleted') }); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cloud Backup */}
      <CloudBackup />

      {/* Data & Security */}
      <DataManager onDataChanged={() => window.location.reload()} />

      {/* App info */}
      <section className="text-center pt-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-3">
          <span className="text-2xl font-black text-primary">P</span>
        </div>
        <p className="text-lg font-bold text-foreground">{t('appTitle')}</p>
        <p className="text-xs text-muted-foreground">{t('version')}</p>
      </section>
    </div>
  );
}
