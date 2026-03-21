import { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, Edit2, Check, X, Tag, GripVertical, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { useCustomCategories, useProducts } from '@/lib/useStore';
import { CATEGORY_EMOJI, CATEGORY_COLORS, CustomCategory, DefaultCategory } from '@/lib/types';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const CUSTOM_COLORS = [
  'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
];

const EMOJI_OPTIONS = ['🛒', '🏷️', '🧃', '🥫', '🫘', '🧂', '🫒', '🍯', '🧈', '🥜', '🌮', '🍕', '🍰', '🧀', '🫙'];

type CatEntry = { id: string } & (
  | { kind: 'default'; key: DefaultCategory }
  | { kind: 'custom'; cat: CustomCategory }
);

function SortableCatItem({ entry, editingKey, editName, editNameEn, productCount, t, lang,
  getDefaultDisplayName, defaultCategoryOverrides,
  onEditStart, onEditNameChange, onEditNameEnChange, onSave, onCancelEdit, onDelete,
}: {
  entry: CatEntry; editingKey: string | null; editName: string; editNameEn: string;
  productCount: number; t: any; lang: string;
  getDefaultDisplayName: (k: DefaultCategory) => string;
  defaultCategoryOverrides: Partial<Record<DefaultCategory, { name: string; nameEn?: string }>>;
  onEditStart: () => void; onEditNameChange: (v: string) => void; onEditNameEnChange: (v: string) => void;
  onSave: () => void; onCancelEdit: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: entry.id });
  const isEditing = editingKey === entry.id;

  const emoji = entry.kind === 'default' ? (CATEGORY_EMOJI[entry.key] || '📦') : entry.cat.emoji;
  const color = entry.kind === 'default' ? (CATEGORY_COLORS[entry.key] || 'bg-secondary') : entry.cat.color;
  const displayName = entry.kind === 'default'
    ? getDefaultDisplayName(entry.key)
    : (lang === 'el' ? entry.cat.name : (entry.cat.nameEn || entry.cat.name));
  const nameEn = entry.kind === 'default'
    ? defaultCategoryOverrides[entry.key]?.nameEn
    : entry.cat.nameEn;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
    >
      <button {...attributes} {...listeners} className="text-muted-foreground/50 touch-none cursor-grab active:cursor-grabbing">
        <GripVertical size={16} />
      </button>
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${color}`}>
        {emoji}
      </span>
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <Input value={editName} onChange={e => onEditNameChange(e.target.value)} className="h-8 text-sm" placeholder="Όνομα (EL)" />
          <Input value={editNameEn} onChange={e => onEditNameEnChange(e.target.value)} className="h-8 text-sm w-24" placeholder="EN" />
          <button onClick={onSave} className="w-7 h-7 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10">
            <Check size={15} />
          </button>
          <button onClick={onCancelEdit} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary">
            <X size={15} />
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-foreground">{displayName}</span>
            {lang === 'el' && nameEn && <span className="text-xs text-muted-foreground ml-2">{nameEn}</span>}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{productCount} {t('itemsCount')}</span>
          <button onClick={onEditStart} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
            <Edit2 size={15} />
          </button>
          <button onClick={onDelete} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
            <Trash2 size={15} />
          </button>
        </>
      )}
    </div>
  );
}

export default function CategoryManager() {
  const { t, lang } = useI18n();
  const {
    customCategories, addCategory, updateCategory, removeCategory,
    reorderCategories, allCategoryKeys,
    defaultCategoryOverrides, updateDefaultCategory, hideDefaultCategory,
  } = useCustomCategories();
  const { products, setAllProducts } = useProducts();

  const [newName, setNewName] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newEmoji, setNewEmoji] = useState('🏷️');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CatEntry | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const productCounts = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => map.set(p.category, (map.get(p.category) || 0) + 1));
    return map;
  }, [products]);

  const orderedEntries = useMemo<CatEntry[]>(() => {
    return allCategoryKeys.map(key => {
      if (key.startsWith('custom_')) {
        const cat = customCategories.find(c => c.id === key);
        if (!cat) return null;
        return { id: key, kind: 'custom' as const, cat };
      }
      return { id: key, kind: 'default' as const, key: key as DefaultCategory };
    }).filter((e): e is CatEntry => e !== null);
  }, [allCategoryKeys, customCategories]);

  const getDefaultDisplayName = useCallback((key: DefaultCategory) => {
    const override = defaultCategoryOverrides[key];
    if (!override) return t(key as any);
    return lang === 'el' ? override.name : (override.nameEn || override.name);
  }, [defaultCategoryOverrides, lang, t]);

  const handleDragEnd = useCallback(({ active, over }: any) => {
    if (!over || active.id === over.id) return;
    const oldIdx = orderedEntries.findIndex(e => e.id === active.id);
    const newIdx = orderedEntries.findIndex(e => e.id === over.id);
    reorderCategories(arrayMove(orderedEntries, oldIdx, newIdx).map(e => e.id));
  }, [orderedEntries, reorderCategories]);

  const startEdit = useCallback((entry: CatEntry) => {
    setEditingKey(entry.id);
    if (entry.kind === 'default') {
      const override = defaultCategoryOverrides[entry.key];
      setEditName(override?.name || t(entry.key as any));
      setEditNameEn(override?.nameEn || '');
    } else {
      setEditName(entry.cat.name);
      setEditNameEn(entry.cat.nameEn || '');
    }
  }, [defaultCategoryOverrides, t]);

  const saveEdit = useCallback(() => {
    if (!editingKey || !editName.trim()) return;
    const entry = orderedEntries.find(e => e.id === editingKey);
    if (!entry) return;
    if (entry.kind === 'default') {
      updateDefaultCategory(entry.key, editName.trim(), editNameEn.trim() || undefined);
    } else {
      updateCategory(entry.cat.id, { name: editName.trim(), nameEn: editNameEn.trim() || undefined });
    }
    setEditingKey(null);
  }, [editingKey, editName, editNameEn, orderedEntries, updateDefaultCategory, updateCategory]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    const key = deleteTarget.id;
    if (productCounts.get(key)) {
      setAllProducts(products.map(p => p.category === key ? { ...p, category: 'other' } : p));
    }
    if (deleteTarget.kind === 'default') {
      hideDefaultCategory(deleteTarget.key);
    } else {
      removeCategory(deleteTarget.cat.id);
    }
    setDeleteTarget(null);
  }, [deleteTarget, productCounts, products, setAllProducts, hideDefaultCategory, removeCategory]);

  const handleAdd = useCallback(() => {
    if (!newName.trim()) return;
    addCategory({
      name: newName.trim(),
      nameEn: newNameEn.trim() || undefined,
      emoji: newEmoji,
      color: CUSTOM_COLORS[customCategories.length % CUSTOM_COLORS.length],
    });
    setNewName(''); setNewNameEn(''); setNewEmoji('🏷️');
    setShowAddForm(false);
  }, [newName, newNameEn, newEmoji, customCategories.length, addCategory]);

  const deleteTargetName = deleteTarget
    ? deleteTarget.kind === 'default' ? getDefaultDisplayName(deleteTarget.key) : deleteTarget.cat.name
    : '';
  const deleteTargetCount = deleteTarget ? (productCounts.get(deleteTarget.id) || 0) : 0;

  return (
    <section className="mb-6">
      <button onClick={() => setIsOpen(v => !v)} className="w-full flex items-center gap-1.5 mb-3">
        <Tag size={14} className="text-muted-foreground" />
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1 text-left">Κατηγορίες Προϊόντων</h2>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedEntries.map(e => e.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5 mb-3">
                {orderedEntries.map(entry => (
                  <SortableCatItem
                    key={entry.id}
                    entry={entry}
                    editingKey={editingKey}
                    editName={editName}
                    editNameEn={editNameEn}
                    productCount={productCounts.get(entry.id) || 0}
                    t={t} lang={lang}
                    getDefaultDisplayName={getDefaultDisplayName}
                    defaultCategoryOverrides={defaultCategoryOverrides}
                    onEditStart={() => startEdit(entry)}
                    onEditNameChange={setEditName}
                    onEditNameEnChange={setEditNameEn}
                    onSave={saveEdit}
                    onCancelEdit={() => setEditingKey(null)}
                    onDelete={() => setDeleteTarget(entry)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {showAddForm ? (
            <div className="p-3 rounded-xl bg-card border border-border space-y-3">
              <div className="flex gap-2 flex-wrap">
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} onClick={() => setNewEmoji(e)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${newEmoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'}`}>
                    {e}
                  </button>
                ))}
              </div>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Όνομα κατηγορίας (EL)" className="text-sm h-9" />
              <Input value={newNameEn} onChange={e => setNewNameEn(e.target.value)} placeholder="Category name (EN)" className="text-sm h-9" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => setShowAddForm(false)}>{t('cancel')}</Button>
                <Button size="sm" className="flex-1 rounded-xl" onClick={handleAdd}>{t('save')}</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full rounded-xl" onClick={() => setShowAddForm(true)}>
              <Plus size={16} className="mr-1.5" /> Προσθήκη κατηγορίας
            </Button>
          )}
        </>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTargetCount > 0
                ? `Η κατηγορία "${deleteTargetName}" περιέχει ${deleteTargetCount} προϊόντα. Τα προϊόντα θα μεταφερθούν στην κατηγορία "Άλλο".`
                : `Θέλετε να διαγράψετε την κατηγορία "${deleteTargetName}";`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}