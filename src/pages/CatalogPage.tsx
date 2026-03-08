import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useProducts, useCustomCategories } from '@/lib/useStore';
import { CATEGORY_EMOJI, CATEGORY_COLORS, Category, Product } from '@/lib/types';
import ProductForm from '@/components/ProductForm';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

export default function CatalogPage() {
  const { t, lang } = useI18n();
  const { products, addProduct, updateProduct, deleteProduct, toggleFavorite } = useProducts();
  const { allCategoryKeys, customCategories } = useCustomCategories();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<Category | 'all' | 'favorites'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const getCatLabel = (key: string) => {
    const custom = customCategories.find(c => c.id === key);
    if (custom) return lang === 'el' ? custom.name : (custom.nameEn || custom.name);
    return t(key as any);
  };

  const filtered = useMemo(() => {
    let list = products;
    if (filterCat === 'favorites') list = list.filter(p => p.favorite);
    else if (filterCat !== 'all') list = list.filter(p => p.category === filterCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.nameEn?.toLowerCase().includes(q));
    }
    // Sort favorites first
    return [...list].sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return 0;
    });
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

  const handleSave = (data: Parameters<typeof addProduct>[0]) => {
    if (editing) {
      updateProduct(editing.id, data);
      setEditing(null);
    } else {
      addProduct(data);
    }
  };

  const handleToggleFavorite = (p: Product) => {
    toggleFavorite(p.id);
    toast({
      title: p.favorite ? t('favoriteRemoved') : t('favoriteAdded'),
      duration: 1500,
    });
  };

  const favCount = products.filter(p => p.favorite).length;

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
          {favCount > 0 && (
            <button
              onClick={() => setFilterCat('favorites')}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${filterCat === 'favorites' ? 'bg-primary text-primary-foreground' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}
            >
              <Star size={12} fill="currentColor" /> {favCount}
            </button>
          )}
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
        {filterCat === 'all' || filterCat === 'favorites' ? (
          Array.from(grouped.entries()).map(([cat, prods]) => (
            <div key={cat} className="mb-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                {CATEGORY_EMOJI[cat] || '📦'} {getCatLabel(cat)}
              </h2>
              <div className="space-y-1.5">
                <AnimatePresence>
                  {prods.map(p => (
                    <ProductCard key={p.id} product={p} lang={lang} t={t} onEdit={() => { setEditing(p); setFormOpen(true); }} onDelete={() => deleteProduct(p.id)} onToggleFav={() => handleToggleFavorite(p)} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence>
              {filtered.map(p => (
                <ProductCard key={p.id} product={p} lang={lang} t={t} onEdit={() => { setEditing(p); setFormOpen(true); }} onDelete={() => deleteProduct(p.id)} onToggleFav={() => handleToggleFavorite(p)} />
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

function ProductCard({ product, lang, t, onEdit, onDelete, onToggleFav }: { product: Product; lang: string; t: any; onEdit: () => void; onDelete: () => void; onToggleFav: () => void }) {
  const [showFullImage, setShowFullImage] = useState(false);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-sm"
      >
        {product.image ? (
          <button onClick={() => setShowFullImage(true)} className="shrink-0">
            <img src={product.image} alt="" className="w-10 h-10 rounded-xl object-cover border border-border" />
          </button>
        ) : (
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-base ${CATEGORY_COLORS[product.category]}`}>
            {CATEGORY_EMOJI[product.category]}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {lang === 'el' ? product.name : (product.nameEn || product.name)}
            {product.unit && product.unit !== 'τεμ.' && (
              <span className="text-muted-foreground font-normal ml-1">({product.unit})</span>
            )}
          </p>
          {product.nameEn && lang === 'el' && (
            <p className="text-[11px] text-muted-foreground truncate">{product.nameEn}</p>
          )}
          {product.note && (
            <p className="text-[11px] italic text-muted-foreground truncate">📝 {product.note}</p>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={onToggleFav} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-secondary">
            <Star size={15} className={product.favorite ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'} />
          </button>
          <button onClick={onEdit} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
            <Edit2 size={15} />
          </button>
          <button onClick={onDelete} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      </motion.div>

      {/* Full-size image preview */}
      {showFullImage && product.image && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-8"
          onClick={() => setShowFullImage(false)}
        >
          <img src={product.image} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}
    </>
  );
}
