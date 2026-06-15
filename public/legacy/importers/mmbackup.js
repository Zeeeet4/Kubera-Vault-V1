/**
 * Conversor de archivos .mmbackup (Money Manager) a formato Kubera Vault.
 * Usa sql.js para parsear la base de datos SQLite en el navegador.
 */

let _SQL = null;

function initSqlJsLib() {
    if (_SQL) return Promise.resolve(_SQL);
    return new Promise(function(resolve, reject) {
        function doInit() {
            window.initSqlJs({
                locateFile: function(file) { return 'vendor/' + file; }
            }).then(function(SQL) {
                _SQL = SQL;
                resolve(SQL);
            }).catch(reject);
        }

        if (window.initSqlJs) {
            doInit();
            return;
        }
        const script = document.createElement('script');
        script.src = 'vendor/sql-wasm.js';
        script.onload = doInit;
        script.onerror = function() { reject(new Error('Error cargando sql.js')); };
        document.head.appendChild(script);
    });
}

let _JSZip = null;

function initJSZip() {
    if (_JSZip) return Promise.resolve(_JSZip);
    return new Promise(function(resolve, reject) {
        if (window.JSZip) {
            _JSZip = window.JSZip;
            resolve(window.JSZip);
            return;
        }
        const script = document.createElement('script');
        script.src = 'vendor/jszip.min.js';
        script.onload = function() {
            _JSZip = window.JSZip;
            resolve(window.JSZip);
        };
        script.onerror = function() { reject(new Error('Error cargando JSZip')); };
        document.head.appendChild(script);
    });
}

const DEFAULT_CATEGORY_NAMES = {
    'DefaultHome':       { name: 'Hogar',       icon: 'home' },
    'DefaultCafe':       { name: 'Cafe',        icon: 'coffee' },
    'DefaultFamily':     { name: 'Familia',     icon: 'users' },
    'DefaultEducation':  { name: 'Educacion',   icon: 'book' },
    'DefaultSport':      { name: 'Deporte',     icon: 'activity' },
    'DefaultTransport':  { name: 'Transporte',  icon: 'car' },
    'DefaultLeisure':    { name: 'Ocio',        icon: 'film' },
    'DefaultProducts':   { name: 'Productos',   icon: 'shopping-cart' },
    'DefaultPresents':   { name: 'Regalos',     icon: 'gift' },
    'DefaultHealth':     { name: 'Salud',       icon: 'heart' },
    'DefaultPercents':   { name: 'Intereses',   icon: 'percent' },
    'DefaultPresent':    { name: 'Regalo',      icon: 'gift' },
    'DefaultSalary':     { name: 'Salario',     icon: 'briefcase' },
    'other_expense':     { name: 'Otro Gasto',  icon: 'plus' },
    'other_income':      { name: 'Otro Ingreso',icon: 'plus' },
};

function intColorToHex(colorInt) {
    if (colorInt == null) return '#6B7280';
    const r = (colorInt >> 16) & 0xFF;
    const g = (colorInt >> 8) & 0xFF;
    const b = colorInt & 0xFF;
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function convertMmbackupToKuberaVault(file) {
    let db = null;

    try {
        // 1. Leer archivo, saltar header de 8 bytes
        const buffer = await file.arrayBuffer();
        const headerView = new Uint8Array(buffer, 0, 8);
        const expectedHeader = [8, 8, 8, 8, 8, 8, 8, 8];
        for (let i = 0; i < 8; i++) {
            if (headerView[i] !== expectedHeader[i]) {
                throw new Error('Formato .mmbackup no reconocido');
            }
        }

        // 2. Extraer ZIP
        const zipData = buffer.slice(8);
        const JSZip = await initJSZip();
        const zip = await JSZip.loadAsync(zipData);

        const dbFile = zip.file('MyFinance.db');
        if (!dbFile) throw new Error('No se encontro MyFinance.db en el backup');

        const dbData = await dbFile.async('uint8array');
        const SQL = await initSqlJsLib();

        // 3. Cargar la base de datos SQLite
        db = new SQL.Database(dbData);

        // ── Leer todas las tablas ──

        function query(sql, params) {
            try {
                const stmt = db.prepare(sql);
                if (params) stmt.bind(params);
                const rows = [];
                while (stmt.step()) {
                    rows.push(stmt.getAsObject());
                }
                stmt.free();
                return rows;
            } catch (e) {
                return [];
            }
        }

        const transactions = query(
            'SELECT uid, type, amountInDefaultCurrency, amountInRealCurrency, ' +
            'realCurrencyCode, amountInAccountCurrency, accountCurrencyCode, ' +
            'date, comment FROM "transaction" WHERE isRemoved = 0'
        );

        const accounts = query(
            'SELECT uid, title, icon, color, currencyCode, comment FROM account WHERE isRemoved = 0'
        );

        const balances = {};
        query('SELECT uid, value FROM account_balance').forEach(r => { balances[r.uid] = r.value; });

        const categories = query(
            'SELECT uid, title, type, color, icon FROM category WHERE isRemoved = 0'
        );

        const tags = {};
        query('SELECT uid, name FROM tag WHERE isRemoved = 0').forEach(r => { tags[r.uid] = r.name; });

        const links = query(
            'SELECT entityType, entityUid, otherType, otherUid FROM sync_link WHERE isRemoved = 0'
        );

        const syncSettings = query(
            'SELECT uid, value, type FROM syncable_settings WHERE isRemoved = 0'
        );

        // ── Relaciones ──
        const txRelations = {};
        links.forEach(function(link) {
            if (link.entityType === 'Transaction') {
                if (!txRelations[link.entityUid]) {
                    txRelations[link.entityUid] = { accountUid: null, categoryUid: null, tagUids: [] };
                }
                if (link.otherType === 'Account') {
                    txRelations[link.entityUid].accountUid = link.otherUid;
                } else if (link.otherType === 'Category') {
                    txRelations[link.entityUid].categoryUid = link.otherUid;
                } else if (link.otherType === 'Tag') {
                    txRelations[link.entityUid].tagUids.push(link.otherUid);
                }
            }
        });

        // ── Categorías ──
        const finCategories = [];
        const catUidToFfId = {};

        categories.forEach(function(cat) {
            const uid = cat.uid;
            const ffType = cat.type === 'Income' ? 'income' : 'expense';
            let catName, catIcon;

            if (DEFAULT_CATEGORY_NAMES[uid]) {
                catName = DEFAULT_CATEGORY_NAMES[uid].name;
                catIcon = DEFAULT_CATEGORY_NAMES[uid].icon;
            } else if (cat.title) {
                catName = cat.title;
                catIcon = 'plus';
            } else {
                catName = uid;
                catIcon = 'plus';
            }

            const ffId = (uid.startsWith('Default') || uid === 'other_expense' || uid === 'other_income')
                ? uid
                : 'mm-import-' + uid.substring(0, 8);

            catUidToFfId[uid] = ffId;

            finCategories.push({
                id: ffId,
                name: catName,
                color: intColorToHex(cat.color),
                icon: catIcon,
                type: ffType,
            });
        });

        // ── Cuentas ──
        const finAccounts = [];
        const accountUidToFfId = {};

        accounts.forEach(function(acc, i) {
            const ffId = i + 1; // IDs numericos para compatibilidad con Kubera Vault
            accountUidToFfId[acc.uid] = ffId;

            const baseBalance = balances[acc.uid] || 0;
            const baseBalanceDecimal = Math.round(baseBalance / 100 * 100) / 100;

            finAccounts.push({
                id: ffId,
                name: acc.title || 'Cuenta Principal',
                type: 'checking',
                balance: baseBalanceDecimal,
                baseBalance: baseBalanceDecimal,
                currency: acc.currencyCode || 'USD',
                color: intColorToHex(acc.color),
                comment: acc.comment || '',
            });
        });

        // ── Transacciones ──
        const finEntries = [];
        const finExpenses = [];

        transactions.forEach(function(tx) {
            const rel = txRelations[tx.uid] || {};
            const catUid = rel.categoryUid || (tx.type === 'Expense' ? 'other_expense' : 'other_income');
            const accUid = rel.accountUid || 'main';

            const ffCategoryId = catUidToFfId[catUid] || catUid;
            const ffAccountId = accountUidToFfId[accUid] || accUid;

            const rawAmount = tx.amountInAccountCurrency || tx.amountInDefaultCurrency || 0;
            const amount = Math.round(rawAmount / 100 * 100) / 100;

            const tagNames = (rel.tagUids || [])
                .map(function(t) { return tags[t]; })
                .filter(Boolean);

            const commentParts = [];
            if (tx.comment) commentParts.push(tx.comment);
            if (tagNames.length > 0) commentParts.push('[Tags: ' + tagNames.join(', ') + ']');
            const comment = commentParts.join(' | ');

            const item = {
                amount: amount,
                date: tx.date,
                category: ffCategoryId,
                accountId: ffAccountId,
                description: comment,
                comment: comment,
                currency: tx.accountCurrencyCode || tx.realCurrencyCode || 'USD',
            };

            if (tx.type === 'Income') {
                finEntries.push(item);
            } else {
                finExpenses.push(item);
            }
        });

        // ── Settings ──
        const finSettings = [];

        syncSettings.forEach(function(row) {
            if (row.uid === 'v') return;
            finSettings.push({ key: row.uid, value: row.value });
        });

        const requiredDefaults = [
            { key: 'currency', value: 'USD' },
            { key: 'theme', value: 'dark' },
            { key: 'pinEnabled', value: false },
            { key: 'autoLockMinutes', value: 15 },
            { key: 'customCurrencies', value: '[]' },
            { key: 'customCategories', value: '[]' },
        ];

        // Establecer currency desde defaultCurrencyCode si existe
        const defCurr = finSettings.find(function(s) { return s.key === 'defaultCurrencyCode'; });
        if (defCurr) {
            var cIdx = requiredDefaults.findIndex(function(s) { return s.key === 'currency'; });
            if (cIdx >= 0) requiredDefaults[cIdx].value = defCurr.value;
        }

        requiredDefaults.forEach(function(def) {
            if (!finSettings.find(function(s) { return s.key === def.key; })) {
                finSettings.push(def);
            }
        });

        // ── Resultado ──
        return {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            source: 'Money Manager (.mmbackup)',
            settings: finSettings,
            accounts: finAccounts,
            entries: finEntries,
            expenses: finExpenses,
            debts: [],
            creditCards: [],
            investments: [],
            categories: finCategories,
            reminders: [],
        };

    } finally {
        if (db) db.close();
    }
}

window.MmbackupImporter = {
    convertMmbackupToKuberaVault: convertMmbackupToKuberaVault
};
