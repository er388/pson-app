import { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, Edit2, Check, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { useCustomCategories, useProducts } from '@/lib/useStore';
import { DEFAULT_CATEGORIES, CATEGORY_EMOJI, CATEGORY_COLORS, CustomCategory, DefaultCategory } from '@/lib/types';
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

type DeleteTarget =
  | { kind: 'custom'; category: CustomCategory }
  | { kind: 'default'; key: DefaultCategory; name: string };

const CUSTOM_COLORS = [
  'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
];

const EMOJI_OPTIONS = ['🛒', '🏷️', '🧃', '🥫', '🫘', '🧂', '🫒', '🍯', '🧈', '🥜', '🌮', '🍕', '🍰', '🧀', '🫙'];

export default function CategoryManager() {
  const { t, lang } = useI18n();
  const {
    customCategories,
    addCategory,
    updateCategory,
    removeCategory,
    defaultCategoryOverrides,
    updateDefaultCategory,
    hideDefaultCategory,
    hiddenDefaultCategories,
  } = useCustomCategories();
  const { products, setAllProducts } = useProducts();

  const [newName, setNewName] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newEmoji, setNewEmoji] = useState('🏷️');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [editingDefaultKey, setEditingDefaultKey] = useState<DefaultCategory | null>(null);
  const [editDefaultName, setEditDefaultName] = useState('');
  const [editDefaultNameEn, setEditDefaultNameEn] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const visibleDefaultCategories = useMemo(
    () => DEFAULT_CATEGORIES.filter(c => !hiddenDefaultCategories.includes(c)),
    [hiddenDefaultCategories],
  );

  const productCounts = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => map.set(p.category, (map.get(p.category) || 0) + 1));
    return map;
  }, [products]);

  const countProducts = useCallback((catKey: string) => productCounts.get(catKey) || 0, [productCounts]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const colorIdx = customCategories.length % CUSTOM_COLORS.length;
    addCategory({
      name: newName.trim(),
      nameEn: newNameEn.trim() || undefined,
      emoji: newEmoji,
      color: CUSTOM_COLORS[colorIdx],
    });
    setNewName('');
    setNewNameEn('');
    setNewEmoji('🏷️');
    setShowAddForm(false);
  };

  const startEdit = (cat: CustomCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditNameEn(cat.nameEn || '');
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    updateCategory(id, { name: editName.trim(), nameEn: editNameEn.trim() || undefined });
    setEditingId(null);
  };

  const startDefaultEdit = (key: DefaultCategory) => {
    const override = defaultCategoryOverrides[key];
    setEditingDefaultKey(key);
    setEditDefaultName(override?.name || t(key as any));
    setEditDefaultNameEn(override?.nameEn || '');
  };

  const saveDefaultEdit = (key: DefaultCategory) => {
    if (!editDefaultName.trim()) return;
    updateDefaultCategory(key, editDefaultName.trim(), editDefaultNameEn.trim() || undefined);
    setEditingDefaultKey(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    const targetKey = deleteTarget.kind === 'custom' ? deleteTarget.category.id : deleteTarget.key;

    if (countProducts(targetKey) > 0) {
      setAllProducts(products.map(p => (p.category === targetKey ? { ...p, category: 'other' } : p)));
    }

    if (deleteTarget.kind === 'custom') {
      removeCategory(deleteTarget.category.id);
    } else {
      hideDefaultCategory(deleteTarget.key);
    }

    setDeleteTarget(null);
  };

  const getDefaultDisplayName = (key: DefaultCategory) => {
    const override = defaultCategoryOverrides[key];
    if (!override) return t(key as any);
    return lang === 'el' ? override.name : (override.nameEn || override.name);
  };

  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Tag size={14} /> Κατηγορίες Προϊόντων
      </h2>

      <div className="space-y-1.5 mb-3">
        {visibleDefaultCategories.map(c => {
          const override = defaultCategoryOverrides[c];
          return (
            <div key={c} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${CATEGORY_COLORS[c]}`}>
                {CATEGORY_EMOJI[c]}
              </span>
              {editingDefaultKey === c ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input value={editDefaultName} onChange={e => setEditDefaultName(e.target.value)} className="h-8 text-sm" placeholder="Όνομα (EL)" />
                  <Input value={editDefaultNameEn} onChange={e => setEditDefaultNameEn(e.target.value)} className="h-8 text-sm w-24" placeholder="EN" />
                  <button onClick={() => saveDefaultEdit(c)} className="w-7 h-7 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10">
                    <Check size={15} />
                  </button>
                  <button onClick={() => setEditingDefaultKey(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{getDefaultDisplayName(c)}</span>
                    {lang === 'el' && override?.nameEn && <span className="text-xs text-muted-foreground ml-2">{override.nameEn}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{countProducts(c)} {t('itemsCount')}</span>
                  <button onClick={() => startDefaultEdit(c)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ kind: 'default', key: c, name: getDefaultDisplayName(c) })}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {customCategories.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {customCategories.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${cat.color}`}>
                {cat.emoji}
              </span>
              {editingId === cat.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-sm" placeholder="Όνομα (EL)" />
                  <Input value={editNameEn} onChange={e => setEditNameEn(e.target.value)} className="h-8 text-sm w-24" placeholder="EN" />
                  <button onClick={() => saveEdit(cat.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10">
                    <Check size={15} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{lang === 'el' ? cat.name : (cat.nameEn || cat.name)}</span>
                    {cat.nameEn && lang === 'el' && (
                      <span className="text-xs text-muted-foreground ml-2">{cat.nameEn}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{countProducts(cat.id)} {t('itemsCount')}</span>
                  <button onClick={() => startEdit(cat)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ kind: 'custom', category: cat })}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddForm ? (
        <div className="p-3 rounded-xl bg-card border border-border space-y-3">
          <div className="flex gap-2 flex-wrap">
            {EMOJI_OPTIONS.map(e => (
              <button
                key={e}
                onClick={() => setNewEmoji(e)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${newEmoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'}`}
              >
                {e}
              </button>
            ))}
          </div>
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Όνομα κατηγορίας (EL)" className="text-sm h-9" />
          <Input value={newNameEn} onChange={e => setNewNameEn(e.target.value)} placeholder="Category name (EN)" className="text-sm h-9" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => setShowAddForm(false)}>
              {t('cancel')}
            </Button>
            <Button size="sm" className="flex-1 rounded-xl" onClick={handleAdd}>
              {t('save')}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full rounded-xl" onClick={() => setShowAddForm(true)}>
          <Plus size={16} className="mr-1.5" /> Προσθήκη κατηγορίας
        </Button>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && countProducts(deleteTarget.kind === 'custom' ? deleteTarget.category.id : deleteTarget.key) > 0
                ? `Η κατηγορία "${deleteTarget.kind === 'custom' ? deleteTarget.category.name : deleteTarget.name}" περιέχει ${countProducts(deleteTarget.kind === 'custom' ? deleteTarget.category.id : deleteTarget.key)} προϊόντα. Τα προϊόντα θα μεταφερθούν στην κατηγορία "Άλλο".`
                : `Θέλετε να διαγράψετε την κατηγορία "${deleteTarget?.kind === 'custom' ? deleteTarget.category.name : deleteTarget?.name}";`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
