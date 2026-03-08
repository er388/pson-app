import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Product, DEFAULT_CATEGORIES, CATEGORY_EMOJI, Category } from '@/lib/types';
import { useCustomCategories } from '@/lib/useStore';
import BarcodeScanner from './BarcodeScanner';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; nameEn?: string; category: Category; barcode?: string }) => void;
  product?: Product | null;
}

export default function ProductForm({ open, onClose, onSave, product }: Props) {
  const { t, lang } = useI18n();
  const { customCategories, allCategoryKeys } = useCustomCategories();
  const [name, setName] = useState(product?.name || '');
  const [nameEn, setNameEn] = useState(product?.nameEn || '');
  const [category, setCategory] = useState<Category>(product?.category || 'other');
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), nameEn: nameEn.trim() || undefined, category, barcode: barcode.trim() || undefined });
    setName(''); setNameEn(''); setCategory('other'); setBarcode('');
    onClose();
  };

  const getCategoryLabel = (key: string) => {
    const custom = customCategories.find(c => c.id === key);
    if (custom) return `${custom.emoji} ${lang === 'el' ? custom.name : (custom.nameEn || custom.name)}`;
    const emoji = CATEGORY_EMOJI[key] || '📦';
    return `${emoji} ${t(key as any)}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{product ? t('editProduct') : t('addProduct')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('productName')} (EL)</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="π.χ. Γάλα" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('productName')} (EN)</Label>
              <Input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="e.g. Milk" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('category')}</Label>
              <Select value={category} onValueChange={v => setCategory(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allCategoryKeys.map(c => (
                    <SelectItem key={c} value={c}>
                      {getCategoryLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Barcode</Label>
              <div className="flex gap-2">
                <Input
                  value={barcode}
                  onChange={e => setBarcode(e.target.value)}
                  placeholder="(προαιρετικό)"
                  className="h-10 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl"
                  onClick={() => setScannerOpen(true)}
                >
                  <Camera size={18} />
                </Button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 h-10" onClick={onClose}>{t('cancel')}</Button>
              <Button className="flex-1 h-10" onClick={handleSave}>{t('save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(code) => {
          setBarcode(code);
          setScannerOpen(false);
        }}
      />
    </>
  );
}
