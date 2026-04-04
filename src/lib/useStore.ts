import { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, ShoppingItem, Store, PurchaseRecord, CompletedPurchase, Category, DefaultCategory, CustomCategory, AppData, DEFAULT_CATEGORIES, DEFAULT_CATEGORY_EMOJI, DEFAULT_CATEGORY_COLORS, CATEGORY_EMOJI, CATEGORY_COLORS, ProductUnit, ListTemplate, Budget, LoyaltyCard } from './types';

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
  const [products, setProducts] = useLocalStorage<Product[]>('Pson-products', DEFAULT_PRODUCTS);

  const addProduct = useCallback((p: Omit<Product, 'id' | 'purchaseCount'>) => {
    const newP: Product = { ...p, id: uid(), purchaseCount: 0, unit: p.unit || 'τεμ.' };
    setProducts(prev => [...prev, newP]);
    return newP;
  }, [setProducts]);

  const toggleFavorite = useCallback((id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, favorite: !p.favorite } : p));
  }, [setProducts]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [setProducts]);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, [setProducts]);

  const incrementPurchaseCount = useCallback((id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, purchaseCount: p.purchaseCount + 1 } : p));
  }, [setProducts]);

  const setAllProducts = useCallback((prods: Product[]) => {
    setProducts(prods);
  }, [setProducts]);

  return { products, addProduct, updateProduct, deleteProduct, incrementPurchaseCount, toggleFavorite, setAllProducts };
}

export function useShoppingList() {
  const [items, setItems] = useLocalStorage<ShoppingItem[]>('Pson-list', []);
  const [activeStoreId, setActiveStoreId] = useLocalStorage<string | null>('Pson-active-store', null);

  const addItem = useCallback((productId: string, quantity = 1, storeId?: string | null) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === productId && i.storeId === storeId);
      if (existing) return prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i);
      return [...prev, { id: uid(), productId, quantity, checked: false, storeId: storeId ?? null }];
    });
  }, [setItems]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, [setItems]);

  const removeByProductId = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, [setItems]);

  const toggleCheck = useCallback((id: string, price?: number, discount?: number) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const checked = !i.checked;
      return { ...i, checked, price: checked ? (price ?? i.price) : i.price, discount: checked ? (discount ?? i.discount) : i.discount, checkedAt: checked ? new Date().toISOString() : undefined };
    }));
  }, [setItems]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) { setItems(prev => prev.filter(i => i.id !== id)); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  }, [setItems]);

  const updateItemProductId = useCallback((itemId: string, newProductId: string) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, productId: newProductId } : i));
  }, [setItems]);

  const clearChecked = useCallback(() => {
    setItems(prev => prev.filter(i => !i.checked));
  }, [setItems]);

  const clearAll = useCallback(() => {
    setItems([]);
  }, [setItems]);

  const setAllItems = useCallback((newItems: ShoppingItem[]) => {
    setItems(newItems);
  }, [setItems]);

  const total = items.reduce((sum, i) => {
    if (!i.checked || !i.price) return sum;
    const discounted = i.price * (1 - (i.discount || 0) / 100);
    return sum + discounted * i.quantity;
  }, 0);

  // Budget total: all items with price, regardless of checked status
  const budgetTotal = items.reduce((sum, i) => {
    if (!i.price) return sum;
    const discounted = i.price * (1 - (i.discount || 0) / 100);
    return sum + discounted * i.quantity;
  }, 0);

  const getStoreTotal = useCallback((storeId: string | null) => {
    return items.reduce((sum, i) => {
      if ((i.storeId || null) !== storeId) return sum;
      if (!i.checked || !i.price) return sum;
      const discounted = i.price * (1 - (i.discount || 0) / 100);
      return sum + discounted * i.quantity;
    }, 0);
  }, [items]);

  const getStoreBudgetTotal = useCallback((storeId: string | null) => {
    return items.reduce((sum, i) => {
      if ((i.storeId || null) !== storeId) return sum;
      if (!i.price) return sum;
      const discounted = i.price * (1 - (i.discount || 0) / 100);
      return sum + discounted * i.quantity;
    }, 0);
  }, [items]);

  const sortedItems = [...items].sort((a, b) => {
    if (a.checked && !b.checked) return -1;
    if (!a.checked && b.checked) return 1;
    if (a.checked && b.checked) return new Date(b.checkedAt!).getTime() - new Date(a.checkedAt!).getTime();
    return 0;
  });

  return { items: sortedItems, rawItems: items, addItem, removeItem, removeByProductId, toggleCheck, updateQuantity, updateItemProductId, clearChecked, clearAll, total, budgetTotal, getStoreTotal, getStoreBudgetTotal, activeStoreId, setActiveStoreId, setAllItems };
}

export function useStores() {
  const [stores, setStores] = useLocalStorage<Store[]>('Pson-stores', DEFAULT_STORES);

  const addStore = useCallback((name: string) => {
    const s: Store = { id: uid(), name };
    setStores(prev => [...prev, s]);
    return s;
  }, [setStores]);

  const removeStore = useCallback((id: string) => {
    setStores(prev => prev.filter(s => s.id !== id));
  }, [setStores]);

  const setAllStores = useCallback((newStores: Store[]) => {
    setStores(newStores);
  }, [setStores]);

  return { stores, addStore, removeStore, setAllStores };
}

export function usePurchaseHistory() {
  const [history, setHistory] = useLocalStorage<PurchaseRecord[]>('Pson-history', []);

  const addRecord = useCallback((record: Omit<PurchaseRecord, 'id'>) => {
    setHistory(prev => [...prev, { ...record, id: uid() }]);
  }, [setHistory]);

  const setAllHistory = useCallback((newHistory: PurchaseRecord[]) => {
    setHistory(newHistory);
  }, [setHistory]);

  return { history, addRecord, setAllHistory };
}

export function useCompletedPurchases() {
  const [purchases, setPurchases] = useLocalStorage<CompletedPurchase[]>('Pson-completed-purchases', []);
  const [historyLimit, setHistoryLimit] = useLocalStorage<number>('Pson-history-limit', 1000);

  const addPurchase = useCallback((purchase: Omit<CompletedPurchase, 'id'>) => {
    setPurchases(prev => {
      const updated = [...prev, { ...purchase, id: uid() }];
      if (updated.length > historyLimit) {
        return updated.slice(updated.length - historyLimit);
      }
      return updated;
    });
  }, [setPurchases, historyLimit]);

  const removePurchase = useCallback((id: string) => {
    setPurchases(prev => prev.filter(p => p.id !== id));
  }, [setPurchases]);

  const setAllPurchases = useCallback((ps: CompletedPurchase[]) => {
    setPurchases(ps);
  }, [setPurchases]);

  return { purchases, addPurchase, removePurchase, setAllPurchases, historyLimit, setHistoryLimit };
}

export function useTemplates() {
  const [templates, setTemplates] = useLocalStorage<ListTemplate[]>('Pson-templates', []);

  const addTemplate = useCallback((name: string, items: { productId: string; quantity: number; storeId?: string | null }[]) => {
    const t: ListTemplate = { id: uid(), name, items, createdAt: new Date().toISOString() };
    setTemplates(prev => [...prev, t]);
    return t;
  }, [setTemplates]);

  const updateTemplate = useCallback((id: string, name: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, name } : t));
  }, [setTemplates]);

  const removeTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, [setTemplates]);

  const setAllTemplates = useCallback((ts: ListTemplate[]) => {
    setTemplates(ts);
  }, [setTemplates]);

  return { templates, addTemplate, removeTemplate, updateTemplate, setAllTemplates };
}

type CategoryOverrides = Partial<Record<DefaultCategory, { name: string; nameEn?: string }>>;

export function useCustomCategories() {
  const [categories, setCategories] = useLocalStorage<CustomCategory[]>('Pson-custom-categories', []);
  const [defaultCategoryOverrides, setDefaultCategoryOverrides] = useLocalStorage<CategoryOverrides>('Pson-default-category-overrides', {});
  const [hiddenDefaultCategories, setHiddenDefaultCategories] = useLocalStorage<DefaultCategory[]>(
    'Pson-hidden-default-categories', [],
  );
  const [categoryOrder, setCategoryOrder] = useLocalStorage<string[]>('Pson-category-order', []);

  useEffect(() => {
    Object.keys(CATEGORY_EMOJI).forEach(k => {
      if (!(k in DEFAULT_CATEGORY_EMOJI)) delete CATEGORY_EMOJI[k];
    });
    Object.keys(CATEGORY_COLORS).forEach(k => {
      if (!(k in DEFAULT_CATEGORY_COLORS)) delete CATEGORY_COLORS[k];
    });
    categories.forEach(c => {
      CATEGORY_EMOJI[c.id] = c.emoji;
      CATEGORY_COLORS[c.id] = c.color;
    });
  }, [categories]);

  useEffect(() => {
    window.dispatchEvent(new Event('Pson-category-overrides-updated'));
  }, [defaultCategoryOverrides]);

  const visibleDefaultCategories = useMemo(
    () => DEFAULT_CATEGORIES.filter(c => !hiddenDefaultCategories.includes(c)),
    [hiddenDefaultCategories],
  );

  // Unified ordered list respecting stored category order
  const allCategoryKeys = useMemo(() => {
    const visible = [...visibleDefaultCategories, ...categories.map(c => c.id)];
    if (categoryOrder.length === 0) return visible;
    const vSet = new Set(visible);
    const ordered = categoryOrder.filter(k => vSet.has(k));
    visible.forEach(k => { if (!ordered.includes(k)) ordered.push(k); });
    return ordered;
  }, [visibleDefaultCategories, categories, categoryOrder]);

  const addCategory = useCallback((cat: Omit<CustomCategory, 'id'>) => {
    const newCat: CustomCategory = { ...cat, id: `custom_${uid()}` };
    setCategories(prev => [...prev, newCat]);
    setCategoryOrder(prev => [...prev, newCat.id]);
    return newCat;
  }, [setCategories, setCategoryOrder]);

  const updateCategory = useCallback((id: string, updates: Partial<CustomCategory>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [setCategories]);

  const removeCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    setCategoryOrder(prev => prev.filter(k => k !== id));
  }, [setCategories, setCategoryOrder]);

  const setAllCategories = useCallback((cats: CustomCategory[]) => {
    setCategories(cats);
  }, [setCategories]);

  const reorderCategories = useCallback((newOrder: string[]) => {
    setCategoryOrder(newOrder);
  }, [setCategoryOrder]);

  const updateDefaultCategory = useCallback((key: DefaultCategory, name: string, nameEn?: string) => {
    setDefaultCategoryOverrides(prev => ({
      ...prev,
      [key]: { name, nameEn: nameEn?.trim() || undefined },
    }));
  }, [setDefaultCategoryOverrides]);

  const hideDefaultCategory = useCallback((key: DefaultCategory) => {
    setHiddenDefaultCategories(prev => prev.includes(key) ? prev : [...prev, key]);
    setCategoryOrder(prev => prev.filter(k => k !== key));
  }, [setHiddenDefaultCategories, setCategoryOrder]);

  return {
    customCategories: categories,
    addCategory,
    updateCategory,
    removeCategory,
    setAllCategories,
    reorderCategories,
    allCategoryKeys,
    defaultCategoryOverrides,
    updateDefaultCategory,
    hideDefaultCategory,
    hiddenDefaultCategories,
  };
}

export function useBudget() {
  const [budget, setBudget] = useLocalStorage<Budget | null>('Pson-budget', null);

  const clearBudget = useCallback(() => {
    setBudget(null);
  }, [setBudget]);

  return { budget, setBudget, clearBudget };
}

export function useLoyaltyCards() {
  const [cards, setCards] = useLocalStorage<LoyaltyCard[]>('Pson-loyalty-cards', []);

  const addCard = useCallback((card: Omit<LoyaltyCard, 'id'>) => {
    setCards(prev => [...prev, { ...card, id: uid() }]);
  }, [setCards]);

  const removeCard = useCallback((id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  }, [setCards]);

  const setAllCards = useCallback((newCards: LoyaltyCard[]) => {
    setCards(newCards);
  }, [setCards]);

  return { cards, addCard, removeCard, setAllCards };
}

export type ThemeMode = 'system' | 'light' | 'dark' | 'black' | 'green' | 'blue' | 'red';

export function useThemeMode() {
  const [theme, setTheme] = useLocalStorage<ThemeMode>('Pson-theme', 'light');
  useEffect(() => {
    const cl = document.documentElement.classList;
    cl.remove('dark', 'theme-black', 'theme-green', 'theme-blue', 'theme-red');
    if (theme === 'dark') cl.add('dark');
    else if (theme === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) cl.add('dark');
    }
    else if (theme === 'black') { cl.add('dark'); cl.add('theme-black'); }
    else if (theme === 'green') { cl.add('dark'); cl.add('theme-green'); }
    else if (theme === 'blue') { cl.add('dark'); cl.add('theme-blue'); }
    else if (theme === 'red') { cl.add('dark'); cl.add('theme-red'); }
  }, [theme]);
  return [theme, setTheme] as const;
}

// Legacy compat
export function useDarkMode() {
  const [theme, setTheme] = useThemeMode();
  const dark = theme !== 'light';
  const setDark = useCallback((v: boolean | ((prev: boolean) => boolean)) => {
    if (typeof v === 'function') {
      setTheme(prev => v(prev !== 'light') ? 'dark' : 'light');
    } else {
      setTheme(v ? 'dark' : 'light');
    }
  }, [setTheme]);
  return [dark, setDark] as const;
}

export function exportAppData(): AppData {
  const get = (key: string) => {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  };
  return {
    products: get('Pson-products') || [],
    shoppingList: get('Pson-list') || [],
    stores: get('Pson-stores') || [],
    purchaseHistory: get('Pson-history') || [],
    completedPurchases: get('Pson-completed-purchases') || [],
    customCategories: get('Pson-custom-categories') || [],
    activeStoreId: get('Pson-active-store'),
    templates: get('Pson-templates') || [],
  };
}

export function importAppData(data: AppData) {
  localStorage.setItem('Pson-products', JSON.stringify(data.products || []));
  localStorage.setItem('Pson-list', JSON.stringify(data.shoppingList || []));
  localStorage.setItem('Pson-stores', JSON.stringify(data.stores || []));
  localStorage.setItem('Pson-history', JSON.stringify(data.purchaseHistory || []));
  localStorage.setItem('Pson-completed-purchases', JSON.stringify(data.completedPurchases || []));
  localStorage.setItem('Pson-custom-categories', JSON.stringify(data.customCategories || []));
  localStorage.setItem('Pson-templates', JSON.stringify(data.templates || []));
  if (data.activeStoreId !== undefined) {
    localStorage.setItem('Pson-active-store', JSON.stringify(data.activeStoreId));
  }
}

export function getDefaultProducts() {
  return DEFAULT_PRODUCTS.map(p => ({ ...p, id: uid() }));
}

export function getDefaultStores() {
  return DEFAULT_STORES.map(s => ({ ...s, id: uid() }));
}

export function useParkedItems() {
  const [parked, setParked] = useLocalStorage<Record<string, ShoppingItem[]>>('Pson-parked', {});

  const park = useCallback((storeId: string, items: ShoppingItem[]) => {
    if (!items.length) return;
    setParked(prev => ({ ...prev, [storeId]: items }));
  }, [setParked]);

  const clearPark = useCallback((storeId: string) => {
    setParked(prev => { const n = { ...prev }; delete n[storeId]; return n; });
  }, [setParked]);

  const removeProduct = useCallback((productId: string) => {
    setParked(prev => {
      const n = { ...prev };
      Object.keys(n).forEach(k => {
        n[k] = n[k].filter(i => i.productId !== productId);
        if (!n[k].length) delete n[k];
      });
      return n;
    });
  }, [setParked]);

  return { parked, park, clearPark, removeProduct };
}