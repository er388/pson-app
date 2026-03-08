import { useRef, useState } from 'react';
import { Download, Upload, RotateCcw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { exportAppData, importAppData, getDefaultProducts, getDefaultStores } from '@/lib/useStore';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  onDataChanged: () => void;
}

export default function DataManager({ onDataChanged }: Props) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetMode, setResetMode] = useState<'merge' | 'replace'>('merge');
  const [pendingImportData, setPendingImportData] = useState<any>(null);

  const handleExport = () => {
    const data = exportAppData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pson-io-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Εξαγωγή δεδομένων', description: 'Το αρχείο αποθηκεύτηκε επιτυχώς.' });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.products && !data.stores) {
          toast({ title: 'Σφάλμα', description: 'Μη έγκυρο αρχείο δεδομένων.', variant: 'destructive' });
          return;
        }
        setPendingImportData(data);
        setShowImportConfirm(true);
      } catch {
        toast({ title: 'Σφάλμα', description: 'Δεν ήταν δυνατή η ανάγνωση του αρχείου.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const confirmImport = () => {
    if (pendingImportData) {
      importAppData(pendingImportData);
      setPendingImportData(null);
      setShowImportConfirm(false);
      toast({ title: 'Εισαγωγή δεδομένων', description: 'Τα δεδομένα εισήχθησαν επιτυχώς. Ανανέωση...' });
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const handleReset = (mode: 'merge' | 'replace') => {
    setResetMode(mode);
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    if (resetMode === 'replace') {
      const data = {
        products: getDefaultProducts(),
        shoppingList: [],
        stores: getDefaultStores(),
        purchaseHistory: [],
        customCategories: [],
        activeStoreId: null,
      };
      importAppData(data);
      toast({ title: 'Επαναφορά', description: 'Όλα τα δεδομένα αντικαταστάθηκαν.' });
    } else {
      // Merge: add defaults that don't exist by name
      const currentData = exportAppData();
      const defaultProducts = getDefaultProducts();
      const existingNames = new Set(currentData.products.map(p => p.name));
      const newProducts = defaultProducts.filter(p => !existingNames.has(p.name));
      const merged = {
        ...currentData,
        products: [...currentData.products, ...newProducts],
      };
      importAppData(merged);
      toast({ title: 'Επαναφορά', description: `Προστέθηκαν ${newProducts.length} προεπιλεγμένα προϊόντα.` });
    }
    setShowResetConfirm(false);
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Database size={14} /> Δεδομένα & Ασφάλεια
      </h2>

      <div className="space-y-2">
        {/* Export */}
        <button
          onClick={handleExport}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border text-left transition-colors hover:bg-secondary/50"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Download size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Εξαγωγή δεδομένων (JSON)</p>
            <p className="text-[11px] text-muted-foreground">Αποθήκευση αντιγράφου ασφαλείας</p>
          </div>
        </button>

        {/* Import */}
        <button
          onClick={handleImportClick}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border text-left transition-colors hover:bg-secondary/50"
        >
          <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
            <Upload size={18} className="text-accent-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Εισαγωγή δεδομένων</p>
            <p className="text-[11px] text-muted-foreground">Φόρτωση από αρχείο JSON</p>
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />

        {/* Reset - Merge */}
        <button
          onClick={() => handleReset('merge')}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border text-left transition-colors hover:bg-secondary/50"
        >
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
            <RotateCcw size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Επαναφορά προεπιλεγμένων (συγχώνευση)</p>
            <p className="text-[11px] text-muted-foreground">Προσθέτει τα default χωρίς να διαγράψει τα δικά σου</p>
          </div>
        </button>

        {/* Reset - Replace */}
        <button
          onClick={() => handleReset('replace')}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-destructive/30 text-left transition-colors hover:bg-destructive/5"
        >
          <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
            <RotateCcw size={18} className="text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Επαναφορά & αντικατάσταση όλων</p>
            <p className="text-[11px] text-destructive">Διαγράφει όλα τα δεδομένα σου</p>
          </div>
        </button>
      </div>

      {/* Import confirmation */}
      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Εισαγωγή δεδομένων</AlertDialogTitle>
            <AlertDialogDescription>
              Τα υπάρχοντα δεδομένα θα αντικατασταθούν. Θέλετε να συνεχίσετε;
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl" onClick={confirmImport}>
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset confirmation */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Επαναφορά δεδομένων</AlertDialogTitle>
            <AlertDialogDescription>
              {resetMode === 'replace'
                ? 'Όλα τα δεδομένα θα διαγραφούν και θα αντικατασταθούν με τα προεπιλεγμένα. Αυτή η ενέργεια δεν αναιρείται.'
                : 'Τα προεπιλεγμένα προϊόντα θα προστεθούν χωρίς να διαγραφούν τα υπάρχοντα.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className={`rounded-xl ${resetMode === 'replace' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}`}
              onClick={confirmReset}
            >
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
