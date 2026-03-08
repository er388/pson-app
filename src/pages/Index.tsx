import { useState, useMemo, useRef, useCallback } from 'react';
import { Plus, Search, Store, Trash2, Minus, ChevronDown, ChevronUp, CheckCircle2, Share2, Bookmark, BookmarkPlus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { useProducts, useShoppingList, useStores, usePurchaseHistory, useCompletedPurchases, useTemplates } from '@/lib/useStore';
import { CATEGORY_EMOJI, CATEGORY_COLORS, formatPrice } from '@/lib/types';
import AddToListDialog from '@/components/AddToListDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function ShoppingListPage() {
  const { t, lang } = useI18n();
  const { products, incrementPurchaseCount } = useProducts();
  const { items, addItem, removeItem, removeByProductId, toggleCheck, updateQuantity, clearChecked, clearAll, total, getStoreTotal, activeStoreId, setActiveStoreId, setAllItems, rawItems } = useShoppingList();
  const { stores } = useStores();
  const { addRecord } = usePurchaseHistory();
  const { addPurchase, purchases: completedPurchases } = useCompletedPurchases();
  const { templates, addTemplate, removeTemplate } = useTemplates();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [collapsedStores, setCollapsedStores] = useState<Set<string>>(new Set());
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showLoadTemplate, setShowLoadTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [quickAddOpen, setQuickAddOpen] = useState(true);

  const getProduct = (pid: string) => products.find(p => p.id === pid);
  const productName = (pid: string) => {
    const p = getProduct(pid);
    if (!p) return '?';
    return lang === 'el' ? p.name : (p.nameEn || p.name);
  };

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(i => {
      const p = getProduct(i.productId);
      return p && (p.name.toLowerCase().includes(q) || p.nameEn?.toLowerCase().includes(q));
    });
  }, [items, search, products]);

  const groupedByStore = useMemo(() => {
    const map = new Map<string | null, typeof filteredItems>();
    filteredItems.forEach(item => {
      const key = item.storeId || null;
      const arr = map.get(key) || [];
      arr.push(item);
      map.set(key, arr);
    });
    return map;
  }, [filteredItems]);

  const storeKeys = useMemo(() => {
    const keys: (string | null)[] = [];
    groupedByStore.forEach((_, key) => keys.push(key));
    return keys.sort((a, b) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return 0;
    });
  }, [groupedByStore]);

  // Frequent products for quick add
  const frequentProducts = useMemo(() => {
    const countMap = new Map<string, number>();
    completedPurchases.forEach(p => {
      p.items.forEach(i => {
        countMap.set(i.productId, (countMap.get(i.productId) || 0) + i.quantity);
      });
    });
    // If no history, use products sorted by purchaseCount
    if (countMap.size === 0) {
      return products
        .filter(p => p.purchaseCount > 0)
        .sort((a, b) => b.purchaseCount - a.purchaseCount)
        .slice(0, 10);
    }
    return [...countMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pid]) => products.find(p => p.id === pid))
      .filter(Boolean) as typeof products;
  }, [completedPurchases, products]);

  const existingProductIds = useMemo(() => new Set(items.map(i => i.productId)), [items]);

  const handleCheck = (id: string) => {
    toggleCheck(id);
  };

  const handleUpdatePrice = useCallback((id: string, priceStr: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const price = priceStr ? parseFloat(priceStr.replace(',', '.')) : undefined;
    // We store price directly on the item via toggleCheck logic
    // But since we removed the dialog, we need a direct price update
    // Use the setAllItems approach to update price inline
    const updated = rawItems.map(i => i.id === id ? { ...i, price: price || undefined } : i);
    setAllItems(updated);
  }, [items, rawItems, setAllItems]);

  const handleCompletePurchase = () => {
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

    // Record individual price history
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

  const toggleCollapse = (storeId: string | null) => {
    const key = storeId || '__none__';
    setCollapsedStores(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };

  const isCollapsed = (storeId: string | null) => collapsedStores.has(storeId || '__none__');

  const checkedCount = items.filter(i => i.checked).length;
  const totalCount = items.length;
  const hasMultipleStores = storeKeys.length > 1;

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
        let line = `- ${name} ${unit} × ${item.quantity}`;
        if (item.price) {
          line += ` — ${formatPrice(item.price * item.quantity)}`;
        }
        text += line + '\n';
      });
    });

    if (total > 0) {
      text += `\n💰 Σύνολο: ${formatPrice(total)}`;
    }

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: t('copied') });
    }
  };

  // Save template
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

  // Load template
  const handleLoadTemplate = (templateId: string, mode: 'merge' | 'replace') => {
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;
    if (mode === 'replace') {
      clearAll();
      // Small delay to let state settle
      setTimeout(() => {
        tpl.items.forEach(i => addItem(i.productId, i.quantity, i.storeId));
      }, 50);
    } else {
      tpl.items.forEach(i => addItem(i.productId, i.quantity, i.storeId));
    }
    setShowLoadTemplate(false);
    toast({ title: t('templateLoaded') });
  };

  const renderItem = (item: typeof items[0]) => {
    const p = getProduct(item.productId);
    const unitLabel = p?.unit && p.unit !== 'τεμ.' ? p.unit : 'τεμ.';
    const isChecked = item.checked;

    return (
      <motion.div
        key={item.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isChecked ? 0.6 : 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className={`flex items-center gap-2 p-2.5 rounded-xl border shadow-sm ${isChecked ? 'bg-muted/50 border-border/50' : 'bg-card border-border'}`}
      >
        {/* Check circle */}
        <button
          onClick={() => handleCheck(item.id)}
          className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center transition-colors min-w-[28px] min-h-[28px]"
          style={isChecked ? {} : {}}
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

        {/* Emoji or thumbnail */}
        {p?.image ? (
          <img src={p.image} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
        ) : (
          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 ${p ? CATEGORY_COLORS[p.category] : ''}`}>
            {p ? CATEGORY_EMOJI[p.category] : '?'}
          </span>
        )}

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {productName(item.productId)}
          </p>
          {!isChecked && p?.note && <p className="text-[11px] italic text-muted-foreground truncate">{p.note}</p>}
        </div>

        {/* Inline price */}
        <InlinePriceInput
          value={item.price}
          onChange={(val) => handleUpdatePrice(item.id, val)}
          disabled={isChecked}
        />

        {/* Quantity controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => {
              if (item.quantity <= 1) {
                removeItem(item.id);
              } else {
                updateQuantity(item.id, item.quantity - 1);
              }
            }}
            className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground min-w-[28px] min-h-[28px]"
          >
            {item.quantity <= 1 ? <Trash2 size={13} className="text-destructive" /> : <Minus size={13} />}
          </button>
          <InlineQuantityInput
            value={item.quantity}
            onChange={(val) => updateQuantity(item.id, val)}
          />
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground min-w-[28px] min-h-[28px]"
          >
            <Plus size={13} />
          </button>
          <span className="text-[9px] text-muted-foreground w-6 text-center">{unitLabel}</span>
        </div>
      </motion.div>
    );
  };

  const renderStoreSection = (storeId: string | null) => {
    const storeItems = groupedByStore.get(storeId) || [];
    const storeName = storeId ? stores.find(s => s.id === storeId)?.name || t('noStore') : t('noStore');
    const storeTotal = getStoreTotal(storeId);
    const collapsed = isCollapsed(storeId);

    return (
      <div key={storeId || 'none'} className="mb-4">
        <button
          onClick={() => toggleCollapse(storeId)}
          className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 mb-2"
        >
          <Store size={16} className="text-muted-foreground shrink-0" />
          <span className="text-sm font-semibold text-foreground flex-1 text-left">{storeName}</span>
          <span className="text-xs text-muted-foreground">{storeItems.length} {t('itemsCount')}</span>
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
              {storeItems.map(item => renderItem(item))}
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
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-foreground">{t('shoppingList')}</h1>
          <div className="flex items-center gap-1.5">
            {totalCount > 0 && (
              <span className="text-sm text-muted-foreground font-medium mr-1">
                {checkedCount}/{totalCount}
              </span>
            )}
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

        {totalCount > 3 && (
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')} className="pl-9 h-9 rounded-xl text-sm" />
          </div>
        )}
      </div>

      <div className="px-4 pb-24">
        {/* Quick Add Section */}
        {frequentProducts.length > 0 && (
          <Collapsible open={quickAddOpen} onOpenChange={setQuickAddOpen} className="mb-4">
            <CollapsibleTrigger className="w-full flex items-center gap-2 py-2">
              <Zap size={14} className="text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1 text-left">{t('quickAdd')}</span>
              {quickAddOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {frequentProducts.map(p => {
                  const inList = existingProductIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (inList) {
                          removeByProductId(p.id);
                        } else {
                          addItem(p.id, 1, activeStoreId);
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

        {hasMultipleStores ? (
          storeKeys.map(storeId => renderStoreSection(storeId))
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence>
              {filteredItems.map(item => renderItem(item))}
            </AnimatePresence>
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
              <span className="text-sm font-medium text-foreground">{hasMultipleStores ? t('grandTotal') : t('total')}</span>
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
        onAdd={pid => addItem(pid, 1, activeStoreId)}
        onRemove={pid => removeByProductId(pid)}
      />

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

function InlineQuantityInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [tempVal, setTempVal] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    setEditing(false);
    const parsed = parseInt(tempVal, 10);
    if (!parsed || parsed < 1 || isNaN(parsed)) {
      onChange(1);
    } else {
      onChange(parsed);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={tempVal}
        onChange={e => setTempVal(e.target.value.replace(/\D/g, ''))}
        onBlur={commit}
        onKeyDown={e => e.key === 'Enter' && commit()}
        className="w-8 h-7 text-center text-xs font-semibold bg-background border border-primary rounded-lg outline-none text-foreground"
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={() => { setTempVal(String(value)); setEditing(true); }}
      className="w-8 h-7 text-center text-xs font-semibold text-foreground rounded-lg hover:bg-secondary/50 transition-colors min-w-[32px] min-h-[28px]"
    >
      {value}
    </button>
  );
}
