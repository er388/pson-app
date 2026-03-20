import { useState } from 'react';
import { Globe, Palette, Store, Plus, Trash2, Bookmark, ArrowUpFromLine, Home, Clock, Edit2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { useStores, useThemeMode, useTemplates, ThemeMode } from '@/lib/useStore';
import CategoryManager from '@/components/CategoryManager';
import DataManager from '@/components/DataManager';
import CloudBackup from '@/components/CloudBackup';
import LoyaltyCardManager from '@/components/LoyaltyCardManager';
import { toast } from '@/hooks/use-toast';
import { useCompletedPurchases } from '@/lib/useStore';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

const THEME_OPTIONS: { value: ThemeMode; emoji: string }[] = [
  { value: 'system', emoji: '⚙️' },
  { value: 'light', emoji: '☀️' },
  { value: 'dark', emoji: '🌙' },
  { value: 'black', emoji: '⬛' },
  { value: 'green', emoji: '🟢' },
  { value: 'blue', emoji: '🔵' },
  { value: 'red', emoji: '🔴' },
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
  const { stores, addStore, removeStore, setAllStores } = useStores();
  const [theme, setTheme] = useThemeMode();
  const [newStore, setNewStore] = useState('');
  const { templates, removeTemplate, updateTemplate, setAllTemplates } = useTemplates();
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const { historyLimit, setHistoryLimit } = useCompletedPurchases();
  const [smartUncheck, setSmartUncheck] = useState(() => {
    try { return localStorage.getItem('Pson-smart-uncheck') !== 'false'; } catch { return true; }
  });
  const [startupPage, setStartupPage] = useState(() => {
    try { return localStorage.getItem('Pson-startup-page') || 'last'; } catch { return 'last'; }
  });

  const [storesOpen, setStoresOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleAddStore = () => {
    if (newStore.trim()) {
      addStore(newStore.trim());
      setNewStore('');
    }
  };

  const handleStartupChange = (val: string) => {
    setStartupPage(val);
    localStorage.setItem('Pson-startup-page', val);
  };

  // Map startup page path back to select value
  const startupSelectValue = startupPage === 'last' ? 'last' : (STARTUP_PAGES.find(sp => sp.path === startupPage)?.value || 'last');

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

      {/* Theme Mode - compact dropdown */}
      <section className="mb-6">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <Palette size={20} className="text-primary" />
            <p className="text-sm font-medium text-foreground flex-1">{t('themeMode')}</p>
            <Select value={theme} onValueChange={(val) => setTheme(val as ThemeMode)}>
              <SelectTrigger className="w-44 h-9 rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.emoji} {t((`theme${opt.value.charAt(0).toUpperCase() + opt.value.slice(1)}`) as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Switch checked={smartUncheck} onCheckedChange={(v) => { setSmartUncheck(v); localStorage.setItem('Pson-smart-uncheck', String(v)); }} />
        </div>
      </section>

      {/* History Limit */}
      <section className="mb-6">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-primary" />
            <p className="text-sm font-medium text-foreground flex-1">{t('historyLimit')}</p>
            <Select
              value={String(historyLimit)}
              onValueChange={v => setHistoryLimit(Number(v))}
            >
              <SelectTrigger className="w-24 h-9 rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[100, 200, 500, 1000].map(n => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Startup Page - Dropdown */}
      <section className="mb-6">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <Home size={20} className="text-primary" />
            <p className="text-sm font-medium text-foreground flex-1">{t('startupPage')}</p>
            <Select
              value={startupSelectValue}
              onValueChange={(val) => {
                if (val === 'last') {
                  handleStartupChange('last');
                } else {
                  const sp = STARTUP_PAGES.find(s => s.value === val);
                  if (sp) handleStartupChange(sp.path);
                }
              }}
            >
              <SelectTrigger className="w-44 h-9 rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STARTUP_PAGES.map(sp => (
                  <SelectItem key={sp.value} value={sp.value}>
                    {sp.value === 'last' ? t('lastVisited') : t(sp.value as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Stores */}
      <section className="mb-6">
        <button
          onClick={() => setStoresOpen(v => !v)}
          className="w-full flex items-center gap-1.5 mb-3"
        >
          <Store size={14} className="text-muted-foreground" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1 text-left">{t('stores')}</h2>
          <ChevronDown size={14} className={`text-muted-foreground transition-transform ${storesOpen ? 'rotate-180' : ''}`} />
        </button>
        {storesOpen && (
          <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
              if (over && active.id !== over.id) {
                const oldIdx = stores.findIndex(s => s.id === active.id);
                const newIdx = stores.findIndex(s => s.id === over.id);
                setAllStores(arrayMove(stores, oldIdx, newIdx));
              }
            }}>
              <SortableContext items={stores.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5 mb-3">
                  {stores.map(s => (
                    <SortableStoreItem key={s.id} store={s} onRemove={() => removeStore(s.id)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <div className="flex gap-2">
              <Input value={newStore} onChange={e => setNewStore(e.target.value)} placeholder={t('storeName')} className="rounded-xl text-sm h-10" onKeyDown={e => e.key === 'Enter' && handleAddStore()} />
              <Button onClick={handleAddStore} size="sm" className="rounded-xl px-4 h-10"><Plus size={16} /></Button>
            </div>
          </>
        )}
      </section>

      {/* Categories */}
      <CategoryManager />

      {/* Templates */}
      <section className="mb-6">
        <button onClick={() => setTemplatesOpen(v => !v)} className="w-full flex items-center gap-1.5 mb-3">
          <Bookmark size={14} className="text-muted-foreground" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1 text-left">{t('templates')}</h2>
          <ChevronDown size={14} className={`text-muted-foreground transition-transform ${templatesOpen ? 'rotate-180' : ''}`} />
        </button>
        {templatesOpen && (
          templates.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3">{t('noTemplates')}</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
              if (over && active.id !== over.id) {
                const oldIdx = templates.findIndex(t => t.id === active.id);
                const newIdx = templates.findIndex(t => t.id === over.id);
                setAllTemplates(arrayMove(templates, oldIdx, newIdx));
              }
            }}>
              <SortableContext items={templates.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5">
                  {templates.map(tpl => (
                    <SortableTemplateItem
                      key={tpl.id}
                      template={tpl}
                      isEditing={editingTemplateId === tpl.id}
                      editName={editingTemplateName}
                      onEditStart={() => { setEditingTemplateId(tpl.id); setEditingTemplateName(tpl.name); }}
                      onEditChange={setEditingTemplateName}
                      onEditDone={() => { updateTemplate(tpl.id, editingTemplateName.trim() || tpl.name); setEditingTemplateId(null); }}
                      onRemove={() => { removeTemplate(tpl.id); toast({ title: t('templateDeleted') }); }}
                      itemsLabel={`${tpl.items.length} ${t('itemsCount')}`}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )
        )}
      </section>

      {/* Cloud Backup */}
      <CloudBackup />

      {/* Loyalty Cards */}
      <LoyaltyCardManager />

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

function SortableStoreItem({ store, onRemove }: { store: { id: string; name: string }; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: store.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
      <button {...attributes} {...listeners} className="text-muted-foreground/50 touch-none">
        <GripVertical size={16} />
      </button>
      <Store size={16} className="text-muted-foreground" />
      <span className="flex-1 text-sm font-medium text-foreground">{store.name}</span>
      <button onClick={onRemove} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function SortableTemplateItem({ template, isEditing, editName, onEditStart, onEditChange, onEditDone, onRemove, itemsLabel }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: template.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
      <button {...attributes} {...listeners} className="text-muted-foreground/50 touch-none">
        <GripVertical size={16} />
      </button>
      <Bookmark size={16} className="text-muted-foreground" />
      {isEditing ? (
        <input className="flex-1 text-sm font-medium bg-background border border-primary rounded-lg px-2 py-1 outline-none text-foreground" value={editName} onChange={e => onEditChange(e.target.value)} onBlur={onEditDone} onKeyDown={e => e.key === 'Enter' && onEditDone()} autoFocus />
      ) : (
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground">{template.name}</span>
          <p className="text-xs text-muted-foreground">{itemsLabel}</p>
        </div>
      )}
      <button onClick={onEditStart} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
        <Edit2 size={15} />
      </button>
      <button onClick={onRemove} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
        <Trash2 size={15} />
      </button>
    </div>
  );
}