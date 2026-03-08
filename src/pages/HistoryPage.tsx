import { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { useProducts, useStores, useCompletedPurchases, useShoppingList, useTemplates } from '@/lib/useStore';
import { formatPrice, CATEGORY_EMOJI, CompletedPurchase } from '@/lib/types';
import { Calendar, Store, ShoppingCart, RotateCcw, Bookmark, ChevronDown, Eye, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function HistoryPage() {
  const { t, lang } = useI18n();
  const { products } = useProducts();
  const { stores } = useStores();
  const { purchases, removePurchase, historyLimit, setHistoryLimit } = useCompletedPurchases();
  const { addItem, clearAll, rawItems } = useShoppingList();
  const { addTemplate } = useTemplates();

  const [filterStore, setFilterStore] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string | null>(null);
  const [detailPurchase, setDetailPurchase] = useState<CompletedPurchase | null>(null);
  const [reloadPurchase, setReloadPurchase] = useState<CompletedPurchase | null>(null);
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [saveTemplateFrom, setSaveTemplateFrom] = useState<CompletedPurchase | null>(null);

  const getProductName = (pid: string) => {
    const p = products.find(pr => pr.id === pid);
    if (!p) return '?';
    return lang === 'el' ? p.name : (p.nameEn || p.name);
  };

  const getStoreName = (sid: string) => stores.find(s => s.id === sid)?.name || '?';

  const months = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach(p => {
      const d = new Date(p.date);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(set).sort().reverse();
  }, [purchases]);

  const filtered = useMemo(() => {
    let list = [...purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (filterStore) {
      list = list.filter(p => p.storeIds.includes(filterStore));
    }
    if (filterMonth) {
      list = list.filter(p => {
        const d = new Date(p.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === filterMonth;
      });
    }
    return list;
  }, [purchases, filterStore, filterMonth]);

  const handleReload = (purchase: CompletedPurchase, mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      clearAll();
      setTimeout(() => {
        purchase.items.forEach(i => addItem(i.productId, i.quantity, i.storeId));
      }, 50);
    } else {
      purchase.items.forEach(i => addItem(i.productId, i.quantity, i.storeId));
    }
    setReloadPurchase(null);
    toast({ title: t('listReloaded') });
  };

  const handleSaveTemplate = () => {
    if (!saveTemplateName.trim() || !saveTemplateFrom) return;
    addTemplate(
      saveTemplateName.trim(),
      saveTemplateFrom.items.map(i => ({ productId: i.productId, quantity: i.quantity, storeId: i.storeId }))
    );
    setSaveTemplateName('');
    setSaveTemplateFrom(null);
    toast({ title: t('templateSaved') });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
      <h1 className="text-2xl font-bold text-foreground mb-4">{t('purchaseHistoryList')}</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <Select value={filterStore || '__all__'} onValueChange={v => setFilterStore(v === '__all__' ? null : v)}>
          <SelectTrigger className="h-9 rounded-xl text-xs flex-1">
            <Store size={14} className="mr-1 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('allStores')}</SelectItem>
            {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMonth || '__all__'} onValueChange={v => setFilterMonth(v === '__all__' ? null : v)}>
          <SelectTrigger className="h-9 rounded-xl text-xs flex-1">
            <Calendar size={14} className="mr-1 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('allMonths')}</SelectItem>
            {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* History limit info */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-xs text-muted-foreground">{filtered.length} / {purchases.length} {t('listsKept')}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{t('historyLimit')}:</span>
          <select
            value={historyLimit}
            onChange={e => setHistoryLimit(Number(e.target.value))}
            className="text-xs bg-secondary rounded-lg px-2 py-1 text-foreground border-none outline-none"
          >
            {[20, 30, 50, 100].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Purchase cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-lg font-semibold text-foreground mb-1">{t('noHistory')}</h2>
          <p className="text-sm text-muted-foreground">{t('noHistoryDesc')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(purchase => (
              <motion.div
                key={purchase.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-2xl bg-card border border-border shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{formatDate(purchase.date)}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(purchase.date)}</p>
                  </div>
                  <span className="text-lg font-bold text-primary">{formatPrice(purchase.total)}</span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {purchase.storeIds.length > 0 ? (
                    purchase.storeIds.map(sid => (
                      <span key={sid} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        🏪 {getStoreName(sid)}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('noStore')}</span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {purchase.items.length} {t('products_count')}
                  </span>
                </div>

                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg flex-1" onClick={() => setDetailPurchase(purchase)}>
                    <Eye size={13} className="mr-1" /> {t('viewDetails')}
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg flex-1" onClick={() => setReloadPurchase(purchase)}>
                    <RotateCcw size={13} className="mr-1" /> {t('reloadList')}
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg" onClick={() => { setSaveTemplateFrom(purchase); setSaveTemplateName(''); }}>
                    <Bookmark size={13} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailPurchase} onOpenChange={() => setDetailPurchase(null)}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {detailPurchase && `📋 ${formatDate(detailPurchase.date)}`}
            </DialogTitle>
          </DialogHeader>
          {detailPurchase && (
            <div className="space-y-2">
              {detailPurchase.storeIds.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {detailPurchase.storeIds.map(sid => (
                    <span key={sid} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      🏪 {getStoreName(sid)}
                    </span>
                  ))}
                </div>
              )}
              <div className="space-y-1">
                {detailPurchase.items.map((item, i) => {
                  const p = products.find(pr => pr.id === item.productId);
                  return (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-secondary/30">
                      <span className="text-sm">{p ? CATEGORY_EMOJI[p.category] || '📦' : '?'}</span>
                      <span className="text-sm flex-1 truncate text-foreground">{getProductName(item.productId)}</span>
                      <span className="text-xs text-muted-foreground">×{item.quantity}</span>
                      {item.price > 0 && (
                        <span className="text-xs font-medium text-foreground">{formatPrice(item.price * item.quantity)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-sm font-medium text-foreground">{t('total')}</span>
                <span className="text-lg font-bold text-primary">{formatPrice(detailPurchase.total)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reload Confirm Dialog */}
      <Dialog open={!!reloadPurchase} onOpenChange={() => setReloadPurchase(null)}>
        <DialogContent className="max-w-xs mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{t('reloadConfirm')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button className="w-full rounded-xl" variant="outline" onClick={() => reloadPurchase && handleReload(reloadPurchase, 'merge')}>
              {t('mergeWithCurrent')}
            </Button>
            <Button className="w-full rounded-xl" onClick={() => reloadPurchase && handleReload(reloadPurchase, 'replace')}>
              {t('replaceCurrentList')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save as Template Dialog */}
      <Dialog open={!!saveTemplateFrom} onOpenChange={() => setSaveTemplateFrom(null)}>
        <DialogContent className="max-w-xs mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{t('saveAsTemplateFromHistory')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={saveTemplateName}
              onChange={e => setSaveTemplateName(e.target.value)}
              placeholder={t('templateName')}
              className="rounded-xl"
              onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
            />
            <Button onClick={handleSaveTemplate} className="w-full rounded-xl">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}