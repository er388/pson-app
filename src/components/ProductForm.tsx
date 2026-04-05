import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Mic, MicOff, Image as ImageIcon, X, Search, Plus, Minus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Product, DEFAULT_CATEGORIES, CATEGORY_EMOJI, CATEGORY_COLORS, Category, PRODUCT_UNITS, ProductUnit } from '@/lib/types';
import { useCustomCategories, useProducts } from '@/lib/useStore';
import BarcodeScanner from './BarcodeScanner';
import { toast } from '@/hooks/use-toast';
import { cn, matchesSearch } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; nameEn?: string; category: Category; barcode?: string; unit?: ProductUnit; note?: string; image?: string; alternatives?: string[] }) => void;
  product?: Product | null;
  offImageUrl?: string;
}

export default function ProductForm({ open, onClose, onSave, product, offImageUrl }: Props) {
  const { t, lang } = useI18n();
  const { customCategories, allCategoryKeys } = useCustomCategories();
  const { products } = useProducts();
  const [name, setName] = useState(product?.name || '');
  const [nameEn, setNameEn] = useState(product?.nameEn || '');
  const [category, setCategory] = useState<Category>(product?.category || 'other');
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [unit, setUnit] = useState<ProductUnit>(product?.unit || 'τεμ.');
  const [note, setNote] = useState(product?.note || '');
  const [image, setImage] = useState<string | undefined>(product?.image);
  const [alternatives, setAlternatives] = useState<string[]>(product?.alternatives || []);
  useEffect(() => {
    if (open) {
      setName(product?.name || '');
      setNameEn(product?.nameEn || '');
      setCategory(product?.category || 'other');
      setBarcode(product?.barcode || '');
      setUnit(product?.unit || 'τεμ.');
      setNote(product?.note || '');
      setImage(product?.image);
      setAlternatives(product?.alternatives || []);
    }
  }, [open]);
  const [altSearch, setAltSearch] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isListeningEn, setIsListeningEn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const altSearchResults = useMemo(() => {
    if (!altSearch.trim()) return [];
    return products
      .filter(p => p.id !== product?.id && !alternatives.includes(p.id))
      .filter(p => matchesSearch(p.name, altSearch) || matchesSearch(p.nameEn || '', altSearch))
      .slice(0, 5);
  }, [altSearch, products, alternatives, product?.id]);

  const handleSave = useCallback(() => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      nameEn: nameEn.trim() || undefined,
      category,
      barcode: barcode.trim() || undefined,
      unit,
      note: note.trim().slice(0, 100) || undefined,
      image,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    });
    setName(''); setNameEn(''); setCategory('other'); setBarcode(''); setUnit('τεμ.'); setNote(''); setImage(undefined); setAlternatives([]);
    onClose();
  }, [name, nameEn, category, barcode, unit, note, image, alternatives, onSave, onClose]);

  const getCategoryLabel = useCallback((key: string) => {
    const custom = customCategories.find(c => c.id === key);
    if (custom) return `${custom.emoji} ${lang === 'el' ? custom.name : (custom.nameEn || custom.name)}`;
    const emoji = CATEGORY_EMOJI[key] || '📦';
    return `${emoji} ${t(key as any)}`;
  }, [customCategories, lang, t]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
  }, []);

  const startVoiceInput = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: t('voiceInput'), description: 'Η φωνητική εισαγωγή δεν υποστηρίζεται σε αυτόν τον browser.' });
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
  }, [t]);

  const stopVoiceInput = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startEnVoiceInput = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: t('voiceInput'), description: 'Voice input not supported in this browser.' });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNameEn(prev => prev ? `${prev} ${transcript}` : transcript);
      setIsListeningEn(false);
    };
    recognition.onerror = () => setIsListeningEn(false);
    recognition.onend = () => setIsListeningEn(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListeningEn(true);
  }, [t]);

  const stopEnVoiceInput = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListeningEn(false);
  }, []);

  const addAlternative = useCallback((pid: string) => {
    if (alternatives.length >= 3) return;
    setAlternatives(prev => [...prev, pid]);
    setAltSearch('');
  }, [alternatives.length]);

  const removeAlternative = useCallback((pid: string) => {
    setAlternatives(prev => prev.filter(id => id !== pid));
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[90vh] overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs rounded-lg" onClick={() => cameraInputRef.current?.click()}>
                  <Camera size={13} className="mr-1" /> {t('takePhoto')}
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs rounded-lg" onClick={() => fileInputRef.current?.click()}>
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
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="π.χ. Γάλα"
                  className="h-10 flex-1"
                  lang="el"
                  autoComplete="off"
                />
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
              <div className="flex gap-2">
                <Input
                  value={nameEn}
                  onChange={e => setNameEn(e.target.value)}
                  placeholder="e.g. Milk"
                  className="h-10 flex-1"
                  lang="en"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant={isListeningEn ? 'destructive' : 'outline'}
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl relative"
                  onClick={isListeningEn ? stopEnVoiceInput : startEnVoiceInput}
                >
                  {isListeningEn ? (
                    <>
                      <MicOff size={18} />
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
                    </>
                  ) : (
                    <Mic size={18} />
                  )}
                </Button>
              </div>
              {isListeningEn && (
                <p className="text-xs text-destructive animate-pulse flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-destructive inline-block" /> Listening...
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-medium">{t('category')}</Label>
                <Select value={category} onValueChange={v => setCategory(v)}>
                  <SelectTrigger ><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allCategoryKeys.map(c => (
                      <SelectItem key={c} value={c}>{getCategoryLabel(c)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-28 space-y-1.5">
                <Label className="text-xs font-medium">{t('unit')}</Label>
                <Select value={unit} onValueChange={v => setUnit(v as ProductUnit)}>
                  <SelectTrigger ><SelectValue /></SelectTrigger>
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
                lang="el"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Barcode</Label>
              <div className="flex gap-2">
                <Input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="(προαιρετικό)" className="h-10 flex-1" inputMode="numeric" />
                <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={() => setScannerOpen(true)}>
                  <Camera size={18} />
                </Button>
              </div>
            </div>

            {/* Alternatives - Dropdown rows with +/- */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {t('alternatives')} <span className="text-muted-foreground font-normal">({alternatives.length}/3)</span>
              </Label>
              
              {/* Current alternatives as removable rows */}
              {alternatives.length > 0 && (
                <div className="space-y-1">
                  {alternatives.map(altId => {
                    const altP = products.find(p => p.id === altId);
                    if (!altP) return null;
                    return (
                      <div key={altId} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-border">
                        <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${CATEGORY_COLORS[altP.category]}`}>
                          {CATEGORY_EMOJI[altP.category]}
                        </span>
                        <span className="text-xs flex-1 truncate text-foreground">
                          {lang === 'el' ? altP.name : (altP.nameEn || altP.name)}
                        </span>
                        <button
                          onClick={() => removeAlternative(altId)}
                          className="w-6 h-6 rounded-md flex items-center justify-center bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add alternative - search dropdown */}
              {alternatives.length < 3 && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                  <Input
                    value={altSearch}
                    onChange={e => setAltSearch(e.target.value)}
                    placeholder={t('searchAlternative')}
                    className="h-8 pl-8 text-xs rounded-lg"
                  />
                  {/* Dropdown results */}
                  {altSearchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 border border-border rounded-lg bg-popover shadow-md z-10 overflow-hidden">
                      {altSearchResults.map(p => (
                        <button
                          key={p.id}
                          onClick={() => addAlternative(p.id)}
                          className="w-full flex items-center gap-2 p-2 hover:bg-accent transition-colors text-left"
                        >
                          <span className="text-xs">{CATEGORY_EMOJI[p.category] || '📦'}</span>
                          <span className="text-xs text-foreground truncate flex-1">{lang === 'el' ? p.name : (p.nameEn || p.name)}</span>
                          <Plus size={12} className="text-primary shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
