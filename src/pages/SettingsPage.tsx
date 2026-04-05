import { useState } from 'react';
import { Globe, Palette, Store, Plus, Trash2, Bookmark, ArrowUpFromLine, Home, Clock, Edit2, ChevronDown, Cloud, X } from 'lucide-react';
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
import { Package } from 'lucide-react';
import CatalogModal from '@/components/CatalogModal';
import { useBackStack } from '@/lib/useBackStack';

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
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);

  const [storesOpen, setStoresOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [cloudOpen, setCloudOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

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
              <SelectTrigger className="w-44 h-9 rounded-xl text-xs" >
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
              <SelectTrigger className="w-24 h-9 rounded-xl text-xs" >
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
              <SelectTrigger className="w-44 h-9 rounded-xl text-xs" >
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
              <Input value={newStore} onChange={e => setNewStore(e.target.value)} placeholder={t('storeName')} className="rounded-xl text-sm h-10" lang="el" autoComplete="off" onKeyDown={e => e.key === 'Enter' && handleAddStore()} />
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

      {/* Catalog */}
      <section className="mb-6">
        <button
          onClick={() => setCatalogModalOpen(true)}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border text-left transition-colors hover:bg-secondary/50"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Package size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{t('productCatalog')}</p>
            <p className="text-[11px] text-muted-foreground">Drag-and-drop αναδιάταξη προϊόντων</p>
          </div>
        </button>
      </section>

      <CatalogModal open={catalogModalOpen} onClose={() => setCatalogModalOpen(false)} />

      {/* Cloud Backup */}
      <section className="mb-6">
        <button onClick={() => setCloudOpen(v => !v)} className="w-full flex items-center gap-1.5 mb-3">
          <Cloud size={14} className="text-muted-foreground" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1 text-left">{t('cloudBackup')}</h2>
          <ChevronDown size={14} className={`text-muted-foreground transition-transform ${cloudOpen ? 'rotate-180' : ''}`} />
        </button>
        {cloudOpen && <CloudBackup />}
      </section>

      {/* Loyalty Cards */}
      <LoyaltyCardManager />

      {/* Data & Security */}
      <DataManager onDataChanged={() => window.location.reload()} />

      {/* App info */}
            <section className="text-center pt-8">
              <button onClick={() => setHelpOpen(true)} className="inline-flex flex-col items-center gap-1 active:opacity-70 transition-opacity">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-3">
                  <span className="text-2xl font-black text-primary">P</span>
                </div>
                <p className="text-lg font-bold text-foreground">{t('appTitle')}</p>
                <p className="text-xs text-muted-foreground">{t('version')}</p>
                <p className="text-xs text-primary mt-1">Οδηγίες χρήσης</p>
              </button>
            </section>

            {/* Help Dialog */}
            {helpOpen && (
              <div className="fixed inset-0 z-[150] bg-background flex flex-col">
                <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border shrink-0">
                  <h2 className="text-lg font-bold text-foreground">Οδηγίες Χρήσης</h2>
                  <button onClick={() => setHelpOpen(false)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors">
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>

                  <HelpSection title="🛒 Λίστα Αγορών">
                    <HelpItem q="Πώς προσθέτω αντικείμενο;" a="Πατήστε το + κουμπί κάτω δεξιά. Ανοίγει ο κατάλογος προϊόντων — αναζητήστε ή επιλέξτε από τη λίστα." />
                    <HelpItem q="Τι είναι η Γρήγορη Προσθήκη;" a="Η οριζόντια λωρίδα στην κορυφή με συχνά αγοραζόμενα προϊόντα και αγαπημένα. Πατήστε για να προσθέσετε ή αφαιρέσετε αντικείμενο." />
                    <HelpItem q="Πώς καταγράφω τιμή;" a="Πατήστε το «€ —» δεξιά από κάθε αντικείμενο. Πληκτρολογήστε την τιμή και πατήστε Enter." />
                    <HelpItem q="Πώς ολοκληρώνω αγορά;" a="Τσεκάρετε τα αγορασμένα αντικείμενα, μετά πατήστε «Ολοκλήρωση αγοράς». Η αγορά αποθηκεύεται στο Ιστορικό." />
                    <HelpItem q="Τι κάνει το Barcode scanner;" a="Σκανάρει barcode προϊόντος. Αν βρεθεί στον κατάλογό σας, προσθέτεται στη λίστα. Αν όχι, ψάχνει στο Open Food Facts και σας προτείνει να το προσθέσετε." />
                    <HelpItem q="Πώς λειτουργεί ο Προϋπολογισμός;" a="Πατήστε το πορτοφόλι (💰) στην κορυφή. Ορίστε ποσό για όλα τα καταστήματα ή για συγκεκριμένο. Η μπάρα γίνεται κόκκινη αν υπερβείτε το όριο." />
                    <HelpItem q="Πώς χρησιμοποιώ Templates;" a="Σώστε την τρέχουσα λίστα ως template με το 🔖+ κουμπί. Φορτώστε παλιά template με το 🔖 κουμπί — επιλέξτε Συγχώνευση ή Αντικατάσταση." />
                    <HelpItem q="Πώς κοινοποιώ τη λίστα;" a="Πατήστε το κουμπί κοινοποίησης (↑) — ανοίγει το native Android share panel με τη λίστα σε μορφή κειμένου." />
                    <HelpItem q="Τι γίνεται όταν αλλάζω κατάστημα;" a="Αν υπάρχουν αντικείμενα στη λίστα, η εφαρμογή ρωτά αν θέλετε να «παρκάρετε» τα αντικείμενα για το προηγούμενο κατάστημα. Μπορείτε να τα ανακτήσετε αργότερα από το banner που εμφανίζεται." />
                  </HelpSection>

                  <HelpSection title="📦 Κατάλογος Προϊόντων">
                    <HelpItem q="Πού βρίσκεται ο κατάλογος;" a="Στις Ρυθμίσεις (⚙️), κάτω από τα Templates. Ανοίγει ως overlay χωρίς αλλαγή καρτέλας." />
                    <HelpItem q="Πώς προσθέτω νέο προϊόν;" a="Μέσα στον κατάλογο, πατήστε + κάτω δεξιά. Συμπληρώστε ελληνικό όνομα (υποχρεωτικό), αγγλικό, κατηγορία, μονάδα, σημείωση, φωτογραφία ή barcode." />
                    <HelpItem q="Πώς αναδιατάσσω προϊόντα;" a="Χωρίς φίλτρο/αναζήτηση, εμφανίζεται το ☰ handle αριστερά. Κρατήστε πατημένο και σύρετε." />
                    <HelpItem q="Τι κάνει το αστεράκι (★);" a="Προσθέτει το προϊόν στα Αγαπημένα. Τα αγαπημένα εμφανίζονται πρώτα στη Γρήγορη Προσθήκη." />
                    <HelpItem q="Τι είναι τα Εναλλακτικά;" a="Μπορείτε να ορίσετε έως 3 εναλλακτικά προϊόντα. Στη λίστα αγορών εμφανίζεται το ⇄ εικονίδιο για γρήγορη αντικατάσταση." />
                  </HelpSection>

                  <HelpSection title="📋 Ιστορικό">
                    <HelpItem q="Τι αποθηκεύεται στο Ιστορικό;" a="Κάθε ολοκληρωμένη αγορά με ημερομηνία, κατάστημα, αντικείμενα και σύνολο." />
                    <HelpItem q="Πώς επαναφορτώνω μια παλιά λίστα;" a="Πατήστε «Επαναφόρτωση» σε μια εγγραφή. Επιλέξτε Συγχώνευση (προσθέτει στην τρέχουσα) ή Αντικατάσταση." />
                    <HelpItem q="Πώς σκανάρω απόδειξη;" a="Πατήστε το Scan Απόδειξης πάνω δεξιά. Τραβήξτε φωτογραφία ή επιλέξτε από γκαλερί. Το OCR αναγνωρίζει προϊόντα και τιμές (ακρίβεια εξαρτάται από ποιότητα φωτογραφίας)." />
                  </HelpSection>

                  <HelpSection title="📊 Στατιστικά">
                    <HelpItem q="Τι δείχνουν τα Στατιστικά;" a="Μηνιαίες δαπάνες, κατανομή ανά κατηγορία, top προϊόντα, σύγκριση τιμών μεταξύ καταστημάτων." />
                    <HelpItem q="Πώς φιλτράρω;" a="Επιλέξτε Εβδομάδα / Μήνας / Όλα και φιλτράρετε ανά κατάστημα από τις επιλογές στην κορυφή." />
                  </HelpSection>

                  <HelpSection title="⚙️ Ρυθμίσεις">
                    <HelpItem q="Πώς προσθέτω κατάστημα;" a="Ρυθμίσεις → Καταστήματα → πληκτρολογήστε όνομα → +. Σύρετε για αναδιάταξη." />
                    <HelpItem q="Πώς διαχειρίζομαι κατηγορίες;" a="Ρυθμίσεις → Κατηγορίες Προϊόντων. Σύρετε για αναδιάταξη, επεξεργαστείτε ονόματα (EL/EN), προσθέστε custom κατηγορίες με emoji." />
                    <HelpItem q="Πώς αλλάζω θέμα;" a="Ρυθμίσεις → Θέμα εμφάνισης. Διαθέσιμα: Φωτεινό, Σκοτεινό, AMOLED, Πράσινο, Μπλε, Κόκκινο, Σύστημα." />
                    <HelpItem q="Πώς κάνω backup τα δεδομένα;" a="Ρυθμίσεις → Cloud Backup → Backup τώρα. Ανοίγει το Android share panel — επιλέξτε Google Drive, Αρχεία, email κτλ." />
                    <HelpItem q="Πώς επαναφέρω δεδομένα;" a="Ρυθμίσεις → Δεδομένα & Ασφάλεια → Εισαγωγή δεδομένων. Επιλέξτε το αρχείο JSON backup." />
                    <HelpItem q="Τι είναι οι Κάρτες Loyalty;" a="Αποθηκεύστε barcode/QR καρτών πιστότητας. Εμφανίζονται αυτόματα στη λίστα αγορών όταν επιλέξετε το αντίστοιχο κατάστημα." />
                    <HelpItem q="Τι κάνει το Smart Uncheck;" a="Όταν ξε-τσεκάρετε ένα αντικείμενο, μετακινείται αυτόματα στην κορυφή της λίστας." />
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