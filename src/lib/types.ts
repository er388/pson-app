// Default built-in category keys
export type DefaultCategory = 'dairy' | 'fruits' | 'meat' | 'bread' | 'beverages' | 'cleaning' | 'personal' | 'frozen' | 'snacks' | 'other';

// Category can be a default key or a custom category id (prefixed with 'custom_')
export type Category = string;

export const DEFAULT_CATEGORIES: DefaultCategory[] = ['dairy', 'fruits', 'meat', 'bread', 'beverages', 'cleaning', 'personal', 'frozen', 'snacks', 'other'];

export const DEFAULT_CATEGORY_EMOJI: Record<DefaultCategory, string> = {
  dairy: '🥛', fruits: '🍎', meat: '🥩', bread: '🍞', beverages: '🥤',
  cleaning: '🧹', personal: '🧴', frozen: '🧊', snacks: '🍿', other: '📦',
};

export const DEFAULT_CATEGORY_COLORS: Record<DefaultCategory, string> = {
  dairy: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  fruits: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  meat: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  bread: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  beverages: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  cleaning: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  personal: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  frozen: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  snacks: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

// Legacy aliases for backward compat
export const CATEGORIES = DEFAULT_CATEGORIES as readonly string[];
export const CATEGORY_EMOJI: Record<string, string> = { ...DEFAULT_CATEGORY_EMOJI };
export const CATEGORY_COLORS: Record<string, string> = { ...DEFAULT_CATEGORY_COLORS };

export interface CustomCategory {
  id: string;
  name: string;
  nameEn?: string;
  emoji: string;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  category: Category;
  barcode?: string;
  purchaseCount: number;
}

export interface ShoppingItem {
  id: string;
  productId: string;
  quantity: number;
  checked: boolean;
  price?: number;
  discount?: number;
  checkedAt?: string;
  storeId?: string | null; // which store this item belongs to
}

export interface Store {
  id: string;
  name: string;
}

export interface PurchaseRecord {
  id: string;
  productId: string;
  price: number;
  discount: number;
  storeId: string;
  date: string;
}

// A completed purchase session
export interface CompletedPurchase {
  id: string;
  date: string;
  storeIds: string[];
  items: {
    productId: string;
    quantity: number;
    price: number;
    discount: number;
    storeId?: string | null;
  }[];
  total: number;
}

// All app data for export/import
export interface AppData {
  products: Product[];
  shoppingList: ShoppingItem[];
  stores: Store[];
  purchaseHistory: PurchaseRecord[];
  completedPurchases: CompletedPurchase[];
  customCategories: CustomCategory[];
  activeStoreId: string | null;
}
