import { useState, useMemo } from 'react';
import { Plus, Search, Store, Trash2, Minus, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { useProducts, useShoppingList, useStores, usePurchaseHistory, useCompletedPurchases } from '@/lib/useStore';
import { CATEGORY_EMOJI, CATEGORY_COLORS } from '@/lib/types';
import AddToListDialog from '@/components/AddToListDialog';
import PriceDialog from '@/components/PriceDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

export default function ShoppingListPage() {
  const { t, lang } = useI18n();
  const { products, incrementPurchaseCount } = useProducts();
  const { items, addItem, removeItem, removeByProductId, toggleCheck, updateQuantity, clearChecked, clearAll, total, getStoreTotal, activeStoreId, setActiveStoreId } = useShoppingList();
  const { stores } = useStores();
  const { addRecord } = usePurchaseHistory();
  const { addPurchase } = useCompletedPurchases();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [priceItem, setPriceItem] = useState<{ id: string; productId: string } | null>(null);
  const [collapsedStores, setCollapsedStores] = useState<Set<string>>(new Set());

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

  // Group items by store
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
    // Sort: named stores first, null last
    return keys.sort((a, b) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return 0;
    });
  }, [groupedByStore]);

  const handleCheck = (id: string, productId: string) => {
    const item = items.find(i => i.id === id);
    if (item?.checked) {
      toggleCheck(id);
    } else {
      setPriceItem({ id, productId });
    }
  };

  const handlePriceConfirm = (price?: number, discount?: number) => {
    if (!priceItem) return;
    const item = items.find(i => i.id === priceItem.id);
    toggleCheck(priceItem.id, price, discount);
    const storeId = item?.storeId || activeStoreId;
    if (price && storeId) {
      addRecord({ productId: priceItem.productId, price, discount: discount || 0, storeId, date: new Date().toISOString() });
    }
    setPriceItem(null);
  };

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

    // Increment purchase counts
    checkedItems.forEach(i => incrementPurchaseCount(i.productId));

    clearChecked();
    toast({ title: t('purchaseCompleted'), description: `€${total.toFixed(2)}` });
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

  const renderItem = (item: typeof items[0], isChecked: boolean) => {
    const p = getProduct(item.productId);
    if (isChecked) {
      return (
        <motion.div
          key={item.id}
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 0.6, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50"
        >
          <button
            onClick={() => handleCheck(item.id, item.productId)}
            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" className="text-primary-foreground">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </button>
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${p ? CATEGORY_COLORS[p.category] : ''}`}>
            {p ? CATEGORY_EMOJI[p.category] : '?'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm line-through text-muted-foreground truncate">
              {productName(item.productId)}
            </p>
          </div>
          {item.price && (
            <span className="text-xs font-medium text-muted-foreground">
              €{(item.price * (1 - (item.discount || 0) / 100) * item.quantity).toFixed(2)}
            </span>
          )}
          <span className="text-xs text-muted-foreground">×{item.quantity}</span>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={item.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-sm"
      >
        <button
          onClick={() => handleCheck(item.id, item.productId)}
          className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 shrink-0 transition-colors hover:border-primary"
        />
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${p ? CATEGORY_COLORS[p.category] : ''}`}>
          {p ? CATEGORY_EMOJI[p.category] : '?'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {productName(item.productId)}
          </p>
          {p && <p className="text-[11px] text-muted-foreground">{t(p.category as any)}</p>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground"
          >
            <Minus size={14} />
          </button>
          <span className="w-6 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground"
          >
            <Plus size={14} />
          </button>
        </div>
      </motion.div>
    );
  };

  const renderStoreSection = (storeId: string | null) => {
    const storeItems = groupedByStore.get(storeId) || [];
    const storeName = storeId ? stores.find(s => s.id === storeId)?.name || t('noStore') : t('noStore');
    const storeTotal = getStoreTotal(storeId);
    const collapsed = isCollapsed(storeId);
    const checked = storeItems.filter(i => i.checked);
    const unchecked = storeItems.filter(i => !i.checked);

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
            <span className="text-xs font-medium text-primary">€{storeTotal.toFixed(2)}</span>
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
              {checked.map(item => renderItem(item, true))}
              {unchecked.map(item => renderItem(item, false))}
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
          {totalCount > 0 && (
            <span className="text-sm text-muted-foreground font-medium">
              {checkedCount}/{totalCount}
            </span>
          )}
        </div>

        {/* Store selector for new items */}
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

        {/* Search */}
        {totalCount > 3 && (
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')} className="pl-9 h-9 rounded-xl text-sm" />
          </div>
        )}
      </div>

      <div className="px-4 pb-24">
        {/* Actions bar */}
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

        {/* Items grouped by store */}
        {hasMultipleStores ? (
          storeKeys.map(storeId => renderStoreSection(storeId))
        ) : (
          <>
            {/* Single store / flat view */}
            <AnimatePresence>
              {filteredItems.filter(i => i.checked).length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    {t('checkedItems')} ({filteredItems.filter(i => i.checked).length})
                  </span>
                  <div className="space-y-1.5">
                    {filteredItems.filter(i => i.checked).map(item => renderItem(item, true))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <AnimatePresence>
                {filteredItems.filter(i => !i.checked).map(item => renderItem(item, false))}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* Empty state */}
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

        {/* Grand Total */}
        {total > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{hasMultipleStores ? t('grandTotal') : t('total')}</span>
              <span className="text-xl font-bold text-primary">€{total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
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

      {priceItem && (
        <PriceDialog
          open
          productName={productName(priceItem.productId)}
          onClose={() => setPriceItem(null)}
          onConfirm={handlePriceConfirm}
        />
      )}
    </div>
  );
}
