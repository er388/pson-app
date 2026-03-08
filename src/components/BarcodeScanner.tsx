import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export default function BarcodeScanner({ open, onClose, onScan }: Props) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopScanner = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopScanner();
      return;
    }

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.decodeFromVideoDevice(null, videoRef.current!, (result, err) => {
      if (result) {
        onScan(result.getText());
        onClose();
      }
      // Ignore not-found errors (continuous scanning)
    }).catch((e) => {
      console.error('Barcode scanner error:', e);
      setError(t('cancel'));
    });

    return () => {
      stopScanner();
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base">Σκανάρισμα Barcode</DialogTitle>
        </DialogHeader>
        <div className="relative bg-black aspect-[4/3]">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {/* Scan overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-32 border-2 border-primary rounded-xl opacity-70" />
          </div>
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <p className="text-sm text-white text-center px-4">
                Δεν ήταν δυνατή η πρόσβαση στην κάμερα. Ελέγξτε τα δικαιώματα.
              </p>
            </div>
          )}
        </div>
        <div className="p-4 pt-2">
          <Button variant="outline" className="w-full rounded-xl" onClick={onClose}>
            {t('cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
