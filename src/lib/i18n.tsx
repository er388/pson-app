import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type Lang = 'el' | 'en';

const translations = {
  el: {
    shoppingList: 'Λίστα Ψωνιών',
    catalog: 'Κατάλογος',
    settings: 'Ρυθμίσεις',
    statistics: 'Στατιστικά',
    history: 'Ιστορικό',
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
    unit: 'Μονάδα μέτρησης',
    note: 'Σημείωση',
    notePlaceholder: 'π.χ. ώριμες, χωρίς γλουτένη...',
    favorites: 'Αγαπημένα',
    favoriteAdded: 'Προστέθηκε στα αγαπημένα',
    favoriteRemoved: 'Αφαιρέθηκε από τα αγαπημένα',
    frequentBuyPrompt: 'Το αγοράζεις συχνά, θες να το κάνεις αγαπημένο;',
    yes: 'Ναι',
    no: 'Όχι',
    skip: 'Παράλειψη',
    share: 'Κοινοποίηση',
    copied: 'Αντιγράφηκε!',
    saveAsTemplate: 'Αποθήκευση ως Template',
    templateName: 'Όνομα template',
    templates: 'Templates Λίστας',
    loadTemplate: 'Φόρτωση Template',
    mergeTemplate: 'Συγχώνευση',
    replaceTemplate: 'Αντικατάσταση',
    loadTemplateConfirm: 'Πώς θέλεις να φορτώσεις το template;',
    noTemplates: 'Δεν υπάρχουν templates',
    templateSaved: 'Αποθηκεύτηκε!',
    templateLoaded: 'Φορτώθηκε!',
    templateDeleted: 'Διαγράφηκε!',
    quickAdd: 'Γρήγορη Προσθήκη',
    frequentProducts: 'Συχνά αγοραζόμενα',
    addPhoto: 'Προσθήκη φωτογραφίας',
    takePhoto: 'Λήψη με κάμερα',
    chooseFromGallery: 'Επιλογή από γκαλερί',
    voiceInput: 'Φωνητική εισαγωγή',
    listening: 'Ακούω...',
    cloudBackup: 'Cloud Backup',
    autoBackup: 'Αυτόματο backup κατά την ολοκλήρωση',
    backupNow: 'Backup τώρα',
    restoreFromCloud: 'Επαναφορά από cloud',
    connected: 'Συνδεδεμένο',
    connect: 'Σύνδεση',
    backupSuccess: 'Το backup ολοκληρώθηκε!',
    restoreSuccess: 'Η επαναφορά ολοκληρώθηκε!',
    noBackupsFound: 'Δεν βρέθηκαν backups',
    googleDrive: 'Google Drive',
    oneDrive: 'OneDrive',
    dropbox: 'Dropbox',
    removePhoto: 'Αφαίρεση φωτογραφίας',
    scanBarcode: 'Σάρωση Barcode',
    barcodeNotFound: 'Δεν βρέθηκε προϊόν με αυτό το barcode.',
    addToCatalog: 'Προσθήκη στον κατάλογο',
    sortByCategory: 'Κατηγορία',
    sortByStore: 'Κατάστημα',
    sortByAdded: 'Προσθήκη',
    deleted: 'Διαγράφηκε',
    undo: 'Αναίρεση',
    // Budget
    budget: 'Προϋπολογισμός',
    setBudget: 'Ορισμός προϋπολογισμού',
    budgetAmount: 'Ποσό',
    budgetScope: 'Εφαρμογή',
    budgetGlobal: 'Σε όλα τα καταστήματα',
    budgetPerStore: 'Ανά κατάστημα',
    budgetUsed: 'Χρησιμοποιήθηκαν',
    budgetOf: 'από',
    budgetExceeded: 'Υπέρβαση κατά',
    removeBudget: 'Κατάργηση προϋπολογισμού',
    // Alternatives
    alternatives: 'Εναλλακτικά',
    addAlternative: 'Προσθήκη εναλλακτικού',
    searchAlternative: 'Αναζήτηση προϊόντος...',
    swapProduct: 'Αντικατάσταση',
    maxAlternatives: 'Μέγιστο 3 εναλλακτικά',
    // History
    purchaseHistoryList: 'Ιστορικό Λιστών',
    viewDetails: 'Λεπτομέρειες',
    reloadList: 'Επαναφόρτωση',
    replaceCurrentList: 'Αντικατάσταση τρέχουσας λίστας',
    mergeWithCurrent: 'Συγχώνευση με τρέχουσα',
    saveAsTemplateFromHistory: 'Αποθήκευση ως Template',
    noHistory: 'Δεν υπάρχει ιστορικό',
    noHistoryDesc: 'Ολοκλήρωσε αγορές για να δεις το ιστορικό!',
    filterByStore: 'Φίλτρο κατ/τος',
    filterByMonth: 'Φίλτρο μήνα',
    allStores: 'Όλα τα καταστήματα',
    allMonths: 'Όλοι οι μήνες',
    historyLimit: 'Όριο ιστορικού',
    listsKept: 'λίστες αποθηκεύονται',
    products_count: 'προϊόντα',
    reloadConfirm: 'Πώς θέλεις να φορτώσεις τη λίστα;',
    listReloaded: 'Η λίστα φορτώθηκε!',
    // Open Food Facts
    foundOnOFF: 'Βρέθηκε στο Open Food Facts — ελέγξτε τα στοιχεία',
    // Loyalty Cards
    loyaltyCards: 'Κάρτες Loyalty',
    noLoyaltyCards: 'Δεν υπάρχουν κάρτες',
    addLoyaltyCard: 'Προσθήκη κάρτας',
    cardName: 'Όνομα κάρτας',
    cardNamePlaceholder: 'π.χ. Masoutis Club',
    cardNumber: 'Αριθμός κάρτας',
    barcodeType: 'Τύπος barcode',
    tapToClose: 'Πατήστε για κλείσιμο',
    showCard: 'Δείξε κάρτα',
    // Receipt OCR
    scanReceipt: 'Scan Απόδειξης',
    ocrAccuracyWarning: 'Η ακρίβεια εξαρτάται από την ποιότητα της φωτογραφίας',
    processingReceipt: 'Επεξεργασία απόδειξης...',
    recognizedItems: 'Αναγνωρισμένα προϊόντα',
    noItemsRecognized: 'Δεν αναγνωρίστηκαν προϊόντα',
    noConfirmedItems: 'Δεν υπάρχουν επιβεβαιωμένα προϊόντα',
    receiptSaved: 'Η απόδειξη αποθηκεύτηκε!',
    ocrError: 'Σφάλμα αναγνώρισης',
    // Duplicate detection
    duplicateFound: 'Υπάρχει ήδη',
    alreadyInList: 'Υπάρχει ήδη στη λίστα',
    increaseQuantity: 'Αύξηση ποσότητας',
    addAgain: 'Προσθήκη ξανά',
    // Smart uncheck
    smartUncheck: 'Αυτόματη μετακίνηση κατά το ξε-τσεκάρισμα',
    // Theme modes
    themeMode: 'Θέμα εμφάνισης',
    themeLight: 'Φωτεινό',
    themeDark: 'Σκοτεινό',
    themeBlack: 'AMOLED',
    themeGreen: 'Πράσινο',
    themeBlue: 'Μπλε',
    themeRed: 'Κόκκινο',
    // History delete
    deleteEntry: 'Διαγραφή εγγραφής',
    deleteEntryConfirm: 'Θέλετε να διαγράψετε αυτή την αγορά από το ιστορικό;',
    // Store check
    noStoreSelected: 'Δεν έχετε επιλέξει κατάστημα',
    noStorePrompt: 'Θέλετε να επιλέξετε κατάστημα ή να συνεχίσετε χωρίς;',
    selectStoreOption: 'Επιλογή καταστήματος',
    continueWithout: 'Συνέχεια χωρίς',
    // Back button
    exitConfirm: 'Θέλετε να κλείσετε την εφαρμογή;',
    // Startup page
    startupPage: 'Αρχική σελίδα εκκίνησης',
    lastVisited: 'Τελευταία επισκεφθείσα',
  },
  en: {
    shoppingList: 'Shopping List',
    catalog: 'Catalog',
    settings: 'Settings',
    statistics: 'Statistics',
    history: 'History',
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
    unit: 'Unit',
    note: 'Note',
    notePlaceholder: 'e.g. ripe, check expiry...',
    favorites: 'Favorites',
    favoriteAdded: 'Added to favorites',
    favoriteRemoved: 'Removed from favorites',
    frequentBuyPrompt: 'You buy this often, want to make it a favorite?',
    yes: 'Yes',
    no: 'No',
    skip: 'Skip',
    share: 'Share',
    copied: 'Copied!',
    saveAsTemplate: 'Save as Template',
    templateName: 'Template name',
    templates: 'List Templates',
    loadTemplate: 'Load Template',
    mergeTemplate: 'Merge',
    replaceTemplate: 'Replace',
    loadTemplateConfirm: 'How do you want to load the template?',
    noTemplates: 'No templates',
    templateSaved: 'Saved!',
    templateLoaded: 'Loaded!',
    templateDeleted: 'Deleted!',
    quickAdd: 'Quick Add',
    frequentProducts: 'Frequently bought',
    addPhoto: 'Add photo',
    takePhoto: 'Take photo',
    chooseFromGallery: 'Choose from gallery',
    voiceInput: 'Voice input',
    listening: 'Listening...',
    cloudBackup: 'Cloud Backup',
    autoBackup: 'Auto backup on purchase completion',
    backupNow: 'Backup now',
    restoreFromCloud: 'Restore from cloud',
    connected: 'Connected',
    connect: 'Connect',
    backupSuccess: 'Backup completed!',
    restoreSuccess: 'Restore completed!',
    noBackupsFound: 'No backups found',
    googleDrive: 'Google Drive',
    oneDrive: 'OneDrive',
    dropbox: 'Dropbox',
    removePhoto: 'Remove photo',
    scanBarcode: 'Scan Barcode',
    barcodeNotFound: 'No product found with this barcode.',
    addToCatalog: 'Add to catalog',
    sortByCategory: 'Category',
    sortByStore: 'Store',
    sortByAdded: 'Added order',
    deleted: 'Deleted',
    undo: 'Undo',
    // Budget
    budget: 'Budget',
    setBudget: 'Set budget',
    budgetAmount: 'Amount',
    budgetScope: 'Apply to',
    budgetGlobal: 'All stores',
    budgetPerStore: 'Per store',
    budgetUsed: 'Used',
    budgetOf: 'of',
    budgetExceeded: 'Exceeded by',
    removeBudget: 'Remove budget',
    // Alternatives
    alternatives: 'Alternatives',
    addAlternative: 'Add alternative',
    searchAlternative: 'Search product...',
    swapProduct: 'Swap',
    maxAlternatives: 'Max 3 alternatives',
    // History
    purchaseHistoryList: 'Purchase History',
    viewDetails: 'Details',
    reloadList: 'Reload',
    replaceCurrentList: 'Replace current list',
    mergeWithCurrent: 'Merge with current',
    saveAsTemplateFromHistory: 'Save as Template',
    noHistory: 'No history',
    noHistoryDesc: 'Complete purchases to see history!',
    filterByStore: 'Filter store',
    filterByMonth: 'Filter month',
    allStores: 'All stores',
    allMonths: 'All months',
    historyLimit: 'History limit',
    listsKept: 'lists kept',
    products_count: 'products',
    reloadConfirm: 'How do you want to load the list?',
    listReloaded: 'List reloaded!',
    // Open Food Facts
    foundOnOFF: 'Found on Open Food Facts — please verify',
    // Loyalty Cards
    loyaltyCards: 'Loyalty Cards',
    noLoyaltyCards: 'No cards yet',
    addLoyaltyCard: 'Add card',
    cardName: 'Card name',
    cardNamePlaceholder: 'e.g. Store Club Card',
    cardNumber: 'Card number',
    barcodeType: 'Barcode type',
    tapToClose: 'Tap to close',
    showCard: 'Show card',
    // Receipt OCR
    scanReceipt: 'Scan Receipt',
    ocrAccuracyWarning: 'Accuracy depends on photo quality',
    processingReceipt: 'Processing receipt...',
    recognizedItems: 'Recognized items',
    noItemsRecognized: 'No items recognized',
    noConfirmedItems: 'No confirmed items',
    receiptSaved: 'Receipt saved!',
    ocrError: 'Recognition error',
    // Duplicate detection
    duplicateFound: 'Already exists',
    alreadyInList: 'Already in list',
    increaseQuantity: 'Increase quantity',
    addAgain: 'Add again',
    // Smart uncheck
    smartUncheck: 'Auto-move on uncheck',
    // Theme modes
    themeMode: 'Appearance',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeBlack: 'AMOLED',
    themeGreen: 'Green',
    themeBlue: 'Blue',
    themeRed: 'Red',
    // History delete
    deleteEntry: 'Delete entry',
    deleteEntryConfirm: 'Are you sure you want to delete this purchase from history?',
    // Store check
    noStoreSelected: 'No store selected',
    noStorePrompt: 'Would you like to select a store or continue without one?',
    selectStoreOption: 'Select store',
    continueWithout: 'Continue without',
    // Back button
    exitConfirm: 'Do you want to close the app?',
    // Startup page
    startupPage: 'Startup page',
    lastVisited: 'Last visited',
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
  const [defaultCategoryOverrides, setDefaultCategoryOverrides] = useState<Record<string, { name: string; nameEn?: string }>>(() => {
    try {
      return JSON.parse(localStorage.getItem('smartcart-default-category-overrides') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('smartcart-lang', lang);
  }, [lang]);

  useEffect(() => {
    const syncOverrides = () => {
      try {
        setDefaultCategoryOverrides(JSON.parse(localStorage.getItem('smartcart-default-category-overrides') || '{}'));
      } catch {
        setDefaultCategoryOverrides({});
      }
    };

    window.addEventListener('storage', syncOverrides);
    window.addEventListener('smartcart-category-overrides-updated', syncOverrides);

    return () => {
      window.removeEventListener('storage', syncOverrides);
      window.removeEventListener('smartcart-category-overrides-updated', syncOverrides);
    };
  }, []);

  const t = useCallback((key: TranslationKey) => {
    const override = defaultCategoryOverrides[key as string];
    if (override?.name) {
      return lang === 'el' ? override.name : (override.nameEn || override.name);
    }
    return translations[lang][key] || key;
  }, [defaultCategoryOverrides, lang]);

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
