import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Capacitor } from '@capacitor/core';
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerAndroidScanningLibrary,
  CapacitorBarcodeScannerCameraDirection,
  CapacitorBarcodeScannerScanOrientation,
  CapacitorBarcodeScannerTypeHintALLOption,
} from '@capacitor/barcode-scanner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { ScanLine } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export default function BarcodeScanner({ open, onClose, onScan }: Props) {
  const { t, lang } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isNative = useMemo(() => Capacitor.isNativePlatform(), []);
  const scannedRef = useRef(false);

  const permissionError = lang === 'en'
    ? 'Camera access failed. Check permissions in Android settings.'
    : 'Δεν ήταν δυνατή η πρόσβαση στην κάμερα. Έλεγξε τα δικαιώματα στις ρυθμίσεις Android.';

  const stopWebScanner = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setError(null);
      scannedRef.current = false;
      stopWebScanner();
      return;
    }

    if (isNative) {
      let cancelled = false;

      CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHintALLOption.ALL,
        scanInstructions: t('scanBarcode'),
        scanButton: false,
        cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
        scanOrientation: CapacitorBarcodeScannerScanOrientation.ADAPTIVE,
        android: {
          scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.ZXING,
        },
      }).then(result => {
        if (cancelled) return;
        const scanResult = result?.ScanResult?.trim();
        if (scanResult) onScan(scanResult);
        onClose();
      }).catch(e => {
        if (cancelled) return;
        // User closed scanner or permission denied
        const msg = String(e?.message || '').toLowerCase();
        if (!msg.includes('cancel') && !msg.includes('user')) {
          setError(permissionError);
        }
        onClose();
      });

      return () => { cancelled = true; };
    }

    // Web scanner
    if (!videoRef.current) return;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
      if (!result || scannedRef.current) return;
      scannedRef.current = true;
      stopWebScanner();
      onScan(result.getText());
      onClose();
    }).catch(() => setError(permissionError));

    return () => stopWebScanner();
  }, [open, isNative, onClose, onScan, permissionError, stopWebScanner, t]);

  // Native: no Dialog UI needed — scanner has its own fullscreen UI
  if (isNative) return null;

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base">{t('scanBarcode')}</DialogTitle>
        </DialogHeader>
        <div className="relative bg-muted aspect-[4/3]">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-32 border-2 border-primary rounded-xl opacity-70" />
          </div>
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90 px-4">
              <p className="text-sm text-foreground text-center">{error}</p>
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