import { useState, useEffect, useCallback } from 'react';
import { Product, ShoppingItem, Store, PurchaseRecord, Category } from './types';

function useLocalStorage<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

const uid = () => crypto.randomUUID();

const DEFAULT_PRODUCTS: Product[] = [
  { id: uid(), name: 'Γάλα', nameEn: 'Milk', category: 'dairy', purchaseCount: 0 },
  { id: uid(), name: 'Αυγά', nameEn: 'Eggs', category: 'dairy', purchaseCount: 0 },
  { id: uid(), name: 'Φέτα', nameEn: 'Feta Cheese', category: 'dairy', purchaseCount: 0 },
  { id: uid(), name: 'Γιαούρτι', nameEn: 'Yogurt', category: 'dairy', purchaseCount: 0 },
  { id: uid(), name: 'Ντομάτες', nameEn: 'Tomatoes', category: 'fruits', purchaseCount: 0 },
  { id: uid(), name: 'Πατάτες', nameEn: 'Potatoes', category: 'fruits', purchaseCount: 0 },
  { id: uid(), name: 'Μπανάνες', nameEn: 'Bananas', category: 'fruits', purchaseCount: 0 },
  { id: uid(), name: 'Μαρούλι', nameEn: 'Lettuce', category: 'fruits', purchaseCount: 0 },
  { id: uid(), name: 'Κοτόπουλο', nameEn: 'Chicken', category: 'meat', purchaseCount: 0 },
  { id: uid(), name: 'Κιμάς', nameEn: 'Ground Meat', category: 'meat', purchaseCount: 0 },
  { id: uid(), name: 'Ψωμί', nameEn: 'Bread', category: 'bread', purchaseCount: 0 },
  { id: uid(), name: 'Νερό', nameEn: 'Water', category: 'beverages', purchaseCount: 0 },
  { id: uid(), name: 'Χυμός Πορτοκάλι', nameEn: 'Orange Juice', category: 'beverages', purchaseCount: 0 },
  { id: uid(), name: 'Απορρυπαντικό', nameEn: 'Detergent', category: 'cleaning', purchaseCount: 0 },
  { id: uid(), name: 'Χαρτί Υγείας', nameEn: 'Toilet Paper', category: 'personal', purchaseCount: 0 },
  { id: uid(), name: 'Παγωτό', nameEn: 'Ice Cream', category: 'frozen', purchaseCount: 0 },
  { id: uid(), name: 'Πατατάκια', nameEn: 'Chips', category: 'snacks', purchaseCount: 0 },
  { id: uid(), name: 'Μακαρόνια', nameEn: 'Pasta', category: 'other', purchaseCount: 0 },
  { id: uid(), name: 'Ρύζι', nameEn: 'Rice', category: 'other', purchaseCount: 0 },
  { id: uid(), name: 'Ελαιόλαδο', nameEn: 'Olive Oil', category: 'other', purchaseCount: 0 },
];

const DEFAULT_STORES: Store[] = [
  { id: uid(), name: 'Σκλαβενίτης' },
  { id: uid(), name: 'ΑΒ Βασιλόπουλος' },
  { id: uid(), name: 'Lidl' },
  { id: uid(), name: 'My Market' },
];

export function useProducts() {
  const [products, setProducts] = useLocalStorage<Product[]>('smartcart-products', DEFAULT_PRODUCTS);

  const addProduct = useCallback((p: Omit<Product, 'id' | 'purchaseCount'>) => {
    const newP: Product = { ...p, id: uid(), purchaseCount: 0 };
    setProducts(prev => [...prev, newP]);
    return newP;
  }, [setProducts]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [setProducts]);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, [setProducts]);

  return { products, addProduct, updateProduct, deleteProduct };
}

export function useShoppingList() {
  const [items, setItems] = useLocalStorage<ShoppingItem[]>('smartcart-list', []);
  const [activeStoreId, setActiveStoreId] = useLocalStorage<string | null>('smartcart-active-store', null);

  const addItem = useCallback((productId: string, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing) return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i);
      return [...prev, { id: uid(), productId, quantity, checked: false }];
    });
  }, [setItems]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, [setItems]);

  const toggleCheck = useCallback((id: string, price?: number, discount?: number) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const checked = !i.checked;
      return { ...i, checked, price: checked ? price : i.price, discount: checked ? discount : i.discount, checkedAt: checked ? new Date().toISOString() : undefined };
    }));
  }, [setItems]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) { setItems(prev => prev.filter(i => i.id !== id)); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  }, [setItems]);

  const clearChecked = useCallback(() => {
    setItems(prev => prev.filter(i => !i.checked));
  }, [setItems]);

  const total = items.reduce((sum, i) => {
    if (!i.checked || !i.price) return sum;
    const discounted = i.price * (1 - (i.discount || 0) / 100);
    return sum + discounted * i.quantity;
  }, 0);

  // Sort: checked first (newest first), then unchecked
  const sortedItems = [...items].sort((a, b) => {
    if (a.checked && !b.checked) return -1;
    if (!a.checked && b.checked) return 1;
    if (a.checked && b.checked) return new Date(b.checkedAt!).getTime() - new Date(a.checkedAt!).getTime();
    return 0;
  });

  return { items: sortedItems, rawItems: items, addItem, removeItem, toggleCheck, updateQuantity, clearChecked, total, activeStoreId, setActiveStoreId };
}

export function useStores() {
  const [stores, setStores] = useLocalStorage<Store[]>('smartcart-stores', DEFAULT_STORES);

  const addStore = useCallback((name: string) => {
    const s: Store = { id: uid(), name };
    setStores(prev => [...prev, s]);
    return s;
  }, [setStores]);

  const removeStore = useCallback((id: string) => {
    setStores(prev => prev.filter(s => s.id !== id));
  }, [setStores]);

  return { stores, addStore, removeStore };
}

export function usePurchaseHistory() {
  const [history, setHistory] = useLocalStorage<PurchaseRecord[]>('smartcart-history', []);

  const addRecord = useCallback((record: Omit<PurchaseRecord, 'id'>) => {
    setHistory(prev => [...prev, { ...record, id: uid() }]);
  }, [setHistory]);

  return { history, addRecord };
}

export function useDarkMode() {
  const [dark, setDark] = useLocalStorage('smartcart-dark', false);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  return [dark, setDark] as const;
}
