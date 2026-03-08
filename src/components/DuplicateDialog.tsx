import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { CATEGORY_EMOJI, CATEGORY_COLORS } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  productName: string;
  productCategory: string;
  existingQuantity: number;
  onIncreaseQuantity: () => void;
  onAddAgain: () => void;
}

export default function DuplicateDialog({ open, onClose, productName, productCategory, existingQuantity, onIncreaseQuantity, onAddAgain }: Props) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">{t('duplicateFound')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-base ${CATEGORY_COLORS[productCategory] || 'bg-secondary'}`}>
              {CATEGORY_EMOJI[productCategory] || '📦'}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{productName}</p>
              <p className="text-xs text-muted-foreground">
                {t('alreadyInList')} (×{existingQuantity})
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Button className="w-full rounded-xl h-10" onClick={onIncreaseQuantity}>
              {t('increaseQuantity')}
            </Button>
            <Button variant="outline" className="w-full rounded-xl h-10" onClick={onAddAgain}>
              {t('addAgain')}
            </Button>
            <Button variant="ghost" className="w-full rounded-xl h-10 text-muted-foreground" onClick={onClose}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
