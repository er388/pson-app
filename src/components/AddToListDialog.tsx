import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Plus, Minus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Product, CATEGORY_EMOJI, Category, CATEGORY_COLORS } from '@/lib/types';
import { useCustomCategories } from '@/lib/useStore';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  onClose: () => void;
  products: Product[];
  existingProductIds: string[];
  onAdd: (productId: string) => void;
  onRemove: (productId: string) => void;
}

export default function AddToListDialog({ open, onClose, products, existingProductIds, onAdd, onRemove }: Props) {
  const { t, lang } = useI18n();
  const { allCategoryKeys } = useCustomCategories();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<Category | 'all'>('all');
  const [justChanged, setJustChanged] = useState<Map<string, 'added' | 'removed'>>(new Map());

  const filtered = useMemo(() => {
    let list = products;
    if (filterCat !== 'all') list = list.filter(p => p.category === filterCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.nameEn?.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.purchaseCount - a.purchaseCount);
  }, [products, filterCat, search]);

  const handleToggle = useCallback((pid: string) => {
    const inList = existingProductIds.includes(pid);
    if (inList) {
      onRemove(pid);
      setJustChanged(prev => new Map(prev).set(pid, 'removed'));
    } else {
      onAdd(pid);
      setJustChanged(prev => new Map(prev).set(pid, 'added'));
    }
    setTimeout(() => setJustChanged(prev => { const n = new Map(prev); n.delete(pid); return n; }), 1200);
  }, [existingProductIds, onAdd, onRemove]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[85vh] !flex flex-col p-0 gap-0" style={{ WebkitOverflowScrolling: 'touch' }}>
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle>{t('addToList')}</DialogTitle>
        </DialogHeader>
        <div className="relative px-5 pb-3 shrink-0">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')} className="pl-10" />
        </div>
        <div className="min-w-0 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-3 no-scrollbar">
            <div className="shrink-0 w-5" aria-hidden />
            <button
              onClick={() => setFilterCat('all')}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterCat === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            >
              {t('all')}
            </button>
            {allCategoryKeys.map(c => (
              <button
                key={c}
                onClick={() => setFilterCat(c)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterCat === c ? 'bg-primary text-primary-foreground' : CATEGORY_COLORS[c] || 'bg-secondary text-secondary-foreground'}`}
              >
                {CATEGORY_EMOJI[c] || '📦'} {t(c as any)}
              </button>
            ))}
            <div className="shrink-0 w-5" aria-hidden />
          </div>
        </div>
        {/* Scrollable product list using native scroll for mobile compatibility */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5 min-h-0 touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="space-y-1.5 py-1">
            <AnimatePresence>
              {filtered.map(p => {
                const inList = existingProductIds.includes(p.id);
                const changeState = justChanged.get(p.id);
                return (
                  <motion.button
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleToggle(p.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors min-h-[52px] text-left ${
                      inList
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-card border-border'
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0 ${CATEGORY_COLORS[p.category] || 'bg-secondary'}`}>
                      {CATEGORY_EMOJI[p.category] || '📦'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {lang === 'el' ? p.name : (p.nameEn || p.name)}
                        {p.unit && p.unit !== 'τεμ.' && <span className="text-muted-foreground font-normal ml-1">({p.unit})</span>}
                      </p>
                      {p.note ? (
                        <p className="text-xs italic text-muted-foreground truncate">{p.note}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">{t(p.category as any)}</p>
                      )}
                    </div>
                    {changeState && (
                      <span className={`text-[10px] font-medium shrink-0 ${changeState === 'added' ? 'text-primary' : 'text-destructive'}`}>
                        {changeState === 'added' ? t('added') : t('removed')}
                      </span>
                    )}
                    <motion.div
                      whileTap={{ scale: 1.2 }}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        inList
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      {inList ? <Minus size={18} /> : <Plus size={18} />}
                    </motion.div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
