import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';

interface Props {
  open: boolean;
  productName: string;
  onClose: () => void;
  onConfirm: (price?: number, discount?: number) => void;
}

export default function PriceDialog({ open, productName, onClose, onConfirm }: Props) {
  const { t } = useI18n();
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');

  const handleConfirm = () => {
    const p = price ? parseFloat(price) : undefined;
    const d = discount ? parseFloat(discount) : undefined;
    onConfirm(p, d);
    setPrice(''); setDiscount('');
  };

  const handleSkip = () => {
    onConfirm(undefined, undefined);
    setPrice(''); setDiscount('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">{t('enterPrice')}</DialogTitle>
          <p className="text-sm text-muted-foreground">{productName}</p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('price')}</Label>
            <Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" inputMode="decimal" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('discount')}</Label>
            <Input type="number" step="1" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" inputMode="numeric" className="h-10" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" className="flex-1 h-10" onClick={handleSkip}>Skip</Button>
            <Button className="flex-1 h-10" onClick={handleConfirm}>{t('confirm')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
