import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { Loader2, ScanLine } from 'lucide-react';

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
  const [nativeScanning, setNativeScanning] = useState(false);

  const isNativePlatform = useMemo(() => Capacitor.isNativePlatform(), []);

  const permissionErrorText =
    lang === 'en'
      ? 'Camera access failed. Check camera permissions in Android settings.'
      : 'Δεν ήταν δυνατή η πρόσβαση στην κάμερα. Έλεγξε τα δικαιώματα κάμερας στις ρυθμίσεις Android.';

  const stopScanner = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
  }, []);

  const startWebScanner = useCallback(async () => {
    if (!videoRef.current) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    try {
      await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (!result) return;
        onScan(result.getText());
        onClose();
      });
    } catch (e) {
      console.error('Web barcode scanner error:', e);
      setError(permissionErrorText);
    }
  }, [onClose, onScan, permissionErrorText]);

  useEffect(() => {
    if (!open) {
      setError(null);
      stopScanner();
      return;
    }

    if (isNativePlatform) {
      let cancelled = false;

      const startNativeScanner = async () => {
        setError(null);
        setNativeScanning(true);

        try {
          const result = await CapacitorBarcodeScanner.scanBarcode({
            hint: CapacitorBarcodeScannerTypeHintALLOption.ALL,
            scanInstructions: t('scanBarcode'),
            scanButton: true,
            scanText: t('cancel'),
            cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
            scanOrientation: CapacitorBarcodeScannerScanOrientation.ADAPTIVE,
            android: {
              scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.ZXING,
            },
          });

          if (cancelled) return;

          const scanResult = result?.ScanResult?.trim();
          if (scanResult) {
            onScan(scanResult);
          }
          onClose();
        } catch (e) {
          console.error('Native barcode scanner error:', e);
          if (!cancelled) {
            setError(permissionErrorText);
          }
        } finally {
          if (!cancelled) {
            setNativeScanning(false);
          }
        }
      };

      startNativeScanner();

      return () => {
        cancelled = true;
        setNativeScanning(false);
      };
    }

    startWebScanner();

    return () => {
      stopScanner();
    };
  }, [open, isNativePlatform, onClose, onScan, permissionErrorText, startWebScanner, stopScanner, t]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base">Σκανάρισμα Barcode</DialogTitle>
        </DialogHeader>

        {isNativePlatform ? (
          <div className="px-4 pb-4 pt-2 space-y-3">
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {nativeScanning ? <Loader2 size={18} className="animate-spin" /> : <ScanLine size={18} />}
              </div>
              <p className="text-sm text-foreground">
                {nativeScanning
                  ? lang === 'en'
                    ? 'Opening native scanner...'
                    : 'Άνοιγμα native scanner...'
                  : t('scanBarcode')}
              </p>
            </div>
            {error && <p className="text-xs text-destructive text-center">{error}</p>}
          </div>
        ) : (
          <div className="relative bg-muted aspect-[4/3]">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-32 border-2 border-primary rounded-xl opacity-70" />
            </div>
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/90">
                <p className="text-sm text-foreground text-center px-4">{error}</p>
              </div>
            )}
          </div>
        )}

        <div className="p-4 pt-2">
          <Button variant="outline" className="w-full rounded-xl" onClick={onClose}>
            {t('cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

