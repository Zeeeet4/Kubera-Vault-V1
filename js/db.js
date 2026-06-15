const DB_NAME = 'KuberaVaultDB';
const DB_VERSION = 1;

let db = null;

const defaultCategories = {
    income: [
        { id: 'salary', name: 'Salario', color: '#059669', icon: 'briefcase' },
        { id: 'freelance', name: 'Freelance', color: '#10B981', icon: 'laptop' },
        { id: 'dividends', name: 'Dividendos', color: '#34D399', icon: 'trending-up' },
        { id: 'interest', name: 'Intereses', color: '#6EE7B7', icon: 'percent' },
        { id: 'sale', name: 'Venta', color: '#A7F3D0', icon: 'shopping-bag' },
        { id: 'gift', name: 'Regalo', color: '#BBF7D0', icon: 'gift' },
        { id: 'refund', name: 'Reembolso', color: '#D1FAE5', icon: 'rotate-ccw' },
        { id: 'other-income', name: 'Otro', color: '#059669', icon: 'plus' }
    ],
    expense: [
        { id: 'food', name: 'Alimentación', color: '#DC2626', icon: 'utensils' },
        { id: 'transport', name: 'Transporte', color: '#EF4444', icon: 'car' },
        { id: 'housing', name: 'Vivienda', color: '#F87171', icon: 'home' },
        { id: 'services', name: 'Servicios', color: '#FCA5A5', icon: 'zap' },
        { id: 'health', name: 'Salud', color: '#F87171', icon: 'heart' },
        { id: 'education', name: 'Educación', color: '#F97316', icon: 'book' },
        { id: 'entertainment', name: 'Entretenimiento', color: '#FB923C', icon: 'film' },
        { id: 'shopping', name: 'Shopping', color: '#FBBF24', icon: 'shopping-cart' },
        { id: 'subscriptions', name: 'Suscripciones', color: '#F59E0B', icon: 'repeat' },
        { id: 'taxes', name: 'Impuestos', color: '#D97706', icon: 'file-text' },
        { id: 'insurance', name: 'Seguros', color: '#B45309', icon: 'shield' },
        { id: 'donations', name: 'Donaciones', color: '#92400E', icon: 'heart' },
        { id: 'other-expense', name: 'Otro', color: '#DC2626', icon: 'plus' }
    ]
};

const accountTypes = [
    { id: 'cash', name: 'Efectivo' },
    { id: 'checking', name: 'Cuenta Corriente' },
    { id: 'savings', name: 'Cuenta de Ahorros' },
    { id: 'investment', name: 'Cuenta de Inversión' },
    { id: 'digital-wallet', name: 'Billetera Digital' },
    { id: 'other', name: 'Otra' }
];

const debtTypes = [
    { id: 'personal', name: 'Préstamo Personal' },
    { id: 'mortgage', name: 'Hipoteca' },
    { id: 'auto', name: 'Crédito de Auto' },
    { id: 'credit-card', name: 'Deuda Tarjeta' },
    { id: 'family', name: 'Préstamo Familiar' },
    { id: 'other', name: 'Otro' }
];

const cardEntities = [
    { id: 'visa', name: 'Visa' },
    { id: 'mastercard', name: 'Mastercard' },
    { id: 'amex', name: 'American Express' },
    { id: 'other', name: 'Otra' }
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
    { id: 'other', name: 'Otro' }
];

const accountColors = [
    '#2563EB', '#059669', '#DC2626', '#D97706', '#7C3AED',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#8B5CF6',
    '#14B8A6', '#EF4444', '#6366F1', '#F59E0B', '#10B981'
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
    { id: 'other', name: 'Otro' }
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
    { code: 'CHF', symbol: 'Fr', name: 'Franco Suizo' }
];

let customCurrencies = [];

async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            
            if (!database.objectStoreNames.contains('accounts')) {
                const accountsStore = database.createObjectStore('accounts', { keyPath: 'id', autoIncrement: true });
                accountsStore.createIndex('type', 'type', { unique: false });
                accountsStore.createIndex('currency', 'currency', { unique: false });
            }
            
            if (!database.objectStoreNames.contains('entries')) {
                const entriesStore = database.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
                entriesStore.createIndex('date', 'date', { unique: false });
                entriesStore.createIndex('category', 'category', { unique: false });
                entriesStore.createIndex('accountId', 'accountId', { unique: false });
            }
            
            if (!database.objectStoreNames.contains('expenses')) {
                const expensesStore = database.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
                expensesStore.createIndex('date', 'date', { unique: false });
                expensesStore.createIndex('category', 'category', { unique: false });
                expensesStore.createIndex('accountId', 'accountId', { unique: false });
            }
            
            if (!database.objectStoreNames.contains('debts')) {
                const debtsStore = database.createObjectStore('debts', { keyPath: 'id', autoIncrement: true });
                debtsStore.createIndex('type', 'type', { unique: false });
            }
            
            if (!database.objectStoreNames.contains('creditCards')) {
                const cardsStore = database.createObjectStore('creditCards', { keyPath: 'id', autoIncrement: true });
                cardsStore.createIndex('entity', 'entity', { unique: false });
            }
            
            if (!database.objectStoreNames.contains('investments')) {
                const investmentsStore = database.createObjectStore('investments', { keyPath: 'id', autoIncrement: true });
                investmentsStore.createIndex('type', 'type', { unique: false });
                investmentsStore.createIndex('accountId', 'accountId', { unique: false });
            }
            
            if (!database.objectStoreNames.contains('categories')) {
                const categoriesStore = database.createObjectStore('categories', { keyPath: 'id' });
                categoriesStore.createIndex('type', 'type', { unique: false });
            }
            
            if (!database.objectStoreNames.contains('reminders')) {
                const remindersStore = database.createObjectStore('reminders', { keyPath: 'id', autoIncrement: true });
                remindersStore.createIndex('date', 'date', { unique: false });
                remindersStore.createIndex('isActive', 'isActive', { unique: false });
            }
            
            if (!database.objectStoreNames.contains('settings')) {
                database.createObjectStore('settings', { keyPath: 'key' });
            }
        };
    });
}

async function initDefaultData() {
    const categoriesCount = await dbGetCount('categories');
    if (categoriesCount === 0) {
        for (const [type, cats] of Object.entries(defaultCategories)) {
            for (const cat of cats) {
                await dbAdd('categories', { ...cat, type });
            }
        }
    }
    
    const settingsCount = await dbGetCount('settings');
    if (settingsCount === 0) {
        await dbPut('settings', { key: 'currency', value: 'USD' });
        await dbPut('settings', { key: 'theme', value: 'light' });
        await dbPut('settings', { key: 'pinEnabled', value: false });
        await dbPut('settings', { key: 'autoLockMinutes', value: 15 });
        await dbPut('settings', { key: 'customCurrencies', value: JSON.stringify([]) });
        await dbPut('settings', { key: 'customCategories', value: JSON.stringify([]) });
    } else {
        const customCurrenciesSetting = await dbGet('settings', 'customCurrencies');
        if (customCurrenciesSetting) {
            customCurrencies = JSON.parse(customCurrenciesSetting.value);
        }
    }
    
    // Load nomenclature codes cache
    const nomenSetting = await dbGet('settings', 'nomenclatureCodes');
    if (nomenSetting) {
        _nomenclatureCache = JSON.parse(nomenSetting.value);
    }
}

function getAllCurrencies() {
    return [...currencies, ...customCurrencies];
}

function getCurrencyByCode(code) {
    return getAllCurrencies().find(c => c.code === code) || currencies[0];
}

async function addCustomCurrency(currency) {
    if (!currencies.find(c => c.code === currency.code) && !customCurrencies.find(c => c.code === currency.code)) {
        customCurrencies.push(currency);
        await dbSetSetting('customCurrencies', JSON.stringify(customCurrencies));
        return true;
    }
    return false;
}

async function updateCustomCurrency(oldCode, newCurrency) {
    const index = customCurrencies.findIndex(c => c.code === oldCode);
    if (index !== -1) {
        customCurrencies[index] = newCurrency;
        await dbSetSetting('customCurrencies', JSON.stringify(customCurrencies));
        return true;
    }
    return false;
}

async function deleteCustomCurrency(code) {
    const index = customCurrencies.findIndex(c => c.code === code);
    if (index !== -1) {
        customCurrencies.splice(index, 1);
        await dbSetSetting('customCurrencies', JSON.stringify(customCurrencies));
        return true;
    }
    return false;
}

async function addCustomCategory(category) {
    const customCats = await getCustomCategories();
    const exists = customCats.find(c => c.id === category.id);
    if (!exists) {
        customCats.push(category);
        await dbSetSetting('customCategories', JSON.stringify(customCats));
        await store.refreshCategories();
        return true;
    }
    return false;
}

async function getCustomCategories() {
    const setting = await dbGet('settings', 'customCategories');
    return setting ? JSON.parse(setting.value) : [];
}

async function updateCustomCategory(id, updates) {
    const customCats = await getCustomCategories();
    const index = customCats.findIndex(c => c.id === id);
    if (index !== -1) {
        customCats[index] = { ...customCats[index], ...updates };
        await dbSetSetting('customCategories', JSON.stringify(customCats));
        return true;
    }
    return false;
}

async function updateBuiltInCategory(id, updates) {
    const existing = await dbGet('categories', id);
    if (existing) {
        const updated = { ...existing, ...updates, id };
        await dbPut('categories', updated);
        return true;
    }
    return false;
}

async function deleteCustomCategory(id) {
    const customCats = await getCustomCategories();
    const filtered = customCats.filter(c => c.id !== id);
    await dbSetSetting('customCategories', JSON.stringify(filtered));
}

async function getNomenclatureCodes() {
    const setting = await dbGet('settings', 'nomenclatureCodes');
    return setting ? JSON.parse(setting.value) : [];
}

async function saveNomenclatureCode(code, title, categoryId, type) {
    const codes = await getNomenclatureCodes();
    const exists = codes.find(c => c.code === code);
    if (!exists) {
        codes.unshift({ code, title, categoryId, type, createdAt: new Date().toISOString() });
        if (codes.length > 50) codes.length = 50;
        await dbSetSetting('nomenclatureCodes', JSON.stringify(codes));
        _nomenclatureCache = codes;
    }
    return codes;
}

function getNomenclatureCodesSync() {
    // Synchronous cache - populated by initDefaultData and refreshed on save
    return _nomenclatureCache || [];
}

let _nomenclatureCache = [];

async function dbGet(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function dbGetAll(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function dbGetByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function dbAdd(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        data.createdAt = new Date().toISOString();
        data.updatedAt = new Date().toISOString();
        const request = store.add(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function dbPut(storeName, data) {
    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            data.updatedAt = new Date().toISOString();
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } catch (err) {
            reject(err);
        }
    });
}

async function dbDelete(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function dbGetCount(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function dbGetByDateRange(storeName, startDate, endDate) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index('date');
        const range = IDBKeyRange.bound(startDate, endDate);
        const request = index.getAll(range);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function dbGetSetting(key) {
    const setting = await dbGet('settings', key);
    return setting ? setting.value : null;
}

async function dbSetSetting(key, value) {
    return dbPut('settings', { key, value });
}

async function exportAllData() {
    const data = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        settings: await dbGetAll('settings'),
        accounts: await dbGetAll('accounts'),
        entries: await dbGetAll('entries'),
        expenses: await dbGetAll('expenses'),
        debts: await dbGetAll('debts'),
        creditCards: await dbGetAll('creditCards'),
        investments: await dbGetAll('investments'),
        categories: await dbGetAll('categories'),
        reminders: await dbGetAll('reminders')
    };
    return data;
}

async function importData(data) {
    if (data.settings) {
        for (const setting of data.settings) {
            await dbPut('settings', setting);
        }
    }
    
    const stores = ['accounts', 'entries', 'expenses', 'debts', 'creditCards', 'investments', 'categories', 'reminders'];
    for (const store of stores) {
        if (data[store]) {
            for (const item of data[store]) {
                await dbPut(store, item);
            }
        }
    }
}

async function clearAllData() {
    const stores = ['accounts', 'entries', 'expenses', 'debts', 'creditCards', 'investments', 'categories', 'reminders', 'settings'];
    for (const storeName of stores) {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        await new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

async function calculateStorageSize() {
    let totalSize = 0;
    const stores = ['accounts', 'entries', 'expenses', 'debts', 'creditCards', 'investments', 'categories', 'reminders'];
    for (const storeName of stores) {
        const data = await dbGetAll(storeName);
        totalSize += JSON.stringify(data).length;
    }
    return totalSize;
}

window.DB = {
    initDB,
    initDefaultData,
    db,
    dbGet,
    dbGetAll,
    dbGetByIndex,
    dbAdd,
    dbPut,
    dbDelete,
    dbGetCount,
    dbGetByDateRange,
    dbGetSetting,
    dbSetSetting,
    exportAllData,
    importData,
    clearAllData,
    calculateStorageSize,
    defaultCategories,
    accountTypes,
    debtTypes,
    cardEntities,
    bankEntities,
    investmentTypes,
    currencies,
    getAllCurrencies,
    getCurrencyByCode,
    addCustomCurrency,
    updateCustomCurrency,
    deleteCustomCurrency,
    addCustomCategory,
    getCustomCategories,
    updateCustomCategory,
    updateBuiltInCategory,
    deleteCustomCategory,
    getNomenclatureCodes,
    getNomenclatureCodesSync,
    saveNomenclatureCode,
    customCurrencies,
    getBankEntities,
    getAccountColors
};

function getBankEntities() {
    return bankEntities;
}

function getAccountColors() {
    return accountColors;
}
