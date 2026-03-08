import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Mic, MicOff, Image as ImageIcon, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Product, DEFAULT_CATEGORIES, CATEGORY_EMOJI, Category, PRODUCT_UNITS, ProductUnit } from '@/lib/types';
import { useCustomCategories } from '@/lib/useStore';
import BarcodeScanner from './BarcodeScanner';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; nameEn?: string; category: Category; barcode?: string; unit?: ProductUnit; note?: string; image?: string }) => void;
  product?: Product | null;
}

export default function ProductForm({ open, onClose, onSave, product }: Props) {
  const { t, lang } = useI18n();
  const { customCategories, allCategoryKeys } = useCustomCategories();
  const [name, setName] = useState(product?.name || '');
  const [nameEn, setNameEn] = useState(product?.nameEn || '');
  const [category, setCategory] = useState<Category>(product?.category || 'other');
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [unit, setUnit] = useState<ProductUnit>(product?.unit || 'τεμ.');
  const [note, setNote] = useState(product?.note || '');
  const [image, setImage] = useState<string | undefined>(product?.image);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      nameEn: nameEn.trim() || undefined,
      category,
      barcode: barcode.trim() || undefined,
      unit,
      note: note.trim().slice(0, 100) || undefined,
      image,
    });
    setName(''); setNameEn(''); setCategory('other'); setBarcode(''); setUnit('τεμ.'); setNote(''); setImage(undefined);
    onClose();
  };

  const getCategoryLabel = (key: string) => {
    const custom = customCategories.find(c => c.id === key);
    if (custom) return `${custom.emoji} ${lang === 'el' ? custom.name : (custom.nameEn || custom.name)}`;
    const emoji = CATEGORY_EMOJI[key] || '📦';
    return `${emoji} ${t(key as any)}`;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Resize to max 200x200 for storage efficiency
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 200;
        let w = img.width, h = img.height;
        if (w > h) { h = (h / w) * MAX; w = MAX; }
        else { w = (w / h) * MAX; h = MAX; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        setImage(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: t('voiceInput'), description: 'Η φωνητική εισαγωγή δεν υποστηρίζεται σε αυτόν τον browser. Δοκίμασε Chrome ή Edge.' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'el-GR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setName(prev => prev ? `${prev} ${transcript}` : transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{product ? t('editProduct') : t('addProduct')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Photo */}
            <div className="flex items-center gap-3">
              {image ? (
                <div className="relative">
                  <img src={image} alt="" className="w-16 h-16 rounded-xl object-cover border border-border" />
                  <button
                    onClick={() => setImage(undefined)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground">
                  <ImageIcon size={20} />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Button
                  type="button" variant="outline" size="sm"
                  className="h-7 text-xs rounded-lg"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera size={13} className="mr-1" /> {t('takePhoto')}
                </Button>
                <Button
                  type="button" variant="outline" size="sm"
                  className="h-7 text-xs rounded-lg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={13} className="mr-1" /> {t('chooseFromGallery')}
                </Button>
              </div>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </div>

            {/* Name with voice */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('productName')} (EL)</Label>
              <div className="flex gap-2">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="π.χ. Γάλα" className="h-10 flex-1" />
                <Button
                  type="button"
                  variant={isListening ? 'destructive' : 'outline'}
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl relative"
                  onClick={isListening ? stopVoiceInput : startVoiceInput}
                >
                  {isListening ? (
                    <>
                      <MicOff size={18} />
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
                    </>
                  ) : (
                    <Mic size={18} />
                  )}
                </Button>
              </div>
              {isListening && (
                <p className="text-xs text-destructive animate-pulse flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-destructive inline-block" /> {t('listening')}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('productName')} (EN)</Label>
              <Input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="e.g. Milk" className="h-10" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
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
              <div className="w-28 space-y-1.5">
                <Label className="text-xs font-medium">{t('unit')}</Label>
                <Select value={unit} onValueChange={v => setUnit(v as ProductUnit)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_UNITS.map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('note')} <span className="text-muted-foreground font-normal">({note.length}/100)</span></Label>
              <Input
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 100))}
                placeholder={t('notePlaceholder')}
                className="h-10"
              />
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
