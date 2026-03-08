import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Lang = 'el' | 'en';

const translations = {
  el: {
    shoppingList: 'Λίστα Ψωνιών',
    catalog: 'Κατάλογος',
    settings: 'Ρυθμίσεις',
    statistics: 'Στατιστικά',
    search: 'Αναζήτηση...',
    addProduct: 'Νέο Προϊόν',
    editProduct: 'Επεξεργασία',
    deleteProduct: 'Διαγραφή',
    productName: 'Όνομα προϊόντος',
    category: 'Κατηγορία',
    quantity: 'Ποσότητα',
    price: 'Τιμή (€)',
    discount: 'Έκπτωση (%)',
    store: 'Κατάστημα',
    selectStore: 'Επιλογή καταστήματος',
    changeStore: 'Αλλαγή',
    noStore: 'Χωρίς κατάστημα',
    addToList: 'Προσθήκη στη λίστα',
    removeFromList: 'Αφαίρεση από τη λίστα',
    total: 'Σύνολο',
    grandTotal: 'Γενικό Σύνολο',
    subtotal: 'Υποσύνολο',
    save: 'Αποθήκευση',
    cancel: 'Ακύρωση',
    delete: 'Διαγραφή',
    confirm: 'Επιβεβαίωση',
    noItems: 'Η λίστα είναι άδεια',
    addItems: 'Πρόσθεσε προϊόντα για να ξεκινήσεις!',
    noProducts: 'Δεν υπάρχουν προϊόντα',
    addFirst: 'Πρόσθεσε το πρώτο σου προϊόν!',
    checkedItems: 'Τσεκαρισμένα',
    language: 'Γλώσσα',
    darkMode: 'Σκοτεινή λειτουργία',
    stores: 'Καταστήματα',
    addStore: 'Προσθήκη καταστήματος',
    storeName: 'Όνομα καταστήματος',
    all: 'Όλα',
    enterPrice: 'Καταγραφή τιμής',
    clearChecked: 'Καθαρισμός τσεκαρισμένων',
    completePurchase: 'Ολοκλήρωση αγοράς',
    purchaseCompleted: 'Η αγορά ολοκληρώθηκε!',
    purchaseHistory: 'Ιστορικό αγορών',
    totalSpending: 'Συνολικές δαπάνες',
    topProducts: 'Δημοφιλή προϊόντα',
    priceHistory: 'Ιστορικό τιμών',
    storeComparison: 'Σύγκριση καταστημάτων',
    cheapestStore: 'Φθηνότερο κατάστημα',
    priceChange: 'Μεταβολή τιμής',
    monthlySpending: 'Μηνιαίες δαπάνες',
    byCategory: 'Ανά κατηγορία',
    byStore: 'Ανά κατάστημα',
    byPeriod: 'Χρονική περίοδος',
    week: 'Εβδομάδα',
    month: 'Μήνας',
    allTime: 'Όλο το ιστορικό',
    noData: 'Δεν υπάρχουν δεδομένα',
    addStoreToList: 'Προσθήκη καταστήματος',
    dairy: 'Γαλακτοκομικά',
    fruits: 'Φρούτα & Λαχανικά',
    meat: 'Κρέας',
    bread: 'Αρτοσκευάσματα',
    beverages: 'Ποτά',
    cleaning: 'Καθαριστικά',
    personal: 'Προσωπική Φροντίδα',
    frozen: 'Κατεψυγμένα',
    snacks: 'Σνακ',
    other: 'Άλλο',
    itemsCount: 'προϊόντα',
    appTitle: 'Pson.io',
    version: 'Έκδοση 1.0',
    added: 'Προστέθηκε',
    removed: 'Αφαιρέθηκε',
  },
  en: {
    shoppingList: 'Shopping List',
    catalog: 'Catalog',
    settings: 'Settings',
    statistics: 'Statistics',
    search: 'Search...',
    addProduct: 'New Product',
    editProduct: 'Edit',
    deleteProduct: 'Delete',
    productName: 'Product name',
    category: 'Category',
    quantity: 'Quantity',
    price: 'Price (€)',
    discount: 'Discount (%)',
    store: 'Store',
    selectStore: 'Select store',
    changeStore: 'Change',
    noStore: 'No store',
    addToList: 'Add to list',
    removeFromList: 'Remove from list',
    total: 'Total',
    grandTotal: 'Grand Total',
    subtotal: 'Subtotal',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirm: 'Confirm',
    noItems: 'List is empty',
    addItems: 'Add products to get started!',
    noProducts: 'No products yet',
    addFirst: 'Add your first product!',
    checkedItems: 'Checked',
    language: 'Language',
    darkMode: 'Dark Mode',
    stores: 'Stores',
    addStore: 'Add Store',
    storeName: 'Store name',
    all: 'All',
    enterPrice: 'Record price',
    clearChecked: 'Clear checked',
    completePurchase: 'Complete purchase',
    purchaseCompleted: 'Purchase completed!',
    purchaseHistory: 'Purchase history',
    totalSpending: 'Total spending',
    topProducts: 'Top products',
    priceHistory: 'Price history',
    storeComparison: 'Store comparison',
    cheapestStore: 'Cheapest store',
    priceChange: 'Price change',
    monthlySpending: 'Monthly spending',
    byCategory: 'By category',
    byStore: 'By store',
    byPeriod: 'Time period',
    week: 'Week',
    month: 'Month',
    allTime: 'All time',
    noData: 'No data',
    addStoreToList: 'Add store',
    dairy: 'Dairy',
    fruits: 'Fruits & Vegetables',
    meat: 'Meat',
    bread: 'Bread & Bakery',
    beverages: 'Beverages',
    cleaning: 'Cleaning',
    personal: 'Personal Care',
    frozen: 'Frozen',
    snacks: 'Snacks',
    other: 'Other',
    itemsCount: 'items',
    appTitle: 'Pson.io',
    version: 'Version 1.0',
    added: 'Added',
    removed: 'Removed',
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('smartcart-lang');
    return (saved as Lang) || 'el';
  });

  useEffect(() => {
    localStorage.setItem('smartcart-lang', lang);
  }, [lang]);

  const t = (key: TranslationKey) => translations[lang][key] || key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
