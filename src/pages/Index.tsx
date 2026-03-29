import { useState, useMemo, useRef, useCallback } from 'react';
import { Plus, Search, Store, Trash2, Minus, ChevronDown, ChevronUp, CheckCircle2, Share2, Bookmark, BookmarkPlus, Zap, Camera, ScanLine, Wallet, X, ArrowLeftRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { useProducts, useShoppingList, useStores, usePurchaseHistory, useCompletedPurchases, useTemplates, useCustomCategories, useBudget } from '@/lib/useStore';
import { CATEGORY_EMOJI, CATEGORY_COLORS, formatPrice, Product, Budget } from '@/lib/types';
import AddToListDialog from '@/components/AddToListDialog';
import DuplicateDialog from '@/components/DuplicateDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import BarcodeScanner from '@/components/BarcodeScanner';
import ProductForm from '@/components/ProductForm';
import { showUndo } from '@/components/UndoSnackbar';
import { lookupBarcode } from '@/lib/openFoodFacts';
import { LoyaltyCardQuickButton } from '@/components/LoyaltyCardManager';
import { cn, matchesSearch } from '@/lib/utils';

type SortMode = 'category' | 'store' | 'added';

function getStep(unit?: string): number {
  if (unit === 'kg' || unit === 'lt') return 0.1;
  if (unit === 'gr' || unit === 'ml') return 50;
  return 1;
}

function getMin(unit?: string): number {
  if (unit === 'kg' || unit === 'lt') return 0.1;
  if (unit === 'gr' || unit === 'ml') return 50;
  return 1;
}

function isDecimalUnit(unit?: string): boolean {
  return unit === 'kg' || unit === 'lt' || unit === 'gr' || unit === 'ml';
}

function formatQty(qty: number, unit?: string): string {
  if (unit === 'kg' || unit === 'lt') return qty % 1 === 0 ? String(qty) : qty.toFixed(1);
  return String(qty);
}

export default function ShoppingListPage() {
  const { t, lang } = useI18n();
  const { products, addProduct, incrementPurchaseCount } = useProducts();
  const { items, addItem, removeItem, removeByProductId, toggleCheck, updateQuantity, updateItemProductId, clearChecked, clearAll, total, budgetTotal, getStoreTotal, getStoreBudgetTotal, activeStoreId, setActiveStoreId, setAllItems, rawItems } = useShoppingList();
  const { stores } = useStores();
  const { addRecord } = usePurchaseHistory();
  const { addPurchase, purchases: completedPurchases } = useCompletedPurchases();
  const { templates, addTemplate, removeTemplate } = useTemplates();
  const { allCategoryKeys, customCategories } = useCustomCategories();
  const { budget, setBudget, clearBudget } = useBudget();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showLoadTemplate, setShowLoadTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [quickAddOpen, setQuickAddOpen] = useState(true);
  const [fullImageSrc, setFullImageSrc] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState<{ barcode: string; product?: Product; offData?: { name: string; category: string; imageUrl?: string; brand?: string } } | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [prefillBarcode, setPrefillBarcode] = useState('');
  const [prefillOffData, setPrefillOffData] = useState<{ name: string; category: string; imageUrl?: string; brand?: string } | null>(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetAmountStr, setBudgetAmountStr] = useState('');
  const [budgetScope, setBudgetScope] = useState<'global' | 'store'>('global');
  const [budgetStoreId, setBudgetStoreId] = useState<string>('');
  const [altSwapItem, setAltSwapItem] = useState<{ itemId: string; productId: string } | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<{ productId: string; pendingStoreId: string | null } | null>(null);
  const [storeCheckOpen, setStoreCheckOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState('');

  // Smart uncheck setting
  const [smartUncheck, setSmartUncheck] = useState(() => {
    try { return localStorage.getItem('Pson-smart-uncheck') !== 'false'; } catch { return true; }
  });

  // Sort mode with persistence
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    try { return (localStorage.getItem('Pson-sort-mode') as SortMode) || 'category'; } catch { return 'category'; }
  });
  const handleSortChange = (mode: SortMode) => {
    setSortMode(mode);
    localStorage.setItem('Pson-sort-mode', mode);
  };

  const getProduct = (pid: string) => products.find(p => p.id === pid);
  const productName = (pid: string) => {
    const p = getProduct(pid);
    if (!p) return '?';
    return lang === 'el' ? p.name : (p.nameEn || p.name);
  };

  const getCatLabel = (key: string) => {
    const custom = customCategories.find(c => c.id === key);
    if (custom) return lang === 'el' ? custom.name : (custom.nameEn || custom.name);
    return t(key as any);
  };

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(i => {
      const p = getProduct(i.productId);
      return p && (matchesSearch(p.name, search) || matchesSearch(p.nameEn || '', search));
    });
  }, [items, search, products]);

  // Group items based on sort mode
  const groupedItems = useMemo(() => {
    if (sortMode === 'added') return null;

    const map = new Map<string, typeof filteredItems>();

    if (sortMode === 'category') {
      filteredItems.forEach(item => {
        const p = getProduct(item.productId);
        const key = p?.category || 'other';
        const arr = map.get(key) || [];
        arr.push(item);
        map.set(key, arr);
      });
      map.forEach((items, key) => {
        map.set(key, items.sort((a, b) => {
          if (a.checked && !b.checked) return 1;
          if (!a.checked && b.checked) return -1;
          return 0;
        }));
      });
    } else {
      filteredItems.forEach(item => {
        const key = item.storeId || '__none__';
        const arr = map.get(key) || [];
        arr.push(item);
        map.set(key, arr);
      });
    }
    return map;
  }, [filteredItems, sortMode, products]);

  // Frequent products for quick add
  const frequentProducts = useMemo(() => {
    const favorites = products.filter(p => p.favorite);
    
    const countMap = new Map<string, number>();
    completedPurchases.forEach(p => {
      p.items.forEach(i => {
        countMap.set(i.productId, (countMap.get(i.productId) || 0) + i.quantity);
      });
    });

    const frequent = countMap.size === 0
      ? products.filter(p => p.purchaseCount > 0).sort((a, b) => b.purchaseCount - a.purchaseCount).slice(0, 8)
      : [...countMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([pid]) => products.find(p => p.id === pid)).filter(Boolean) as typeof products;

    const combined = [...favorites];
    frequent.forEach(p => { if (!combined.find(f => f.id === p.id)) combined.push(p); });
    return combined.slice(0, 12);
  }, [completedPurchases, products]);

  const existingProductIds = useMemo(() => new Set(items.map(i => i.productId)), [items]);

  // Duplicate-aware add
  const addItemWithDuplicateCheck = useCallback((productId: string, quantity = 1, storeId?: string | null) => {
    const normalizedName = (name: string) => name.toLowerCase().replace(/\s+/g, ' ').trim();
    const targetProduct = products.find(p => p.id === productId);
    
    // Check by product ID first
    const existingById = rawItems.find(i => i.productId === productId);
    if (existingById) {
      setDuplicateInfo({ productId, pendingStoreId: storeId ?? null });
      return;
    }
    
    // Check by name (case-insensitive, collapsed spaces)
    if (targetProduct) {
      const targetName = normalizedName(targetProduct.name);
      const existingByName = rawItems.find(i => {
        const p = products.find(pp => pp.id === i.productId);
        return p && normalizedName(p.name) === targetName;
      });
      if (existingByName) {
        setDuplicateInfo({ productId: existingByName.productId, pendingStoreId: storeId ?? null });
        return;
      }
    }
    
    addItem(productId, quantity, storeId);
  }, [rawItems, products, addItem]);

  const handleDuplicateIncrease = useCallback(() => {
    if (!duplicateInfo) return;
    const existing = rawItems.find(i => i.productId === duplicateInfo.productId);
    if (existing) {
      const step = getStep(products.find(p => p.id === duplicateInfo.productId)?.unit);
      updateQuantity(existing.id, Math.round((existing.quantity + step) * 100) / 100);
    }
    setDuplicateInfo(null);
  }, [duplicateInfo, rawItems, products, updateQuantity]);

  const handleDuplicateAddAgain = useCallback(() => {
    if (!duplicateInfo) return;
    addItem(duplicateInfo.productId, 1, duplicateInfo.pendingStoreId);
    setDuplicateInfo(null);
  }, [duplicateInfo, addItem]);

  const handleCheck = (id: string) => {
    const item = rawItems.find(i => i.id === id);
    const wasChecked = item?.checked;
    toggleCheck(id);
    
    // Smart uncheck: if unchecking, move to top
    if (wasChecked && smartUncheck) {
      setTimeout(() => {
        const currentItems = [...rawItems];
        const idx = currentItems.findIndex(i => i.id === id);
        if (idx > 0) {
          const [moved] = currentItems.splice(idx, 1);
          moved.checked = false;
          moved.checkedAt = undefined;
          currentItems.unshift(moved);
          setAllItems(currentItems);
        }
      }, 50);
    }
  };

  const handleUpdatePrice = useCallback((id: string, priceStr: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const price = priceStr ? parseFloat(priceStr.replace(',', '.')) : undefined;
    const updated = rawItems.map(i => i.id === id ? { ...i, price: price || undefined } : i);
    setAllItems(updated);
  }, [items, rawItems, setAllItems]);

  const handleRemoveItem = useCallback((id: string) => {
    const item = rawItems.find(i => i.id === id);
    if (!item) return;
    const p = getProduct(item.productId);
    const name = p ? (lang === 'el' ? p.name : (p.nameEn || p.name)) : '?';
    const snapshot = [...rawItems];
    removeItem(id);
    showUndo(`"${name}" ${t('removed').toLowerCase()}`, () => {
      setAllItems(snapshot);
    });
  }, [rawItems, removeItem, setAllItems, products, lang, t]);

  const doCompletePurchase = () => {
    const checkedItems = items.filter(i => i.checked);
    if (checkedItems.length === 0) return;

    const storeIds = [...new Set(checkedItems.map(i => i.storeId).filter(Boolean))] as string[];

    addPurchase({
      date: new Date().toISOString(),
      storeIds,
      items: checkedItems.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price || 0,
        discount: i.discount || 0,
        storeId: i.storeId,
      })),
      total,
    });

    checkedItems.forEach(i => {
      incrementPurchaseCount(i.productId);
      const storeId = i.storeId || activeStoreId;
      if (i.price && storeId) {
        addRecord({ productId: i.productId, price: i.price, discount: i.discount || 0, storeId, date: new Date().toISOString() });
      }
    });

    clearChecked();
    toast({ title: t('purchaseCompleted'), description: formatPrice(total) });
  };

  const handleCompletePurchase = () => {
    const checkedItems = items.filter(i => i.checked);
    if (checkedItems.length === 0) return;
    if (!activeStoreId) {
      setStoreCheckOpen(true);
      return;
    }
    doCompletePurchase();
  };

  const toggleCollapse = (key: string) => {
    setCollapsedSections(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };

  const checkedCount = items.filter(i => i.checked).length;
  const totalCount = items.length;

  // Budget calculations
  const currentBudgetSpent = useMemo(() => {
    if (!budget) return 0;
    if (budget.scope === 'global') return budgetTotal;
    return getStoreBudgetTotal(budget.storeId || null);
  }, [budget, budgetTotal, getStoreBudgetTotal]);

  const budgetPercentage = budget ? Math.min((currentBudgetSpent / budget.amount) * 100, 120) : 0;
  const budgetExceeded = budget ? currentBudgetSpent > budget.amount : false;
  const budgetExcessAmount = budget ? currentBudgetSpent - budget.amount : 0;

  const getBudgetColor = () => {
    if (budgetPercentage > 100) return 'bg-destructive';
    if (budgetPercentage > 75) return 'bg-orange-500';
    return 'bg-primary';
  };

  const handleSetBudget = () => {
    const amount = parseFloat(budgetAmountStr.replace(',', '.'));
    if (!amount || amount <= 0) return;
    setBudget({ amount, scope: budgetScope, storeId: budgetScope === 'store' ? budgetStoreId : undefined });
    setBudgetModalOpen(false);
  };

  const openBudgetModal = () => {
    setBudgetAmountStr(budget ? String(budget.amount).replace('.', ',') : '');
    setBudgetScope(budget?.scope || 'global');
    setBudgetStoreId(budget?.storeId || stores[0]?.id || '');
    setBudgetModalOpen(true);
  };

  // Barcode scan handler
  const handleBarcodeScan = async (barcode: string) => {
    setScannerOpen(false);
    const found = products.find(p => p.barcode === barcode);
    if (found) {
      setBarcodeResult({ barcode, product: found });
    } else {
      // Try Open Food Facts lookup
      const offResult = await lookupBarcode(barcode);
      setBarcodeResult({ barcode, offData: offResult || undefined });
    }
  };

  const handleBarcodeAddToList = () => {
    if (barcodeResult?.product) {
      addItemWithDuplicateCheck(barcodeResult.product.id, 1, activeStoreId);
      toast({ title: t('added'), description: productName(barcodeResult.product.id) });
    }
    setBarcodeResult(null);
  };

  const handleBarcodeAddToCatalog = () => {
    if (barcodeResult) {
      setPrefillBarcode(barcodeResult.barcode);
      // Pass OFF data to product form via state
      setPrefillOffData(barcodeResult.offData || null);
      setShowProductForm(true);
    }
    setBarcodeResult(null);
  };

  // Alternative swap
  const handleSwap = (itemId: string, newProductId: string) => {
    updateItemProductId(itemId, newProductId);
    setAltSwapItem(null);
    toast({ title: t('swapProduct') });
  };

  // Share list
  const handleShare = async () => {
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    let text = `🛒 Λίστα Ψωνιών — Pson.io\n📅 ${dateStr}\n`;

    const storeGroups = new Map<string | null, typeof items>();
    items.forEach(item => {
      const key = item.storeId || null;
      const arr = storeGroups.get(key) || [];
      arr.push(item);
      storeGroups.set(key, arr);
    });

    storeGroups.forEach((storeItems, storeId) => {
      const storeName = storeId ? stores.find(s => s.id === storeId)?.name || t('noStore') : t('noStore');
      text += `\n🏪 ${storeName}\n`;
      storeItems.forEach(item => {
        const p = getProduct(item.productId);
        if (!p) return;
        const name = lang === 'el' ? p.name : (p.nameEn || p.name);
        const unit = p.unit || 'τεμ.';
        let line = `- ${name} ${unit} × ${formatQty(item.quantity, p.unit)}`;
        if (item.price) {
          line += ` — ${formatPrice(item.price * item.quantity)}`;
        }
        text += line + '\n';
      });
    });

    if (total > 0) {
      text += `\n💰 Σύνολο: ${formatPrice(total)}`;
    }

    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        toast({ title: t('copied') });
      }
    } catch {
      await navigator.clipboard.writeText(text);
      toast({ title: t('copied') });
    }
  };

  const handleImportList = () => {
    const lines = importText.split('\n').map(l => l.trim()).filter(l => l.startsWith('- '));
    let found = 0;
    lines.forEach(line => {
      const match = line.replace(/^- /, '').split(' ')[0];
      const product = products.find(p =>
        p.name.toLowerCase().includes(match.toLowerCase()) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(match.toLowerCase()))
      );
      if (product) {
        addItemWithDuplicateCheck(product.id, 1, activeStoreId);
        found++;
      }
    });
    setImportDialogOpen(false);
    setImportText('');
    toast({ title: `Προστέθηκαν ${found} προϊόντα` });
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    addTemplate(
      templateName.trim(),
      rawItems.map(i => ({ productId: i.productId, quantity: i.quantity, storeId: i.storeId }))
    );
    setTemplateName('');
    setShowSaveTemplate(false);
    toast({ title: t('templateSaved') });
  };

  const handleLoadTemplate = (templateId: string, mode: 'merge' | 'replace') => {
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;
    const snapshot = [...rawItems];
    if (mode === 'replace') {
      clearAll();
      setTimeout(() => { tpl.items.forEach(i => addItem(i.productId, i.quantity, i.storeId)); }, 50);
    } else {
      tpl.items.forEach(i => addItem(i.productId, i.quantity, i.storeId));
    }
    setShowLoadTemplate(false);
    toast({ title: t('templateLoaded') });
    showUndo(t('templateLoaded'), () => {
      setAllItems(snapshot);
    });
  };

  const renderItem = (item: typeof items[0]) => {
    const p = getProduct(item.productId);
    const unit = p?.unit || 'τεμ.';
    const step = getStep(unit);
    const min = getMin(unit);
    const isChecked = item.checked;
    const hasAlternatives = p?.alternatives && p.alternatives.length > 0;

    return (
      <motion.div
        key={item.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isChecked ? 0.6 : 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className={`flex items-center gap-2 p-2.5 rounded-xl border shadow-sm ${isChecked ? 'bg-muted/50 border-border/50' : 'bg-card border-border'}`}
      >
        <button
          onClick={() => handleCheck(item.id)}
          className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center transition-colors min-w-[28px] min-h-[28px]"
        >
          {isChecked ? (
            <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" className="text-primary-foreground">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          ) : (
            <span className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 hover:border-primary transition-colors" />
          )}
        </button>

        {p?.image ? (
          <button onClick={() => setFullImageSrc(p.image!)} className="shrink-0">
            <img src={p.image} alt="" className="w-7 h-7 rounded-lg object-cover" />
          </button>
        ) : (
          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 ${p ? CATEGORY_COLORS[p.category] : ''}`}>
            {p ? CATEGORY_EMOJI[p.category] : '?'}
          </span>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className={`text-sm font-medium truncate ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {productName(item.productId)}
            </p>
            {hasAlternatives && !isChecked && (
              <button
                onClick={() => setAltSwapItem({ itemId: item.id, productId: item.productId })}
                className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title={t('alternatives')}
              >
                <ArrowLeftRight size={11} />
              </button>
            )}
          </div>
          {!isChecked && p?.note && <p className="text-[11px] italic text-muted-foreground truncate">{p.note}</p>}
        </div>

        <InlinePriceInput
          value={item.price}
          onChange={(val) => handleUpdatePrice(item.id, val)}
          disabled={isChecked}
        />

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => {
              const newQty = item.quantity - step;
              if (newQty < min) {
                handleRemoveItem(item.id);
              } else {
                updateQuantity(item.id, Math.round(newQty * 100) / 100);
              }
            }}
            className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground min-w-[28px] min-h-[28px]"
          >
            {item.quantity <= min ? <Trash2 size={13} className="text-destructive" /> : <Minus size={13} />}
          </button>
          <InlineQuantityInput
            value={item.quantity}
            onChange={(val) => updateQuantity(item.id, val)}
            unit={unit}
          />
          <button
            onClick={() => updateQuantity(item.id, Math.round((item.quantity + step) * 100) / 100)}
            className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground min-w-[28px] min-h-[28px]"
          >
            <Plus size={13} />
          </button>
          <span className="text-[9px] text-muted-foreground w-6 text-center">{unit}</span>
        </div>
      </motion.div>
    );
  };

  const renderCategorySection = (catKey: string, sectionItems: typeof items[0][]) => {
    const collapsed = collapsedSections.has(catKey);
    const emoji = CATEGORY_EMOJI[catKey] || '📦';
    const label = getCatLabel(catKey);
    const uncheckedCount = sectionItems.filter(i => !i.checked).length;

    return (
      <div key={catKey} className="mb-4">
        <button
          onClick={() => toggleCollapse(catKey)}
          className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 mb-2"
        >
          <span className="text-sm">{emoji}</span>
          <span className="text-sm font-semibold text-foreground flex-1 text-left">{label}</span>
          <span className="text-xs text-muted-foreground">{uncheckedCount}/{sectionItems.length}</span>
          {collapsed ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronUp size={16} className="text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1.5 overflow-hidden"
            >
              {sectionItems.map(item => renderItem(item))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderStoreSection = (storeKey: string, sectionItems: typeof items[0][]) => {
    const collapsed = collapsedSections.has(storeKey);
    const storeId = storeKey === '__none__' ? null : storeKey;
    const storeName = storeId ? stores.find(s => s.id === storeId)?.name || t('noStore') : t('noStore');
    const storeTotal = getStoreTotal(storeId);

    return (
      <div key={storeKey} className="mb-4">
        <button
          onClick={() => toggleCollapse(storeKey)}
          className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 mb-2"
        >
          <Store size={16} className="text-muted-foreground shrink-0" />
          <span className="text-sm font-semibold text-foreground flex-1 text-left">{storeName}</span>
          <span className="text-xs text-muted-foreground">{sectionItems.length} {t('itemsCount')}</span>
          {storeTotal > 0 && (
            <span className="text-xs font-medium text-primary">{formatPrice(storeTotal)}</span>
          )}
          {collapsed ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronUp size={16} className="text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1.5 overflow-hidden"
            >
              {sectionItems.map(item => renderItem(item))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm px-4 pt-4 pb-2">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-foreground">{t('shoppingList')}</h1>
            {totalCount > 0 && (
              <span className="text-sm text-muted-foreground font-medium">
                {checkedCount}/{totalCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={openBudgetModal} className={`w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors ${budget ? 'text-primary' : 'text-muted-foreground'}`} title={t('budget')}>
              <Wallet size={18} />
            </button>
            <button onClick={() => setScannerOpen(true)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors" title={t('scanBarcode')}>
              <ScanLine size={18} className="text-muted-foreground" />
            </button>
            <button onClick={() => setImportDialogOpen(true)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors" title="Import λίστας">
              <Download size={18} className="text-muted-foreground" />
            </button>
            {totalCount > 0 && (
              <>
                <button onClick={handleShare} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors" title={t('share')}>
                  <Share2 size={18} className="text-muted-foreground" />
                </button>
                <button onClick={() => setShowSaveTemplate(true)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors" title={t('saveAsTemplate')}>
                  <BookmarkPlus size={18} className="text-muted-foreground" />
                </button>
              </>
            )}
            <button onClick={() => setShowLoadTemplate(true)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors" title={t('loadTemplate')}>
              <Bookmark size={18} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <Select value={activeStoreId || 'none'} onValueChange={v => setActiveStoreId(v === 'none' ? null : v)}>
            <SelectTrigger className="h-9 rounded-xl text-sm">
              <Store size={15} className="mr-1.5 text-muted-foreground" />
              <SelectValue placeholder={t('selectStore')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('noStore')}</SelectItem>
              {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Budget Progress Bar */}
        {budget && (
          <div className="mb-3 p-3 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                {t('budgetUsed')} <span className="font-semibold text-foreground">{formatPrice(currentBudgetSpent)}</span> {t('budgetOf')} <span className="font-semibold text-foreground">{formatPrice(budget.amount)}</span>
              </span>
              <button onClick={clearBudget} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive">
                <X size={12} />
              </button>
            </div>
            <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getBudgetColor()}`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>
            {budget.scope === 'store' && budget.storeId && (
              <p className="text-[10px] text-muted-foreground mt-1">
                🏪 {stores.find(s => s.id === budget.storeId)?.name}
              </p>
            )}
            {budgetExceeded && (
              <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-xs font-medium text-destructive">
                  ⚠️ {t('budgetExceeded')} {formatPrice(budgetExcessAmount)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sort mode */}
        {totalCount > 0 && (
          <div className="flex gap-1 mb-2">
            {(['category', 'store', 'added'] as SortMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => handleSortChange(mode)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  sortMode === mode ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {t(mode === 'category' ? 'sortByCategory' : mode === 'store' ? 'sortByStore' : 'sortByAdded')}
              </button>
            ))}
          </div>
        )}

        {totalCount > 3 && (
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')} className="pl-9 h-9 rounded-xl text-sm" />
          </div>
        )}
      </div>

      <div className="px-4 pb-24">
        {/* Loyalty Card Quick Button */}
        <LoyaltyCardQuickButton storeId={activeStoreId} />

        {/* Quick Add Section */}
        {frequentProducts.length > 0 && (
          <Collapsible open={quickAddOpen} onOpenChange={setQuickAddOpen} className="mb-4">
            <CollapsibleTrigger className="w-full flex items-center gap-2 py-2">
              <Zap size={14} className="text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1 text-left">{t('quickAdd')}</span>
              {quickAddOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div
                className="flex gap-2 overflow-x-auto pb-2 no-scrollbar"
                data-no-swipe
                style={{ touchAction: 'pan-x' }}
                onTouchStart={e => e.stopPropagation()}
                onTouchMove={e => e.stopPropagation()}
                onTouchEnd={e => e.stopPropagation()}
              >
                {frequentProducts.map(p => {
                  const inList = existingProductIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (inList) {
                          removeByProductId(p.id);
                        } else {
                          addItemWithDuplicateCheck(p.id, 1, activeStoreId);
                        }
                      }}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                        inList
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-card border-border text-foreground hover:bg-secondary'
                      }`}
                    >
                      {CATEGORY_EMOJI[p.category] || '📦'} {lang === 'el' ? p.name : (p.nameEn || p.name)}
                      {inList ? <Minus size={12} /> : <Plus size={12} />}
                    </button>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {checkedCount > 0 && (
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={clearChecked}>
              <Trash2 size={13} className="mr-1" /> {t('clearChecked')}
            </Button>
            <Button size="sm" className="h-8 text-xs rounded-xl" onClick={handleCompletePurchase}>
              <CheckCircle2 size={14} className="mr-1" /> {t('completePurchase')}
            </Button>
          </div>
        )}

        {/* Render based on sort mode */}
        {sortMode === 'category' && groupedItems ? (
          Array.from(groupedItems.entries()).map(([key, sectionItems]) =>
            renderCategorySection(key, sectionItems)
          )
        ) : sortMode === 'store' && groupedItems ? (
          Array.from(groupedItems.entries()).map(([key, sectionItems]) =>
            renderStoreSection(key, sectionItems)
          )
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence>
              {filteredItems.map(item => renderItem(item))}
            </AnimatePresence>
          </div>
        )}

        {search && filteredItems.length === 0 && totalCount > 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground mb-3">
              {lang === 'el' ? `Δεν βρέθηκε "${search}"` : `No results for "${search}"`}
            </p>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowAdd(true)}
            >
              <Plus size={16} className="mr-1.5" />
              {lang === 'el' ? 'Προσθήκη στη λίστα' : 'Add to list'}
            </Button>
          </div>
        )}

        {totalCount === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-lg font-semibold text-foreground mb-1">{t('noItems')}</h2>
            <p className="text-sm text-muted-foreground mb-6">{t('addItems')}</p>
            <Button onClick={() => setShowAdd(true)} className="rounded-xl">
              <Plus size={18} className="mr-1.5" /> {t('addToList')}
            </Button>
          </div>
        )}

        {total > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{t('total')}</span>
              <span className="text-xl font-bold text-primary">{formatPrice(total)}</span>
            </div>
          </div>
        )}
      </div>

      {totalCount > 0 && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-20 right-4 w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center z-50 active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </button>
      )}

      <AddToListDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        products={products}
        existingProductIds={items.map(i => i.productId)}
        onAdd={pid => addItemWithDuplicateCheck(pid, 1, activeStoreId)}
        onRemove={pid => removeByProductId(pid)}
        onAddNew={() => setShowProductForm(true)}
      />

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
      />

      {/* Barcode Result Dialog */}
      <Dialog open={!!barcodeResult} onOpenChange={() => setBarcodeResult(null)}>
        <DialogContent className="max-w-xs mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{t('scanBarcode')}</DialogTitle>
          </DialogHeader>
          {barcodeResult?.product ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-base ${CATEGORY_COLORS[barcodeResult.product.category]}`}>
                  {CATEGORY_EMOJI[barcodeResult.product.category]}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{lang === 'el' ? barcodeResult.product.name : (barcodeResult.product.nameEn || barcodeResult.product.name)}</p>
                  <p className="text-xs text-muted-foreground">{barcodeResult.barcode}</p>
                </div>
              </div>
              <Button className="w-full rounded-xl" onClick={handleBarcodeAddToList}>
                <Plus size={16} className="mr-1.5" /> {t('addToList')}
              </Button>
            </div>
          ) : barcodeResult?.offData ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                {barcodeResult.offData.imageUrl && (
                  <img src={barcodeResult.offData.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{barcodeResult.offData.name}</p>
                  {barcodeResult.offData.brand && <p className="text-xs text-muted-foreground">{barcodeResult.offData.brand}</p>}
                  <p className="text-[10px] text-muted-foreground font-mono">{barcodeResult.barcode}</p>
                </div>
              </div>
              <p className="text-xs text-primary text-center">{t('foundOnOFF')}</p>
              <Button className="w-full rounded-xl" onClick={handleBarcodeAddToCatalog}>
                <Plus size={16} className="mr-1.5" /> {t('addToCatalog')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">{t('barcodeNotFound')}</p>
              <p className="text-xs text-muted-foreground font-mono">{barcodeResult?.barcode}</p>
              <Button className="w-full rounded-xl" onClick={handleBarcodeAddToCatalog}>
                <Plus size={16} className="mr-1.5" /> {t('addToCatalog')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product form for barcode add */}
      <ProductForm
        open={showProductForm}
        onClose={() => { setShowProductForm(false); setPrefillBarcode(''); setPrefillOffData(null); }}
        onSave={(data) => {
          const newP = addProduct(data);
          if (newP) {
            addItem(newP.id, 1, activeStoreId);
            toast({ title: t('added') });
          }
        }}
        product={prefillBarcode ? { barcode: prefillBarcode, name: prefillOffData?.name || '', category: prefillOffData?.category || 'other' } as any : undefined}
        offImageUrl={prefillOffData?.imageUrl}
      />

      {/* Budget Modal */}
      <Dialog open={budgetModalOpen} onOpenChange={setBudgetModalOpen}>
        <DialogContent className="max-w-xs mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{t('setBudget')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">{t('budgetAmount')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                <Input
                  value={budgetAmountStr}
                  onChange={e => setBudgetAmountStr(e.target.value)}
                  placeholder="50,00"
                  inputMode="decimal"
                  className="pl-8 h-10 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">{t('budgetScope')}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setBudgetScope('global')}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                    budgetScope === 'global' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border'
                  }`}
                >
                  {t('budgetGlobal')}
                </button>
                <button
                  onClick={() => setBudgetScope('store')}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                    budgetScope === 'store' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border'
                  }`}
                >
                  {t('budgetPerStore')}
                </button>
              </div>
            </div>
            {budgetScope === 'store' && (
              <Select value={budgetStoreId} onValueChange={setBudgetStoreId}>
                <SelectTrigger className="h-9 rounded-xl text-sm">
                  <Store size={14} className="mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder={t('selectStore')} />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <div className="flex gap-2">
              {budget && (
                <Button variant="outline" className="flex-1 h-10 rounded-xl text-destructive" onClick={() => { clearBudget(); setBudgetModalOpen(false); }}>
                  {t('removeBudget')}
                </Button>
              )}
              <Button className="flex-1 h-10 rounded-xl" onClick={handleSetBudget}>
                {t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alternatives Swap Dialog */}
      <Dialog open={!!altSwapItem} onOpenChange={() => setAltSwapItem(null)}>
        <DialogContent className="max-w-xs mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{t('alternatives')}</DialogTitle>
          </DialogHeader>
          {altSwapItem && (() => {
            const currentProduct = getProduct(altSwapItem.productId);
            const alts = currentProduct?.alternatives?.map(id => getProduct(id)).filter(Boolean) as Product[] || [];
            return (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">
                  {t('swapProduct')}: <span className="font-medium text-foreground">{productName(altSwapItem.productId)}</span>
                </p>
                {alts.map(alt => (
                  <button
                    key={alt.id}
                    onClick={() => handleSwap(altSwapItem.itemId, alt.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${CATEGORY_COLORS[alt.category]}`}>
                      {CATEGORY_EMOJI[alt.category]}
                    </span>
                    <span className="text-sm font-medium text-foreground flex-1 text-left truncate">
                      {lang === 'el' ? alt.name : (alt.nameEn || alt.name)}
                    </span>
                    <ArrowLeftRight size={14} className="text-primary shrink-0" />
                  </button>
                ))}
                {alts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">{t('noData')}</p>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Save Template Dialog */}
      <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
        <DialogContent className="max-w-xs mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{t('saveAsTemplate')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder={t('templateName')}
              className="rounded-xl"
              onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
            />
            <Button onClick={handleSaveTemplate} className="w-full rounded-xl">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Template Dialog */}
      <Dialog open={showLoadTemplate} onOpenChange={setShowLoadTemplate}>
        <DialogContent className="max-w-xs mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{t('loadTemplate')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {templates.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{t('noTemplates')}</p>
            )}
            {templates.map(tpl => (
              <div key={tpl.id} className="p-3 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{tpl.name}</span>
                  <button onClick={() => { removeTemplate(tpl.id); toast({ title: t('templateDeleted') }); }} className="text-muted-foreground hover:text-destructive">
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{tpl.items.length} {t('itemsCount')}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs rounded-lg" onClick={() => handleLoadTemplate(tpl.id, 'merge')}>
                    {t('mergeTemplate')}
                  </Button>
                  <Button size="sm" className="flex-1 h-7 text-xs rounded-lg" onClick={() => handleLoadTemplate(tpl.id, 'replace')}>
                    {t('replaceTemplate')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplicate Detection Dialog */}
      <DuplicateDialog
        open={!!duplicateInfo}
        onClose={() => setDuplicateInfo(null)}
        productName={duplicateInfo ? productName(duplicateInfo.productId) : ''}
        productCategory={duplicateInfo ? (getProduct(duplicateInfo.productId)?.category || 'other') : 'other'}
        existingQuantity={duplicateInfo ? (rawItems.find(i => i.productId === duplicateInfo.productId)?.quantity || 1) : 1}
        onIncreaseQuantity={handleDuplicateIncrease}
        onAddAgain={handleDuplicateAddAgain}
      />

      {/* Store Check Before Checkout */}
      <Dialog open={storeCheckOpen} onOpenChange={setStoreCheckOpen}>
        <DialogContent className="max-w-xs mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{t('noStoreSelected')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('noStorePrompt')}</p>
          <div className="space-y-2">
            <Button className="w-full rounded-xl" variant="outline" onClick={() => { setStoreCheckOpen(false); }}>
              {t('selectStoreOption')}
            </Button>
            <Button className="w-full rounded-xl" onClick={() => { setStoreCheckOpen(false); doCompletePurchase(); }}>
              {t('continueWithout')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import List Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-xs mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Import Λίστας</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Επικόλλησε τη λίστα ή επίλεξε αρχείο:</p>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              className="w-full h-32 text-xs bg-background border border-border rounded-xl p-3 outline-none resize-none text-foreground"
              placeholder="🛒 Λίστα Ψωνιών..."
            />
            <div className="flex gap-2">
              <label className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary text-secondary-foreground text-xs font-medium cursor-pointer hover:bg-secondary/80 transition-colors">
                <input
                  type="file"
                  accept=".txt,.json"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => setImportText(ev.target?.result as string || '');
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                />
                📎 Αρχείο
              </label>
              <Button onClick={handleImportList} className="flex-1 rounded-xl">{t('confirm')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-size image preview */}
      {fullImageSrc && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-8"
          onClick={() => setFullImageSrc(null)}
        >
          <img src={fullImageSrc} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}
    </div>
  );
}

function InlinePriceInput({ value, onChange, disabled }: { value?: number; onChange: (val: string) => void; disabled?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [tempVal, setTempVal] = useState('');

  const commit = () => {
    setEditing(false);
    onChange(tempVal);
  };

  if (disabled) {
    return value ? (
      <span className="text-xs font-medium text-muted-foreground shrink-0 w-14 text-right">{formatPrice(value)}</span>
    ) : (
      <span className="w-14 shrink-0" />
    );
  }

  if (editing) {
    return (
      <input
        type="text"
        inputMode="decimal"
        value={tempVal}
        onChange={e => setTempVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => e.key === 'Enter' && commit()}
        placeholder="€"
        className="w-14 h-7 text-center text-xs font-medium bg-background border border-primary rounded-lg outline-none text-foreground shrink-0"
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={() => { setTempVal(value ? String(value).replace('.', ',') : ''); setEditing(true); }}
      className="w-14 h-7 text-xs font-medium rounded-lg hover:bg-secondary/50 transition-colors shrink-0 text-right pr-1"
    >
      {value ? <span className="text-foreground">{formatPrice(value)}</span> : <span className="text-muted-foreground/50">€ —</span>}
    </button>
  );
}

function InlineQuantityInput({ value, onChange, unit }: { value: number; onChange: (v: number) => void; unit?: string }) {
  const [editing, setEditing] = useState(false);
  const [tempVal, setTempVal] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const decimal = isDecimalUnit(unit);
  const step = getStep(unit);
  const min = getMin(unit);

  const commit = () => {
    setEditing(false);
    const parsed = parseFloat(tempVal.replace(',', '.'));
    if (!parsed || parsed < min || isNaN(parsed)) {
      onChange(min);
    } else if (!decimal) {
      onChange(Math.max(1, Math.round(parsed)));
    } else {
      onChange(Math.round(parsed * 100) / 100);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={tempVal}
        onChange={e => {
          if (decimal) {
            setTempVal(e.target.value.replace(/[^0-9.,]/g, ''));
          } else {
            setTempVal(e.target.value.replace(/\D/g, ''));
          }
        }}
        onBlur={commit}
        onKeyDown={e => e.key === 'Enter' && commit()}
        className="w-10 h-7 text-center text-xs font-semibold bg-background border border-primary rounded-lg outline-none text-foreground"
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={() => { setTempVal(formatQty(value, unit)); setEditing(true); }}
      className="w-10 h-7 text-center text-xs font-semibold text-foreground rounded-lg hover:bg-secondary/50 transition-colors min-w-[40px] min-h-[28px]"
    >
      {formatQty(value, unit)}
    </button>
  );
}