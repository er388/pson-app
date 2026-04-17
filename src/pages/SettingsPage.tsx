import { useState } from 'react';
import {
  Globe, Palette, Store, Plus, Trash2, Bookmark, ArrowUpFromLine,
  Home, Edit2, ChevronDown, Cloud, X, Package, Scale, ChevronRight, Check,
} from 'lucide-react';
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
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import CatalogModal from '@/components/CatalogModal';
import { useBackStack } from '@/lib/useBackStack';
import { useProductUnits } from '@/lib/useStore';
import { DEFAULT_PRODUCT_UNITS } from '@/lib/types';

const THEME_OPTIONS: { value: ThemeMode; emoji: string }[] = [
  { value: 'system', emoji: '⚙️' },
  { value: 'light', emoji: '☀️' },
  { value: 'dark', emoji: '🌙' },
  { value: 'black', emoji: '⬛' },
  { value: 'pson', emoji: '🟣' },
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

/**
 * SettingsRow — Material-style list row with circular icon, label, and trailing control.
 */
function SettingsRow({
  icon: Icon, iconBg, label, sublabel, control, onClick,
}: {
  icon: any; iconBg?: string; label: string; sublabel?: string;
  control?: React.ReactNode; onClick?: () => void;
}) {
  const Wrapper: any = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${onClick ? 'active:bg-secondary/60' : ''}`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconBg || 'bg-primary/10'}`}>
        <Icon size={17} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{label}</p>
        {sublabel && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{sublabel}</p>}
      </div>
      {control && <div className="shrink-0">{control}</div>}
      {onClick && !control && <ChevronRight size={16} className="text-muted-foreground/60 shrink-0" />}
    </Wrapper>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2 mt-4">
      {children}
    </h2>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { stores, addStore, removeStore, setAllStores } = useStores();
  const [theme, setTheme] = useThemeMode();
  const [newStore, setNewStore] = useState('');
  const { templates, removeTemplate, updateTemplate, setAllTemplates } = useTemplates();
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const [smartUncheck, setSmartUncheck] = useState(() => {
    try { return localStorage.getItem('Pson-smart-uncheck') !== 'false'; } catch { return true; }
  });
  const [startupPage, setStartupPage] = useState(() => {
    try { return localStorage.getItem('Pson-startup-page') || 'last'; } catch { return 'last'; }
  });
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);

  const [storesOpen, setStoresOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [cloudOpen, setCloudOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { allUnits, customUnits, defaultOverrides, addUnit, removeUnit, updateUnit } = useProductUnits();
  const [newUnit, setNewUnit] = useState('');
  const [newUnitEn, setNewUnitEn] = useState('');
  const [unitsOpen, setUnitsOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [editUnitName, setEditUnitName] = useState('');
  const [editUnitEn, setEditUnitEn] = useState('');

  useBackStack(helpOpen, () => setHelpOpen(false));
  useBackStack(catalogModalOpen, () => setCatalogModalOpen(false));

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

  const startupSelectValue = startupPage === 'last' ? 'last' : (STARTUP_PAGES.find(sp => sp.path === startupPage)?.value || 'last');

  const startEditUnit = (originalName: string) => {
    setEditingUnit(originalName);
    const isDefault = DEFAULT_PRODUCT_UNITS.includes(originalName);
    const override = isDefault ? defaultOverrides[originalName] : null;
    const custom = customUnits.find(u => u.name === originalName);
    setEditUnitName(override?.name || custom?.name || originalName);
    setEditUnitEn(override?.nameEn || custom?.nameEn || '');
  };

  const saveUnitEdit = () => {
    if (!editingUnit || !editUnitName.trim()) return;
    updateUnit(editingUnit, editUnitName.trim(), editUnitEn.trim() || undefined);
    setEditingUnit(null);
  };

  return (
    <div className="max-w-lg mx-auto pt-4 pb-24">
      <h1 className="text-2xl font-bold text-foreground mb-4 px-4">{t('settings')}</h1>

      {/* ==================== APPEARANCE ==================== */}
      <SectionHeader>{t('sectionAppearance')}</SectionHeader>
      <div className="px-4">
        <SectionCard>
          {/* Language */}
          <SettingsRow
            icon={Globe}
            label={t('language')}
            control={
              <div className="flex bg-secondary rounded-xl p-0.5">
                <button
                  onClick={() => setLang('el')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${lang === 'el' ? 'bg-primary text-primary-foreground' : 'text-secondary-foreground'}`}
                >🇬🇷</button>
                <button
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-secondary-foreground'}`}
                >🇬🇧</button>
              </div>
            }
          />
          {/* Theme */}
          <SettingsRow
            icon={Palette}
            label={t('themeMode')}
            control={
              <Select value={theme} onValueChange={(val) => setTheme(val as ThemeMode)}>
                <SelectTrigger className="w-36 h-8 rounded-lg text-xs">
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
            }
          />
        </SectionCard>
      </div>

      {/* ==================== GENERAL ==================== */}
      <SectionHeader>{t('sectionGeneral')}</SectionHeader>
      <div className="px-4">
        <SectionCard>
          <SettingsRow
            icon={Home}
            label={t('startupPage')}
            control={
              <Select
                value={startupSelectValue}
                onValueChange={(val) => {
                  if (val === 'last') handleStartupChange('last');
                  else {
                    const sp = STARTUP_PAGES.find(s => s.value === val);
                    if (sp) handleStartupChange(sp.path);
                  }
                }}
              >
                <SelectTrigger className="w-40 h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STARTUP_PAGES.map(sp => (
                    <SelectItem key={sp.value} value={sp.value}>
                      {sp.value === 'last' ? t('lastVisited') : t(sp.value as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
          <SettingsRow
            icon={ArrowUpFromLine}
            label={t('smartUncheck')}
            control={
              <Switch checked={smartUncheck} onCheckedChange={(v) => { setSmartUncheck(v); localStorage.setItem('Pson-smart-uncheck', String(v)); }} />
            }
          />
        </SectionCard>
      </div>

      {/* ==================== CONTENT ==================== */}
      <SectionHeader>{t('sectionContent')}</SectionHeader>
      <div className="px-4 space-y-2">
        <SectionCard>
          {/* Stores collapsible */}
          <button onClick={() => setStoresOpen(v => !v)} className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-secondary/60">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Store size={17} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{t('stores')}</p>
              <p className="text-[11px] text-muted-foreground">{stores.length} {t('itemsCount')}</p>
            </div>
            <ChevronDown size={16} className={`text-muted-foreground/60 transition-transform ${storesOpen ? 'rotate-180' : ''}`} />
          </button>
          {storesOpen && (
            <div className="px-4 pb-4 pt-1 space-y-2">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
                if (over && active.id !== over.id) {
                  const oldIdx = stores.findIndex(s => s.id === active.id);
                  const newIdx = stores.findIndex(s => s.id === over.id);
                  setAllStores(arrayMove(stores, oldIdx, newIdx));
                }
              }}>
                <SortableContext items={stores.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5">
                    {stores.map(s => (
                      <SortableStoreItem key={s.id} store={s} onRemove={() => removeStore(s.id)} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <div className="flex gap-2 pt-1">
                <Input value={newStore} onChange={e => setNewStore(e.target.value)} placeholder={t('storeName')} className="rounded-xl text-sm h-9" lang="el" autoComplete="off" onKeyDown={e => e.key === 'Enter' && handleAddStore()} />
                <Button onClick={handleAddStore} size="sm" className="rounded-xl px-3 h-9"><Plus size={16} /></Button>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Units */}
        <SectionCard>
          <button onClick={() => setUnitsOpen(v => !v)} className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-secondary/60">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Scale size={17} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{t('unitsManagement')}</p>
              <p className="text-[11px] text-muted-foreground">{allUnits.length} {t('itemsCount')}</p>
            </div>
            <ChevronDown size={16} className={`text-muted-foreground/60 transition-transform ${unitsOpen ? 'rotate-180' : ''}`} />
          </button>
          {unitsOpen && (
            <div className="px-4 pb-4 pt-1 space-y-1.5">
              {allUnits.map(u => {
                const isCustom = customUnits.some(c => c.name === u);
                // find original key for editing (default's display might differ from key)
                const originalKey = isCustom
                  ? u
                  : DEFAULT_PRODUCT_UNITS.find(d => (defaultOverrides[d]?.name || d) === u) || u;
                const custom = customUnits.find(c => c.name === u);
                const override = !isCustom ? defaultOverrides[originalKey] : null;
                const enLabel = custom?.nameEn || override?.nameEn;
                const isEditing = editingUnit === originalKey;
                return (
                  <div key={originalKey} className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/40 border border-border">
                    {isEditing ? (
                      <>
                        <Input value={editUnitName} onChange={e => setEditUnitName(e.target.value)} className="h-8 text-sm flex-1" placeholder="EL" lang="el" autoComplete="off" />
                        <Input value={editUnitEn} onChange={e => setEditUnitEn(e.target.value)} className="h-8 text-sm flex-1" placeholder="EN" lang="en" autoComplete="off" />
                        <button onClick={saveUnitEdit} className="w-7 h-7 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10">
                          <Check size={15} />
                        </button>
                        <button onClick={() => setEditingUnit(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground">
                          <X size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-foreground">
                          {u}
                          {enLabel && <span className="text-xs text-muted-foreground ml-2">{enLabel}</span>}
                        </span>
                        <button onClick={() => startEditUnit(originalKey)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary">
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => removeUnit(originalKey)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
              <div className="flex gap-2 mt-2">
                <Input value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="EL" className="rounded-xl text-sm h-9 flex-1" lang="el" autoComplete="off" />
                <Input value={newUnitEn} onChange={e => setNewUnitEn(e.target.value)} placeholder="EN" className="rounded-xl text-sm h-9 flex-1" lang="en" autoComplete="off" />
                <Button size="sm" className="rounded-xl px-3 h-9" onClick={() => { addUnit(newUnit, newUnitEn); setNewUnit(''); setNewUnitEn(''); }}>
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Categories (uses existing component) */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <CategoryManager />
        </div>

        {/* Templates */}
        <SectionCard>
          <button onClick={() => setTemplatesOpen(v => !v)} className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-secondary/60">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bookmark size={17} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{t('templates')}</p>
              <p className="text-[11px] text-muted-foreground">{templates.length} {t('itemsCount')}</p>
            </div>
            <ChevronDown size={16} className={`text-muted-foreground/60 transition-transform ${templatesOpen ? 'rotate-180' : ''}`} />
          </button>
          {templatesOpen && (
            <div className="px-4 pb-4 pt-1">
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">{t('noTemplates')}</p>
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
              )}
            </div>
          )}
        </SectionCard>

        {/* Catalog modal */}
        <SectionCard>
          <SettingsRow
            icon={Package}
            label={t('productCatalog')}
            sublabel={lang === 'el' ? 'Drag-and-drop αναδιάταξη' : 'Drag-and-drop reordering'}
            onClick={() => setCatalogModalOpen(true)}
          />
        </SectionCard>

        {/* Loyalty cards (component manages its own card) */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <LoyaltyCardManager />
        </div>
      </div>

      <CatalogModal open={catalogModalOpen} onClose={() => setCatalogModalOpen(false)} />

      {/* ==================== DATA ==================== */}
      <SectionHeader>{t('sectionData')}</SectionHeader>
      <div className="px-4 space-y-2">
        <SectionCard>
          <button onClick={() => setCloudOpen(v => !v)} className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-secondary/60">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Cloud size={17} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{t('cloudBackup')}</p>
            </div>
            <ChevronDown size={16} className={`text-muted-foreground/60 transition-transform ${cloudOpen ? 'rotate-180' : ''}`} />
          </button>
          {cloudOpen && (
            <div className="px-4 pb-4 pt-1">
              <CloudBackup />
            </div>
          )}
        </SectionCard>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <DataManager onDataChanged={() => window.location.reload()} />
        </div>
      </div>

      {/* ==================== ABOUT ==================== */}
      <section className="text-center pt-8 px-4">
        <button onClick={() => setHelpOpen(true)} className="inline-flex flex-col items-center gap-1 active:opacity-70 transition-opacity">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-3">
            <span className="text-2xl font-black text-primary">P</span>
          </div>
          <p className="text-lg font-bold text-foreground">{t('appTitle')}</p>
          <p className="text-xs text-muted-foreground">{t('version')}</p>
          <p className="text-xs text-primary mt-1">{lang === 'el' ? 'Οδηγίες χρήσης' : 'User guide'}</p>
        </button>
      </section>

      {/* Help dialog */}
      {helpOpen && (
        <div className="fixed inset-0 z-[150] bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border shrink-0">
            <h2 className="text-lg font-bold text-foreground">{lang === 'el' ? 'Οδηγίες Χρήσης' : 'User Guide'}</h2>
            <button onClick={() => setHelpOpen(false)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors">
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            <HelpSection title="🛒 Λίστα Αγορών">
              <HelpItem q="Πώς προσθέτω αντικείμενο;" a="Πατήστε το + κουμπί κάτω δεξιά. Ανοίγει ο κατάλογος προϊόντων — αναζητήστε ή επιλέξτε από τη λίστα." />
              <HelpItem q="Τι είναι η Γρήγορη Προσθήκη;" a="Η οριζόντια λωρίδα στην κορυφή με συχνά αγοραζόμενα και αγαπημένα. Πατήστε για προσθήκη/αφαίρεση." />
              <HelpItem q="Πώς καταγράφω τιμή;" a="Πατήστε το «€ —» δεξιά από κάθε αντικείμενο. Πληκτρολογήστε και πατήστε Enter." />
              <HelpItem q="Πώς ολοκληρώνω αγορά;" a="Τσεκάρετε τα αγορασμένα και πατήστε «Ολοκλήρωση αγοράς»." />
              <HelpItem q="Τι κάνει το Barcode scanner;" a="Σκανάρει barcode. Αν βρεθεί στον κατάλογο προστίθεται· αλλιώς ψάχνει στο Open Food Facts." />
              <HelpItem q="Πώς λειτουργεί ο Προϋπολογισμός;" a="Πατήστε το πορτοφόλι. Ορίστε ποσό για όλα ή ανά κατάστημα." />
              <HelpItem q="Πώς χρησιμοποιώ Templates;" a="Σώστε τη λίστα ως template, φορτώστε με Συγχώνευση ή Αντικατάσταση." />
            </HelpSection>
            <HelpSection title="📦 Κατάλογος Προϊόντων">
              <HelpItem q="Πώς προσθέτω νέο προϊόν;" a="Στον κατάλογο, πατήστε + κάτω δεξιά. Ονόματα EL/EN, κατηγορία, μονάδα, σημείωση, φωτογραφία." />
              <HelpItem q="Τι είναι τα Εναλλακτικά;" a="Έως 3 εναλλακτικά προϊόντα ανά καταχώριση — γρήγορη αντικατάσταση από τη λίστα." />
            </HelpSection>
            <HelpSection title="📋 Ιστορικό">
              <HelpItem q="Τι αποθηκεύεται;" a="Κάθε ολοκληρωμένη αγορά. Διατηρούνται μέχρι 1000 εγγραφές αυτόματα." />
              <HelpItem q="Πώς σκανάρω απόδειξη;" a="Πατήστε Scan Απόδειξης. Το OCR αναγνωρίζει προϊόντα/τιμές (η ακρίβεια εξαρτάται από τη φωτογραφία)." />
            </HelpSection>
            <HelpSection title="⚙️ Ρυθμίσεις">
              <HelpItem q="Πώς αλλάζω θέμα;" a="Ρυθμίσεις → Θέμα: Φωτεινό, Σκοτεινό, AMOLED, Pson.io (βιολετί), Μπλε, Κόκκινο, Σύστημα." />
              <HelpItem q="Πώς κάνω backup;" a="Cloud Backup → Backup τώρα. Ανοίγει Android share — Drive/Files/email." />
              <HelpItem q="Τι είναι οι Κάρτες Loyalty;" a="Αποθηκεύστε barcode/QR καρτών. Εμφανίζονται αυτόματα όταν επιλέξετε το αντίστοιχο κατάστημα." />
            </HelpSection>
            <p className="text-center text-xs text-muted-foreground pb-4">Pson.io — Made with ❤️ in Greece</p>
          </div>
        </div>
      )}
    </div>
  );
}

function HelpSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <ChevronDown size={16} className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">{children}</div>}
    </div>
  );
}

function HelpItem({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-foreground mb-0.5">{q}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{a}</p>
    </div>
  );
}

function SortableStoreItem({ store, onRemove }: { store: { id: string; name: string }; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: store.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
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
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
      <button {...attributes} {...listeners} className="text-muted-foreground/50 touch-none">
        <GripVertical size={16} />
      </button>
      <Bookmark size={16} className="text-muted-foreground" />
      {isEditing ? (
        <input className="flex-1 text-sm font-medium bg-background border border-primary rounded-lg px-2 py-1 outline-none text-foreground" value={editName} onChange={e => onEditChange(e.target.value)} onBlur={onEditDone} onKeyDown={e => e.key === 'Enter' && onEditDone()} autoFocus lang="el" autoComplete="off" />
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
