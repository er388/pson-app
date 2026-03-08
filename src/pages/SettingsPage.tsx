import { useState } from 'react';
import { Globe, Moon, Store, Plus, Trash2, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/lib/i18n';
import { useStores, useDarkMode, useTemplates } from '@/lib/useStore';
import CategoryManager from '@/components/CategoryManager';
import DataManager from '@/components/DataManager';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { stores, addStore, removeStore } = useStores();
  const [dark, setDark] = useDarkMode();
  const [newStore, setNewStore] = useState('');
  const { templates, removeTemplate } = useTemplates();

  const handleAddStore = () => {
    if (newStore.trim()) {
      addStore(newStore.trim());
      setNewStore('');
    }
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

      {/* Dark Mode */}
      <section className="mb-6">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
          <Moon size={20} className="text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{t('darkMode')}</p>
          </div>
          <Switch checked={dark} onCheckedChange={setDark} />
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
