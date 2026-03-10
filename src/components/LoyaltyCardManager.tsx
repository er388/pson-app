import { useState, useRef, useEffect, useCallback } from 'react';
import { CreditCard, Plus, Trash2, X, ScanLine, Maximize2, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { useStores, useLoyaltyCards } from '@/lib/useStore';
import { LoyaltyCard } from '@/lib/types';
import BarcodeScanner from './BarcodeScanner';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

type BarcodeFormat = 'EAN13' | 'CODE128' | 'QR' | 'EAN8' | 'UPC';

function BarcodeDisplay({ value, format, fullscreen = false }: { value: string; format: BarcodeFormat; fullscreen?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!value) return;
    if (format === 'QR') {
      QRCode.toDataURL(value, { width: fullscreen ? 300 : 150, margin: 2 })
        .then(url => setQrDataUrl(url))
        .catch(() => {});
    } else if (canvasRef.current) {
      try {
        JsBarcode(canvasRef.current, value, {
          format: format === 'EAN13' ? 'EAN13' : format === 'EAN8' ? 'EAN8' : format === 'UPC' ? 'UPC' : 'CODE128',
          width: fullscreen ? 3 : 2,
          height: fullscreen ? 100 : 50,
          displayValue: true,
          fontSize: fullscreen ? 16 : 12,
          margin: 5,
        });
      } catch {
        // Invalid barcode format, show text
      }
    }
  }, [value, format, fullscreen]);

  if (format === 'QR') {
    return qrDataUrl ? <img src={qrDataUrl} alt="QR" className="mx-auto" /> : <p className="text-center text-muted-foreground text-sm">{value}</p>;
  }
  return <canvas ref={canvasRef} className="mx-auto max-w-full" />;
}

export default function LoyaltyCardManager() {
  const { t } = useI18n();
  const { stores } = useStores();
  const { cards, addCard, removeCard } = useLoyaltyCards();
  const [addOpen, setAddOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [fullscreenCard, setFullscreenCard] = useState<LoyaltyCard | null>(null);
  const [wakeLock, setWakeLock] = useState<any>(null);

  // Form state
  const [cardName, setCardName] = useState('');
  const [cardStoreId, setCardStoreId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardFormat, setCardFormat] = useState<BarcodeFormat>('CODE128');

  const handleAdd = () => {
    if (!cardName.trim() || !cardNumber.trim()) return;
    addCard({
      name: cardName.trim(),
      storeId: cardStoreId || undefined,
      number: cardNumber.trim(),
      format: cardFormat,
    });
    setCardName('');
    setCardStoreId('');
    setCardNumber('');
    setCardFormat('CODE128');
    setAddOpen(false);
  };

  // Wake lock for fullscreen card display
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        const wl = await (navigator as any).wakeLock.request('screen');
        setWakeLock(wl);
      }
    } catch {}
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLock) {
      wakeLock.release().catch(() => {});
      setWakeLock(null);
    }
  }, [wakeLock]);

  useEffect(() => {
    if (fullscreenCard) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => { releaseWakeLock(); };
  }, [fullscreenCard]);

  const detectFormat = (code: string): BarcodeFormat => {
    if (code.length === 13 && /^\d+$/.test(code)) return 'EAN13';
    if (code.length === 8 && /^\d+$/.test(code)) return 'EAN8';
    if (code.length === 12 && /^\d+$/.test(code)) return 'UPC';
    if (code.length > 20) return 'QR';
    return 'CODE128';
  };

  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <CreditCard size={14} /> {t('loyaltyCards')}
      </h2>

      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground p-3">{t('noLoyaltyCards')}</p>
      ) : (
        <div className="space-y-1.5">
          {cards.map(card => (
            <div key={card.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <CreditCard size={16} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{card.name}</p>
                <p className="text-xs text-muted-foreground truncate">{card.number}</p>
              </div>
              <button
                onClick={() => setFullscreenCard(card)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
              >
                <Maximize2 size={15} />
              </button>
              <button
                onClick={() => removeCard(card.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" className="mt-3 rounded-xl w-full" onClick={() => setAddOpen(true)}>
        <Plus size={16} className="mr-1.5" /> {t('addLoyaltyCard')}
      </Button>

      {/* Add Card Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-xs mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{t('addLoyaltyCard')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">{t('cardName')}</label>
              <Input value={cardName} onChange={e => setCardName(e.target.value)} placeholder={t('cardNamePlaceholder')} className="h-9 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">{t('store')}</label>
              <Select value={cardStoreId || '__none__'} onValueChange={v => setCardStoreId(v === '__none__' ? '' : v)}>
                <SelectTrigger className="h-9 rounded-xl text-sm">
                  <Store size={14} className="mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('noStore')}</SelectItem>
                  {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">{t('cardNumber')}</label>
              <div className="flex gap-2">
                <Input
                  value={cardNumber}
                  onChange={e => {
                    const v = e.target.value;
                    setCardNumber(v);
                    setCardFormat(detectFormat(v));
                  }}
                  placeholder="1234567890123"
                  className="h-9 rounded-xl text-sm flex-1"
                />
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl shrink-0" onClick={() => setScannerOpen(true)}>
                  <ScanLine size={16} />
                </Button>
              </div>
              {cardNumber && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {t('barcodeType')}: {cardFormat}
                </p>
              )}
            </div>
            {cardNumber && (
              <div className="p-3 rounded-xl bg-white">
                <BarcodeDisplay value={cardNumber} format={cardFormat} />
              </div>
            )}
            <Button onClick={handleAdd} className="w-full rounded-xl">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner for loyalty card */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(code) => {
          setCardNumber(code);
          setCardFormat(detectFormat(code));
          setScannerOpen(false);
        }}
      />

      {/* Fullscreen Card Display */}
      {fullscreenCard && (
        <div
          className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8"
          onClick={() => setFullscreenCard(null)}
        >
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
            <X size={20} />
          </button>
          <p className="text-xl font-bold text-black mb-2">{fullscreenCard.name}</p>
          <p className="text-sm text-gray-500 mb-6">{fullscreenCard.number}</p>
          <BarcodeDisplay value={fullscreenCard.number} format={fullscreenCard.format as BarcodeFormat} fullscreen />
          <p className="text-xs text-gray-400 mt-8">{t('tapToClose')}</p>
        </div>
      )}
    </section>
  );
}

// Quick Loyalty Card Button for Shopping List
export function LoyaltyCardQuickButton({ storeId }: { storeId: string | null }) {
  const { t } = useI18n();
  const { cards } = useLoyaltyCards();
  const { stores } = useStores();
  const [fullscreenCard, setFullscreenCard] = useState<LoyaltyCard | null>(null);
  const [wakeLock, setWakeLock] = useState<any>(null);

  const matchedCard = storeId ? cards.find(c => c.storeId === storeId) : null;

  useEffect(() => {
    if (fullscreenCard && 'wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').then((wl: any) => setWakeLock(wl)).catch(() => {});
    }
    return () => { wakeLock?.release().catch(() => {}); };
  }, [fullscreenCard]);

  if (!matchedCard) return null;

  const storeName = stores.find(s => s.id === storeId)?.name || matchedCard.name;

  return (
    <>
      <button
        onClick={() => setFullscreenCard(matchedCard)}
        className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-primary/10 border border-primary/20 mb-3"
      >
        <CreditCard size={16} className="text-primary shrink-0" />
        <span className="text-xs font-medium text-primary flex-1 text-left">{t('showCard')} {storeName}</span>
        <Maximize2 size={14} className="text-primary/60" />
      </button>

      {fullscreenCard && (
        <div
          className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8"
          onClick={() => setFullscreenCard(null)}
        >
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
            <X size={20} />
          </button>
          <p className="text-xl font-bold text-black mb-2">{fullscreenCard.name}</p>
          <p className="text-sm text-gray-500 mb-6">{fullscreenCard.number}</p>
          <BarcodeDisplay value={fullscreenCard.number} format={fullscreenCard.format as BarcodeFormat} fullscreen />
          <p className="text-xs text-gray-400 mt-8">{t('tapToClose')}</p>
        </div>
      )}
    </>
  );
}
