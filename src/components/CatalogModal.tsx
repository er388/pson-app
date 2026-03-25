import { useState, useMemo, useCallback } from 'react';
import { X, Search, Plus, Edit2, Trash2, Star, ScanLine, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useProducts, useCustomCategories } from '@/lib/useStore';
import { CATEGORY_EMOJI, CATEGORY_COLORS, Category, Product } from '@/lib/types';
import ProductForm from '@/components/ProductForm';
import BarcodeScanner from '@/components/BarcodeScanner';
import { showUndo } from '@/components/UndoSnackbar';
import { toast } from '@/hooks/use-toast';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { backStack } from '@/lib/backStack';
import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

function SortableProductRow({ product, lang, t, canDrag, onEdit, onDelete, onToggleFav }: {
  product: Product; lang: string; t: any; canDrag: boolean;
  onEdit: () => void; onDelete: () => void; onToggleFav: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: product.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-sm"
    >
      {canDrag ? (
        <button {...attributes} {...listeners} className="text-muted-foreground/40 touch-none shrink-0 cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </button>
      ) : (
        <div className="w-4 shrink-0" />
      )}

      {product.image ? (
        <img src={product.image} alt="" className="w-10 h-10 rounded-xl object-cover border border-border shrink-0" />
      ) : (
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 ${CATEGORY_COLORS[product.category] || 'bg-secondary'}`}>
          {CATEGORY_EMOJI[product.category] || '📦'}
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

      <div className="flex gap-1 shrink-0">
        <button onClick={onToggleFav} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
          <Star size={15} className={product.favorite ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'} />
        </button>
        <button onClick={onEdit} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
          <Edit2 size={15} />
        </button>
        <button onClick={onDelete} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

export default function CatalogModal({ open, onClose }: Props) {
  const { t, lang } = useI18n();
  const { products, addProduct, updateProduct, deleteProduct, toggleFavorite, setAllProducts } = useProducts();
  const { allCategoryKeys, customCategories } = useCustomCategories();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<Category | 'all' | 'favorites'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      backStack.push(onClose);
      return () => { backStack.pop(); };
    }
  }, [open, onClose]);

  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const hasFilter = !!(search || filterCat !== 'all');

  const getCatLabel = useCallback((key: string) => {
    const custom = customCategories.find(c => c.id === key);
    if (custom) return lang === 'el' ? custom.name : (custom.nameEn || custom.name);
    return t(key as any);
  }, [customCategories, lang, t]);

  const filtered = useMemo(() => {
    let list = products;
    if (filterCat === 'favorites') list = list.filter(p => p.favorite);
    else if (filterCat !== 'all') list = list.filter(p => p.category === filterCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.nameEn?.toLowerCase().includes(q));
    }
    return list; // no auto-sort — order preserved as stored
  }, [products, filterCat, search]);

  const handleSave = useCallback((data: Parameters<typeof addProduct>[0]) => {
    if (editing) {
      updateProduct(editing.id, data);
      setEditing(null);
    } else {
      addProduct(data);
    }
  }, [editing, updateProduct, addProduct]);

  const handleDelete = useCallback((p: Product) => {
    const snapshot = [...products];
    deleteProduct(p.id);
    const name = lang === 'el' ? p.name : (p.nameEn || p.name);
    showUndo(`"${name}" ${t('deleted').toLowerCase()}`, () => setAllProducts(snapshot));
  }, [products, deleteProduct, lang, t, setAllProducts]);

  const handleToggleFavorite = useCallback((p: Product) => {
    toggleFavorite(p.id);
    toast({ title: p.favorite ? t('favoriteRemoved') : t('favoriteAdded'), duration: 1500 });
  }, [toggleFavorite, t]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = products.findIndex(p => p.id === active.id);
    const newIdx = products.findIndex(p => p.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      setAllProducts(arrayMove(products, oldIdx, newIdx));
    }
  }, [products, setAllProducts]);

  const handleBarcodeScan = useCallback((barcode: string) => {
    setScannerOpen(false);
    const found = products.find(p => p.barcode === barcode);
    if (found) {
      setSearch(lang === 'el' ? found.name : (found.nameEn || found.name));
      setFilterCat('all');
    } else {
      setEditing({ barcode } as any);
      setFormOpen(true);
    }
  }, [products, lang]);

  const favCount = useMemo(() => products.filter(p => p.favorite).length, [products]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm px-4 pt-4 pb-2 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-foreground">{t('productCatalog')}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search')}
            className="pl-9 pr-10 h-9 rounded-xl text-sm"
          />
          <button
            onClick={() => setScannerOpen(true)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ScanLine size={16} className="text-muted-foreground" />
          </button>
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

        {hasFilter && (
          <p className="text-[10px] text-muted-foreground pb-1">
            🔒 Drag-and-drop απενεργοποιημένο κατά το φιλτράρισμα
          </p>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3" style={{ WebkitOverflowScrolling: 'touch' }}>
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-lg font-semibold text-foreground mb-1">{t('noProducts')}</h2>
            <p className="text-sm text-muted-foreground mb-6">{t('addFirst')}</p>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="rounded-xl">
              <Plus size={18} className="mr-1.5" /> {t('addProduct')}
            </Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filtered.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5 pb-24">
                {filtered.map(p => (
                  <SortableProductRow
                    key={p.id}
                    product={p}
                    lang={lang}
                    t={t}
                    canDrag={!hasFilter}
                    onEdit={() => { setEditing(p); setFormOpen(true); }}
                    onDelete={() => handleDelete(p)}
                    onToggleFav={() => handleToggleFavorite(p)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditing(null); setFormOpen(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center z-[101] active:scale-95 transition-transform"
      >
        <Plus size={24} />
      </button>

      <ProductForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSave={handleSave}
        product={editing}
      />

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
      />
    </div>
  );
}