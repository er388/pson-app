import { useState, useRef, useCallback } from 'react';
import { Camera, Image as ImageIcon, Loader2, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { useProducts, useCompletedPurchases, useStores, usePurchaseHistory } from '@/lib/useStore';
import { formatPrice, Product, CATEGORY_EMOJI } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

interface ParsedItem {
  rawName: string;
  matchedProduct?: Product;
  price: number;
  quantity: number;
  confirmed: boolean;
}

interface ParsedReceipt {
  items: ParsedItem[];
  total: number;
  date?: string;
}

// Fuzzy match a raw OCR name to catalog products
function fuzzyMatch(rawName: string, products: Product[]): Product | undefined {
  const clean = rawName.toLowerCase().replace(/[^a-zα-ωά-ώ0-9\s]/gi, '').trim();
  if (!clean || clean.length < 2) return undefined;

  let bestMatch: Product | undefined;
  let bestScore = 0;

  for (const p of products) {
    const pName = p.name.toLowerCase();
    const pNameEn = (p.nameEn || '').toLowerCase();

    // Exact include
    if (pName.includes(clean) || clean.includes(pName)) {
      const score = pName.length / Math.max(clean.length, pName.length);
      if (score > bestScore) { bestScore = score; bestMatch = p; }
    }
    if (pNameEn && (pNameEn.includes(clean) || clean.includes(pNameEn))) {
      const score = pNameEn.length / Math.max(clean.length, pNameEn.length);
      if (score > bestScore) { bestScore = score; bestMatch = p; }
    }

    // Word overlap
    const cleanWords = clean.split(/\s+/);
    const pWords = pName.split(/\s+/);
    const overlap = cleanWords.filter(w => pWords.some(pw => pw.includes(w) || w.includes(pw))).length;
    const overlapScore = overlap / Math.max(cleanWords.length, pWords.length);
    if (overlapScore > bestScore && overlapScore > 0.4) {
      bestScore = overlapScore;
      bestMatch = p;
    }
  }

  return bestScore > 0.3 ? bestMatch : undefined;
}

// Parse OCR text to extract items and prices
function parseReceiptText(text: string, products: Product[]): ParsedReceipt {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const items: ParsedItem[] = [];
  let total = 0;
  let date: string | undefined;

  // Try to find date
  const dateRegex = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/;
  for (const line of lines) {
    const dateMatch = line.match(dateRegex);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      const fullYear = year.length === 2 ? `20${year}` : year;
      date = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      break;
    }
  }

  // Extract items with prices — broader regex to catch more receipt formats
  // Matches: "1.23", "1,23", "1.23€", "€1,23", "1,23 EUR", optional leading €/$
  const priceRegex = /(?:€|EUR\s*)?\s*(\d{1,4}[.,]\d{2})\s*(?:€|EUR)?\s*$/i;
  const totalRegex = /(?:σύνολο|συνολο|total|συν(?:ολο)?|τελικ[οό]|sum|πληρωτ[εέ]ο)\s*:?\s*(?:€)?\s*(\d{1,4}[.,]\d{2})/i;

  for (const line of lines) {
    const totalMatch = line.match(totalRegex);
    if (totalMatch) {
      total = parseFloat(totalMatch[1].replace(',', '.'));
      continue;
    }

    const priceMatch = line.match(priceRegex);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(',', '.'));
      const rawName = line.replace(priceRegex, '').replace(/[*x×]?\s*\d+[.,]?\d*\s*$/, '').trim();

      // Skip lines that are clearly headers/footers
      if (/^(?:αφμ|τηλ|fax|αρ\.?\s*απ|date|ημερομηνία|cashier|ταμείο)/i.test(rawName)) continue;

      if (rawName.length >= 2 && price > 0 && price < 1000) {
        const matched = fuzzyMatch(rawName, products);
        items.push({
          rawName,
          matchedProduct: matched,
          price,
          quantity: 1,
          confirmed: !!matched,
        });
      }
    }
  }

  // Calculate total if not found
  if (total === 0 && items.length > 0) {
    total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  return { items, total, date };
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ReceiptScanner({ open, onClose }: Props) {
  const { t, lang } = useI18n();
  const { products } = useProducts();
  const { stores } = useStores();
  const { addPurchase } = useCompletedPurchases();
  const { addRecord } = usePurchaseHistory();
  const [processing, setProcessing] = useState(false);
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (imageData: string) => {
    setProcessing(true);
    setPreviewImage(imageData);

    try {
      const { createWorker } = await import('tesseract.js');
      // Try Greek+English; fall back to English-only if Greek fails to load
      let worker;
      try {
        worker = await createWorker('ell+eng');
      } catch (e) {
        console.warn('[Receipt] ell+eng failed, falling back to eng:', e);
        worker = await createWorker('eng');
      }
      const { data } = await worker.recognize(imageData);
      console.log('[Receipt] OCR raw text:\n', data.text);
      await worker.terminate();

      const result = parseReceiptText(data.text, products);
      console.log('[Receipt] Parsed:', result);
      setParsed(result);
      setParsedItems(result.items);
    } catch (err) {
      console.error('[Receipt] OCR Error:', err);
      toast({ title: t('ocrError'), variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  }, [products, t]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) processImage(result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [processImage]);

  const handleSavePurchase = () => {
    if (!parsedItems.length) return;

    const confirmedItems = parsedItems.filter(i => i.confirmed && i.matchedProduct);

    if (confirmedItems.length === 0) {
      toast({ title: t('noConfirmedItems') });
      return;
    }

    addPurchase({
      date: parsed?.date ? new Date(parsed.date).toISOString() : new Date().toISOString(),
      storeIds: [],
      items: confirmedItems.map(i => ({
        productId: i.matchedProduct!.id,
        quantity: i.quantity,
        price: i.price,
        discount: 0,
        storeId: null,
      })),
      total: confirmedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
    });

    toast({ title: t('receiptSaved') });
    handleClose();
  };

  const handleClose = () => {
    setParsed(null);
    setParsedItems([]);
    setPreviewImage(null);
    setProcessing(false);
    onClose();
  };

  const toggleConfirm = (index: number) => {
    setParsedItems(prev => prev.map((item, i) =>
      i === index ? { ...item, confirmed: !item.confirmed } : item
    ));
  };

  const updateItemPrice = (index: number, price: string) => {
    const parsed = parseFloat(price.replace(',', '.'));
    if (isNaN(parsed)) return;
    setParsedItems(prev => prev.map((item, i) =>
      i === index ? { ...item, price: parsed } : item
    ));
  };

  const productName = (p: Product) => lang === 'el' ? p.name : (p.nameEn || p.name);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{t('scanReceipt')}</DialogTitle>
        </DialogHeader>

        {!processing && !parsed && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <AlertTriangle size={16} className="text-orange-500 shrink-0" />
              <p className="text-xs text-orange-700 dark:text-orange-300">{t('ocrAccuracyWarning')}</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-20 rounded-xl flex-col gap-2" onClick={() => cameraInputRef.current?.click()}>
                <Camera size={24} className="text-muted-foreground" />
                <span className="text-xs">{t('takePhoto')}</span>
              </Button>
              <Button variant="outline" className="flex-1 h-20 rounded-xl flex-col gap-2" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={24} className="text-muted-foreground" />
                <span className="text-xs">{t('chooseFromGallery')}</span>
              </Button>
            </div>

            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          </div>
        )}

        {processing && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 size={32} className="text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">{t('processingReceipt')}</p>
          </div>
        )}

        {parsed && !processing && (
          <div className="space-y-3">
            {previewImage && (
              <img src={previewImage} alt="" className="w-full rounded-xl max-h-32 object-cover border border-border" />
            )}

            {parsed.date && (
              <p className="text-xs text-muted-foreground">📅 {parsed.date}</p>
            )}

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('recognizedItems')} ({parsedItems.length})
            </p>

            <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
              {parsedItems.map((item, i) => (
                <div key={i} className={`flex items-center gap-2 p-2 rounded-xl border ${item.confirmed ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border'}`}>
                  <button
                    onClick={() => toggleConfirm(i)}
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center ${item.confirmed ? 'bg-primary text-primary-foreground' : 'border-2 border-muted-foreground/30'}`}
                  >
                    {item.confirmed && <Check size={12} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    {item.matchedProduct ? (
                      <p className="text-xs font-medium text-foreground truncate">
                        {CATEGORY_EMOJI[item.matchedProduct.category] || '📦'} {productName(item.matchedProduct)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground truncate italic">{item.rawName}</p>
                    )}
                    {item.matchedProduct && item.rawName !== productName(item.matchedProduct) && (
                      <p className="text-[10px] text-muted-foreground truncate">OCR: {item.rawName}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-foreground shrink-0">{formatPrice(item.price)}</span>
                </div>
              ))}
            </div>

            {parsedItems.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{t('noItemsRecognized')}</p>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm font-medium text-foreground">{t('total')}</span>
              <span className="text-lg font-bold text-primary">{formatPrice(parsed.total)}</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={handleClose}>{t('cancel')}</Button>
              <Button className="flex-1 rounded-xl" onClick={handleSavePurchase} disabled={!parsedItems.some(i => i.confirmed)}>
                {t('save')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
