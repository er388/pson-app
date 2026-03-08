import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useProducts, useCustomCategories } from '@/lib/useStore';
import { CATEGORY_EMOJI, CATEGORY_COLORS, Category, Product } from '@/lib/types';
import ProductForm from '@/components/ProductForm';
import { motion, AnimatePresence } from 'framer-motion';

export default function CatalogPage() {
  const { t, lang } = useI18n();
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { allCategoryKeys, customCategories } = useCustomCategories();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<Category | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const getCatLabel = (key: string) => {
    const custom = customCategories.find(c => c.id === key);
    if (custom) return lang === 'el' ? custom.name : (custom.nameEn || custom.name);
    return t(key as any);
  };

  const filtered = useMemo(() => {
    let list = products;
    if (filterCat !== 'all') list = list.filter(p => p.category === filterCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.nameEn?.toLowerCase().includes(q));
    }
    return list;
  }, [products, filterCat, search]);

  const grouped = useMemo(() => {
    const map = new Map<Category, Product[]>();
    filtered.forEach(p => {
      const arr = map.get(p.category) || [];
      arr.push(p);
      map.set(p.category, arr);
    });
    return map;
  }, [filtered]);

  const handleSave = (data: { name: string; nameEn?: string; category: Category; barcode?: string }) => {
    if (editing) {
      updateProduct(editing.id, data);
      setEditing(null);
    } else {
      addProduct(data);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-foreground mb-3">{t('catalog')}</h1>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')} className="pl-9 h-9 rounded-xl text-sm" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setFilterCat('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterCat === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
          >
            {t('all')} ({products.length})
          </button>
          {allCategoryKeys.map(c => {
            const count = products.filter(p => p.category === c).length;
            if (count === 0) return null;
            return (
              <button
                key={c}
                onClick={() => setFilterCat(c)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterCat === c ? 'bg-primary text-primary-foreground' : CATEGORY_COLORS[c] || 'bg-secondary text-secondary-foreground'}`}
              >
                {CATEGORY_EMOJI[c] || '📦'} {count}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-24">
        {filterCat === 'all' ? (
          Array.from(grouped.entries()).map(([cat, prods]) => (
            <div key={cat} className="mb-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                {CATEGORY_EMOJI[cat] || '📦'} {getCatLabel(cat)}
              </h2>
              <div className="space-y-1.5">
                <AnimatePresence>
                  {prods.map(p => (
                    <ProductCard key={p.id} product={p} lang={lang} t={t} onEdit={() => { setEditing(p); setFormOpen(true); }} onDelete={() => deleteProduct(p.id)} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence>
              {filtered.map(p => (
                <ProductCard key={p.id} product={p} lang={lang} t={t} onEdit={() => { setEditing(p); setFormOpen(true); }} onDelete={() => deleteProduct(p.id)} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-lg font-semibold text-foreground mb-1">{t('noProducts')}</h2>
            <p className="text-sm text-muted-foreground mb-6">{t('addFirst')}</p>
            <Button onClick={() => setFormOpen(true)} className="rounded-xl">
              <Plus size={18} className="mr-1.5" /> {t('addProduct')}
            </Button>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditing(null); setFormOpen(true); }}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center z-50 active:scale-95 transition-transform"
      >
        <Plus size={24} />
      </button>

      <ProductForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSave={handleSave}
        product={editing}
      />
    </div>
  );
}

function ProductCard({ product, lang, t, onEdit, onDelete }: { product: Product; lang: string; t: any; onEdit: () => void; onDelete: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-sm"
    >
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${CATEGORY_COLORS[product.category]}`}>
        {CATEGORY_EMOJI[product.category]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {lang === 'el' ? product.name : (product.nameEn || product.name)}
        </p>
        {product.nameEn && lang === 'el' && (
          <p className="text-[11px] text-muted-foreground truncate">{product.nameEn}</p>
        )}
      </div>
      <div className="flex gap-1">
        <button onClick={onEdit} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
          <Edit2 size={15} />
        </button>
        <button onClick={onDelete} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
    </motion.div>
  );
}
