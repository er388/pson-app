import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Product, CATEGORY_EMOJI, Category, CATEGORY_COLORS } from '@/lib/types';
import { useCustomCategories } from '@/lib/useStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  onClose: () => void;
  products: Product[];
  existingProductIds: string[];
  onAdd: (productId: string) => void;
}

export default function AddToListDialog({ open, onClose, products, existingProductIds, onAdd }: Props) {
  const { t, lang } = useI18n();
  const { allCategoryKeys } = useCustomCategories();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<Category | 'all'>('all');
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = products;
    if (filterCat !== 'all') list = list.filter(p => p.category === filterCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.nameEn?.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.purchaseCount - a.purchaseCount);
  }, [products, filterCat, search]);

  const handleAdd = (pid: string) => {
    onAdd(pid);
    setJustAdded(prev => new Set(prev).add(pid));
    setTimeout(() => setJustAdded(prev => { const n = new Set(prev); n.delete(pid); return n; }), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[85vh] !flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle>{t('addToList')}</DialogTitle>
        </DialogHeader>
        <div className="relative px-5 pb-3">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')} className="pl-10" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-3 no-scrollbar px-5">
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
        </div>
        <ScrollArea className="flex-1 px-5 pb-5">
          <div className="space-y-1.5 py-1">
            <AnimatePresence>
              {filtered.map(p => {
                const inList = existingProductIds.includes(p.id);
                const added = justAdded.has(p.id);
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${CATEGORY_COLORS[p.category]}`}>
                      {CATEGORY_EMOJI[p.category]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {lang === 'el' ? p.name : (p.nameEn || p.name)}
                      </p>
                      <p className="text-xs text-muted-foreground">{t(p.category as any)}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={inList || added ? 'secondary' : 'default'}
                      className="h-8 w-8 p-0 rounded-lg"
                      onClick={() => handleAdd(p.id)}
                      disabled={inList}
                    >
                      {inList || added ? <Check size={16} /> : <Plus size={16} />}
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
