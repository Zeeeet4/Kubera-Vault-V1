import type {
  Category, Account, Entry, Expense, Debt, CreditCard,
  Investment, Reminder, Setting, ExportData,
} from './types';

const DB_NAME = 'KuberaVaultDB';
const DB_VERSION = 1;

const defaultCategories: { income: Category[]; expense: Category[] } = {
  income: [
    { id: 'salary', name: 'Salario', color: '#059669', icon: 'briefcase', type: 'income' },
    { id: 'freelance', name: 'Freelance', color: '#10B981', icon: 'laptop', type: 'income' },
    { id: 'dividends', name: 'Dividendos', color: '#34D399', icon: 'trending-up', type: 'income' },
    { id: 'interest', name: 'Intereses', color: '#6EE7B7', icon: 'percent', type: 'income' },
    { id: 'sale', name: 'Venta', color: '#A7F3D0', icon: 'shopping-bag', type: 'income' },
    { id: 'gift', name: 'Regalo', color: '#BBF7D0', icon: 'gift', type: 'income' },
    { id: 'refund', name: 'Reembolso', color: '#D1FAE5', icon: 'rotate-ccw', type: 'income' },
    { id: 'other-income', name: 'Otro', color: '#059669', icon: 'plus', type: 'income' },
  ],
  expense: [
    { id: 'food', name: 'Alimentación', color: '#DC2626', icon: 'utensils', type: 'expense' },
    { id: 'transport', name: 'Transporte', color: '#EF4444', icon: 'car', type: 'expense' },
    { id: 'housing', name: 'Vivienda', color: '#F87171', icon: 'home', type: 'expense' },
    { id: 'services', name: 'Servicios', color: '#FCA5A5', icon: 'zap', type: 'expense' },
    { id: 'health', name: 'Salud', color: '#F87171', icon: 'heart', type: 'expense' },
    { id: 'education', name: 'Educación', color: '#F97316', icon: 'book', type: 'expense' },
    { id: 'entertainment', name: 'Entretenimiento', color: '#FB923C', icon: 'film', type: 'expense' },
    { id: 'shopping', name: 'Shopping', color: '#FBBF24', icon: 'shopping-cart', type: 'expense' },
    { id: 'subscriptions', name: 'Suscripciones', color: '#F59E0B', icon: 'repeat', type: 'expense' },
    { id: 'taxes', name: 'Impuestos', color: '#D97706', icon: 'file-text', type: 'expense' },
    { id: 'insurance', name: 'Seguros', color: '#B45309', icon: 'shield', type: 'expense' },
    { id: 'donations', name: 'Donaciones', color: '#92400E', icon: 'heart', type: 'expense' },
    { id: 'other-expense', name: 'Otro', color: '#DC2626', icon: 'plus', type: 'expense' },
  ],
};

const accountTypes = [
  { id: 'cash', name: 'Efectivo' },
  { id: 'checking', name: 'Cuenta Corriente' },
  { id: 'savings', name: 'Cuenta de Ahorros' },
  { id: 'investment', name: 'Cuenta de Inversión' },
  { id: 'digital-wallet', name: 'Billetera Digital' },
  { id: 'other', name: 'Otra' },
];

const debtTypes = [
  { id: 'personal', name: 'Préstamo Personal' },
  { id: 'mortgage', name: 'Hipoteca' },
  { id: 'auto', name: 'Crédito de Auto' },
  { id: 'credit-card', name: 'Deuda Tarjeta' },
  { id: 'family', name: 'Préstamo Familiar' },
  { id: 'other', name: 'Otro' },
];

const cardEntities = [
  { id: 'visa', name: 'Visa' },
  { id: 'mastercard', name: 'Mastercard' },
  { id: 'amex', name: 'American Express' },
  { id: 'other', name: 'Otra' },
];

const bankEntities = [
  { id: 'bcp', name: 'BCP' },
  { id: 'bbva', name: 'BBVA' },
  { id: 'interbank', name: 'Interbank' },
  { id: 'scotiabank', name: 'Scotiabank' },
  { id: 'banco-nacion', name: 'Banco de la Nación' },
  { id: 'pichincha', name: 'Banco Pichincha' },
  { id: 'gnb', name: 'GNB' },
  { id: 'falabella', name: 'Banco Falabella' },
  { id: 'ripley', name: 'Banco Ripley' },
  { id: 'hsbc', name: 'HSBC' },
  { id: 'santander', name: 'Santander' },
  { id: 'citibanamex', name: 'Citibanamex' },
  { id: 'inbursa', name: 'Inbursa' },
  { id: 'banorte', name: 'Banorte' },
  { id: 'bancolombia', name: 'Bancolombia' },
  { id: 'davivienda', name: 'Davivienda' },
  { id: 'itau', name: 'Itaú' },
  { id: 'bradesco', name: 'Bradesco' },
  { id: 'bancoestado', name: 'BancoEstado' },
  { id: 'chile', name: 'Banco de Chile' },
  { id: 'other', name: 'Otro' },
];

const accountColors = [
  '#2563EB', '#059669', '#DC2626', '#D97706', '#7C3AED',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#8B5CF6',
  '#14B8A6', '#EF4444', '#6366F1', '#F59E0B', '#10B981',
];

const investmentTypes = [
  { id: 'deposit', name: 'Depósito a Plazo' },
  { id: 'mutual-fund', name: 'Fondos Mutuos' },
  { id: 'stocks', name: 'Acciones' },
  { id: 'bonds', name: 'Bonos' },
  { id: 'crypto', name: 'Criptomonedas' },
  { id: 'real-estate', name: 'Bienes Raíces' },
  { id: 'life-insurance', name: 'Seguro de Vida' },
  { id: 'pension', name: 'Pensión/AFORE' },
  { id: 'other', name: 'Otro' },
];

const currencies = [
  { code: 'USD', symbol: '$', name: 'Dólar Americano' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano' },
  { code: 'COP', symbol: '$', name: 'Peso Colombiano' },
  { code: 'ARS', symbol: '$', name: 'Peso Argentino' },
  { code: 'CLP', symbol: '$', name: 'Peso Chileno' },
  { code: 'PEN', symbol: 'S/', name: 'Sol Peruano' },
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileño' },
  { code: 'GBP', symbol: '£', name: 'Libra Esterlina' },
  { code: 'JPY', symbol: '¥', name: 'Yen Japonés' },
  { code: 'CNY', symbol: '¥', name: 'Yuan Chino' },
  { code: 'CHF', symbol: 'Fr', name: 'Franco Suizo' },
];

type StoreName = 'accounts' | 'entries' | 'expenses' | 'debts' | 'creditCards' | 'investments' | 'categories' | 'reminders' | 'settings';

class DB {
  private db: IDBDatabase | null = null;
  private customCurrencies: typeof currencies = [];
  private nomenclatureCache: Array<{ code: string; title: string; categoryId: string; type: string; createdAt: string }> = [];

  readonly defaultCategories = defaultCategories;
  readonly accountTypes = accountTypes;
  readonly debtTypes = debtTypes;
  readonly cardEntities = cardEntities;
  readonly bankEntities = bankEntities;
  readonly investmentTypes = investmentTypes;
  readonly currencies = currencies;
  readonly accountColors = accountColors;

  async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;

        if (!database.objectStoreNames.contains('accounts')) {
          const store = database.createObjectStore('accounts', { keyPath: 'id', autoIncrement: true });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('currency', 'currency', { unique: false });
        }
        if (!database.objectStoreNames.contains('entries')) {
          const store = database.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('accountId', 'accountId', { unique: false });
        }
        if (!database.objectStoreNames.contains('expenses')) {
          const store = database.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('accountId', 'accountId', { unique: false });
        }
        if (!database.objectStoreNames.contains('debts')) {
          const store = database.createObjectStore('debts', { keyPath: 'id', autoIncrement: true });
          store.createIndex('type', 'type', { unique: false });
        }
        if (!database.objectStoreNames.contains('creditCards')) {
          const store = database.createObjectStore('creditCards', { keyPath: 'id', autoIncrement: true });
          store.createIndex('entity', 'entity', { unique: false });
        }
        if (!database.objectStoreNames.contains('investments')) {
          const store = database.createObjectStore('investments', { keyPath: 'id', autoIncrement: true });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('accountId', 'accountId', { unique: false });
        }
        if (!database.objectStoreNames.contains('categories')) {
          const store = database.createObjectStore('categories', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
        }
        if (!database.objectStoreNames.contains('reminders')) {
          const store = database.createObjectStore('reminders', { keyPath: 'id', autoIncrement: true });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('isActive', 'isActive', { unique: false });
        }
        if (!database.objectStoreNames.contains('settings')) {
          database.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async initDefaultData(): Promise<void> {
    const categoriesCount = await this.dbGetCount('categories');
    if (categoriesCount === 0) {
      for (const [type, cats] of Object.entries(defaultCategories)) {
        for (const cat of cats) {
          await this.dbAdd('categories', { ...cat, type });
        }
      }
    }

    const settingsCount = await this.dbGetCount('settings');
    if (settingsCount === 0) {
      await this.dbPut('settings', { key: 'currency', value: 'USD' });
      await this.dbPut('settings', { key: 'theme', value: 'light' });
      await this.dbPut('settings', { key: 'pinEnabled', value: false });
      await this.dbPut('settings', { key: 'autoLockMinutes', value: 15 });
      await this.dbPut('settings', { key: 'customCurrencies', value: JSON.stringify([]) });
      await this.dbPut('settings', { key: 'customCategories', value: JSON.stringify([]) });
    } else {
      const customCurrenciesSetting = await this.dbGet<{ value: string }>('settings', 'customCurrencies');
      if (customCurrenciesSetting) {
        this.customCurrencies = JSON.parse(customCurrenciesSetting.value);
      }
    }

    const nomenSetting = await this.dbGet<{ value: string }>('settings', 'nomenclatureCodes');
    if (nomenSetting) {
      this.nomenclatureCache = JSON.parse(nomenSetting.value);
    }
  }

  getDB(): IDBDatabase | null {
    return this.db;
  }

  private getTransaction(storeName: StoreName, mode: IDBTransactionMode = 'readonly'): IDBTransaction {
    if (!this.db) throw new Error('DB not initialized');
    return this.db.transaction(storeName, mode);
  }

  async dbGet<T>(storeName: StoreName, id: string | number): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      const tx = this.getTransaction(storeName);
      const req = tx.objectStore(storeName).get(id);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async dbGetAll<T>(storeName: StoreName): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const tx = this.getTransaction(storeName);
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  async dbGetByIndex<T>(storeName: StoreName, indexName: string, value: IDBValidKey): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const tx = this.getTransaction(storeName);
      const req = tx.objectStore(storeName).index(indexName).getAll(value);
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  async dbGetByDateRange<T extends { date: string }>(storeName: StoreName, startDate: string, endDate: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const tx = this.getTransaction(storeName);
      const index = tx.objectStore(storeName).index('date');
      const range = IDBKeyRange.bound(startDate, endDate);
      const req = index.getAll(range);
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  async dbAdd<T extends Record<string, unknown>>(storeName: StoreName, data: T): Promise<number> {
    return new Promise((resolve, reject) => {
      const tx = this.getTransaction(storeName, 'readwrite');
      const now = new Date().toISOString();
      const req = tx.objectStore(storeName).add({ ...data, createdAt: now, updatedAt: now } as T);
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  }

  async dbPut<T extends Record<string, unknown>>(storeName: StoreName, data: T): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        const tx = this.getTransaction(storeName, 'readwrite');
        const os = tx.objectStore(storeName);
        const entry = { ...data, updatedAt: new Date().toISOString() };
        const pk = os.keyPath as string | undefined;
        if (pk && entry[pk] === undefined && !os.autoIncrement) {
          entry[pk as keyof typeof entry] = Date.now() + Math.random() as never;
        }
        const clean = Object.fromEntries(
          Object.entries(entry).filter(([_, v]) => v !== undefined)
        );
        const req = os.put(clean as T);
        req.onsuccess = () => resolve(req.result as number);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async dbDelete(storeName: StoreName, id: string | number): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.getTransaction(storeName, 'readwrite');
      const req = tx.objectStore(storeName).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async dbGetCount(storeName: StoreName): Promise<number> {
    return new Promise((resolve, reject) => {
      const tx = this.getTransaction(storeName);
      const req = tx.objectStore(storeName).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async dbGetSetting(key: string): Promise<string | number | boolean | null> {
    const setting = await this.dbGet<{ key: string; value: string | number | boolean }>('settings', key);
    return setting ? setting.value : null;
  }

  async dbSetSetting(key: string, value: string | number | boolean): Promise<number> {
    return this.dbPut('settings', { key, value });
  }

  getAccountColors(): string[] {
    return this.accountColors;
  }

  getBankEntities(): Array<{ id: string; name: string }> {
    return this.bankEntities;
  }

  getAllCurrencies(): Array<{ code: string; symbol: string; name: string }> {
    return [...currencies, ...this.customCurrencies];
  }

  getCurrencyByCode(code: string): { code: string; symbol: string; name: string } {
    return this.getAllCurrencies().find(c => c.code === code) || currencies[0] || { code: 'USD', symbol: '$', name: 'Dólar Americano' };
  }

  async addCustomCurrency(currency: { code: string; symbol: string; name: string }): Promise<boolean> {
    if (!currencies.find(c => c.code === currency.code) && !this.customCurrencies.find(c => c.code === currency.code)) {
      this.customCurrencies = [...this.customCurrencies, currency];
      await this.dbSetSetting('customCurrencies', JSON.stringify(this.customCurrencies));
      return true;
    }
    return false;
  }

  async updateCustomCurrency(oldCode: string, newCurrency: { code: string; symbol: string; name: string }): Promise<boolean> {
    const index = this.customCurrencies.findIndex(c => c.code === oldCode);
    if (index !== -1) {
      this.customCurrencies = this.customCurrencies.map(c => c.code === oldCode ? newCurrency : c);
      await this.dbSetSetting('customCurrencies', JSON.stringify(this.customCurrencies));
      return true;
    }
    return false;
  }

  async deleteCustomCurrency(code: string): Promise<boolean> {
    const filtered = this.customCurrencies.filter(c => c.code !== code);
    if (filtered.length !== this.customCurrencies.length) {
      this.customCurrencies = filtered;
      await this.dbSetSetting('customCurrencies', JSON.stringify(this.customCurrencies));
      return true;
    }
    return false;
  }

  async getCustomCategories(): Promise<Category[]> {
    const setting = await this.dbGet<{ key: string; value: string }>('settings', 'customCategories');
    return setting ? JSON.parse(setting.value) : [];
  }

  async addCustomCategory(category: Category): Promise<boolean> {
    const customCats = await this.getCustomCategories();
    const exists = customCats.find(c => c.id === category.id);
    if (!exists) {
      await this.dbSetSetting('customCategories', JSON.stringify([...customCats, category]));
      return true;
    }
    return false;
  }

  async updateCustomCategory(id: string, updates: Partial<Category>): Promise<boolean> {
    const customCats = await this.getCustomCategories();
    const index = customCats.findIndex(c => c.id === id);
    const existing = customCats[index];
    if (existing) {
      customCats[index] = { ...existing, ...updates };
      await this.dbSetSetting('customCategories', JSON.stringify(customCats));
      return true;
    }
    return false;
  }

  async updateBuiltInCategory(id: string, updates: Partial<Category>): Promise<boolean> {
    const existing = await this.dbGet<Category>('categories', id);
    if (existing) {
      await this.dbPut('categories', { ...existing, ...updates, id });
      return true;
    }
    return false;
  }

  async deleteCustomCategory(id: string): Promise<void> {
    const customCats = await this.getCustomCategories();
    const filtered = customCats.filter(c => c.id !== id);
    await this.dbSetSetting('customCategories', JSON.stringify(filtered));
  }

  async getNomenclatureCodes(): Promise<Array<{ code: string; title: string; categoryId: string; type: string; createdAt: string }>> {
    const setting = await this.dbGet<{ key: string; value: string }>('settings', 'nomenclatureCodes');
    return setting ? JSON.parse(setting.value) : [];
  }

  getNomenclatureCodesSync(): Array<{ code: string; title: string; categoryId: string; type: string; createdAt: string }> {
    return this.nomenclatureCache;
  }

  async saveNomenclatureCode(code: string, title: string, categoryId: string, type: string): Promise<Array<{ code: string; title: string; categoryId: string; type: string; createdAt: string }>> {
    const codes = await this.getNomenclatureCodes();
    const exists = codes.find(c => c.code === code);
    if (!exists) {
      const updated = [{ code, title, categoryId, type, createdAt: new Date().toISOString() }, ...codes].slice(0, 50);
      await this.dbSetSetting('nomenclatureCodes', JSON.stringify(updated));
      this.nomenclatureCache = updated;
      return updated;
    }
    return codes;
  }

  async exportAllData(): Promise<ExportData> {
    const [settings, accounts, entries, expenses, debts, creditCards, investments, categories, reminders] = await Promise.all([
      this.dbGetAll<Setting>('settings'),
      this.dbGetAll<Account>('accounts'),
      this.dbGetAll<Entry>('entries'),
      this.dbGetAll<Expense>('expenses'),
      this.dbGetAll<Debt>('debts'),
      this.dbGetAll<CreditCard>('creditCards'),
      this.dbGetAll<Investment>('investments'),
      this.dbGetAll<Category>('categories'),
      this.dbGetAll<Reminder>('reminders'),
    ]);
    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      settings, accounts, entries, expenses, debts,
      creditCards, investments, categories, reminders,
    };
  }

  async importData(data: ExportData): Promise<void> {
    if (data.settings) {
      for (const setting of data.settings) {
        const clean = { key: setting.key, value: setting.value };
        await this.dbPut('settings', clean as unknown as Setting);
      }
    }
    const stores: StoreName[] = ['accounts', 'entries', 'expenses', 'debts', 'creditCards', 'investments', 'categories', 'reminders'];
    for (const store of stores) {
      const items = data[store];
      if (items) {
        for (const item of items) {
          const clean = Object.fromEntries(
            Object.entries(item).filter(([_, v]) => v !== undefined)
          );
          await this.dbPut(store, clean as Record<string, unknown>);
        }
      }
    }
  }

  async clearAllData(): Promise<void> {
    const stores: StoreName[] = ['accounts', 'entries', 'expenses', 'debts', 'creditCards', 'investments', 'categories', 'reminders', 'settings'];
    for (const storeName of stores) {
      if (!this.db) throw new Error('DB not initialized');
      await new Promise<void>((resolve, reject) => {
        const tx = this.db!.transaction(storeName, 'readwrite');
        const req = tx.objectStore(storeName).clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  }

  async calculateStorageSize(): Promise<number> {
    let totalSize = 0;
    const stores: StoreName[] = ['accounts', 'entries', 'expenses', 'debts', 'creditCards', 'investments', 'categories', 'reminders'];
    for (const storeName of stores) {
      const data = await this.dbGetAll(storeName);
      totalSize += JSON.stringify(data).length;
    }
    return totalSize;
  }
}

export const db = new DB();
