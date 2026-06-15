async function saveColorSettings() {
    try {
        const incomeColor = document.getElementById('incomeColor')?.value || '#059669';
        const expenseColor = document.getElementById('expenseColor')?.value || '#DC2626';
        const debtColor = document.getElementById('debtColor')?.value || '#DC2626';
        const investmentColor = document.getElementById('investmentColor')?.value || '#7C3AED';

        await DB.dbSetSetting('incomeColor', incomeColor);
        await DB.dbSetSetting('expenseColor', expenseColor);
        await DB.dbSetSetting('debtColor', debtColor);
        await DB.dbSetSetting('investmentColor', investmentColor);

        store.state.settings.incomeColor = incomeColor;
        store.state.settings.expenseColor = expenseColor;
        store.state.settings.debtColor = debtColor;
        store.state.settings.investmentColor = investmentColor;

        document.documentElement.style.setProperty('--income-color', incomeColor);
        document.documentElement.style.setProperty('--expense-color', expenseColor);
        document.documentElement.style.setProperty('--debt-color', debtColor);
        document.documentElement.style.setProperty('--investment-color', investmentColor);

        window._originalColors = { incomeColor, expenseColor, debtColor, investmentColor };

        hideSaveBar();
        toast.success('Colores guardados');
    } catch (err) {
        toast.error('Error al guardar colores');
    }
}

async function addAccountColor() {
    const color = document.getElementById('newAccountColor')?.value;
    if (!color) return;

    const colors = JSON.parse(store.state.settings.accountColors || '[]');
    if (!colors.includes(color)) {
        await DB.dbSetSetting('accountColors', JSON.stringify([...colors, color]));
        store.state.settings.accountColors = JSON.stringify([...colors, color]);
        toast.success('Color agregado');
        renderSettings();
    }
}

async function saveCustomCurrency() {
    const code = document.getElementById('currencyCode').value.toUpperCase();
    const symbol = document.getElementById('currencySymbol').value;
    const name = document.getElementById('currencyName').value;

    if (!code || !symbol || !name) {
        toast.error('Completa todos los campos');
        return;
    }

    const success = await DB.addCustomCurrency({ code, symbol, name });
    if (success) {
        modal.close();
        toast.success('Moneda agregada');
        renderSettings();
    } else {
        toast.error('Esta moneda ya existe');
    }
}

async function updateSetting(key, value) {
    try {
        await DB.dbSetSetting(key, value);
        store.state.settings[key] = value;
    } catch (error) {
        toast.error('Error al guardar');
    }
}

async function exportAllData() {
    try {
        const data = await DB.exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `kubera-vault-backup-${new Date().toISOString().split('T')[0]}.json`);
        toast.success('Backup exportado');
    } catch (error) {
        toast.error('Error al exportar');
    }
}

async function doImport(data) {
    await DB.clearAllData();
    await DB.importData(data);
    await store.loadAllData();
    router.navigate('dashboard');
    toast.success('Datos importados correctamente');
}

async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
        const isMmbackup = file.name.toLowerCase().endsWith('.mmbackup');
        let data;

        if (isMmbackup) {
            toast.info('Convirtiendo archivo Money Manager...', 6000);
            try {
                data = await MmbackupImporter.convertMmbackupToKuberaVault(file);
            } catch (convErr) {
                toast.error('Error al convertir: ' + convErr.message + '. Usa el script Python como alternativa.');
                event.target.value = '';
                return;
            }
            const ingresos = data.entries ? data.entries.length : 0;
            const gastos = data.expenses ? data.expenses.length : 0;
            window.confirmDialog(
                'Se importarán ' + ingresos + ' ingresos y ' + gastos + ' gastos. Se reemplazarán los datos actuales. ¿Continuar?',
                async () => { await doImport(data); window.modal.close(); },
                { confirmText: 'Importar', confirmClass: 'btn-primary' }
            );
            event.target.value = '';
        } else {
            const text = await file.text();
            data = JSON.parse(text);
            if (!data || typeof data !== 'object') {
                toast.error('Archivo JSON inválido');
                event.target.value = '';
                return;
            }
            const validStores = ['accounts', 'entries', 'expenses', 'debts', 'creditCards', 'investments', 'categories', 'reminders', 'settings'];
            const hasData = validStores.some(s => Array.isArray(data[s]) && data[s].length > 0);
            if (!hasData) {
                toast.error('El archivo no contiene datos válidos');
                event.target.value = '';
                return;
            }
            window.confirmDialog(
                'Importar datos? Se reemplazarán los actuales.',
                async () => { await doImport(data); window.modal.close(); },
                { confirmText: 'Importar', confirmClass: 'btn-primary' }
            );
            event.target.value = '';
        }
    } catch (error) {
        toast.error('Error al importar: ' + error.message);
        event.target.value = '';
    }
}

async function migrateFromFinanceFlow() {
    window.confirmDialog('Migrar datos desde FinanceFlowDB? Esto fusionará los datos antiguos con los actuales.', async () => {
        try {
            const oldDbRequest = indexedDB.open('FinanceFlowDB', 1);
            oldDbRequest.onsuccess = async (e) => {
                const oldDb = e.target.result;
                const stores = Array.from(oldDb.objectStoreNames);
                let migrated = 0;

                for (const storeName of stores) {
                    if (['entries', 'expenses', 'accounts', 'debts', 'creditCards', 'investments'].includes(storeName)) {
                        const items = await new Promise(resolve => {
                            const tx = oldDb.transaction(storeName, 'readonly');
                            const store = tx.objectStore(storeName);
                            const req = store.getAll();
                            req.onsuccess = () => resolve(req.result);
                        });

                        for (const item of items) {
                            try {
                                await DB.dbAdd(storeName, item);
                                migrated++;
                            } catch (err) {
                                console.error('Error migrating', storeName, item, err);
                            }
                        }
                    }
                }

                oldDb.close();
                await store.loadAllData();
                router.navigate('dashboard');
                window.modal.close();
                toast.success(`Migración completada: ${migrated} registros importados`);
            };
            oldDbRequest.onerror = (err) => {
                window.modal.close();
                toast.error('No se encontró FinanceFlowDB');
                console.error(err);
            };
        } catch (error) {
            window.modal.close();
            console.error('Migration error:', error);
            toast.error('Error en migración: ' + error.message);
        }
    });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function testCategoryDB() {
    const output = document.getElementById('debugOutput');
    try {
        output.textContent = 'Testing DB write...\n';

        const testCat = {
            id: 'test-cat-' + Date.now(),
            name: 'Test Category ' + Date.now(),
            color: '#2563EB',
            type: 'income',
            isCustom: true
        };

        output.textContent += 'Adding: ' + JSON.stringify(testCat) + '\n';
        const result = await DB.addCustomCategory(testCat);
        output.textContent += 'addCustomCategory result: ' + result + '\n';

        const customCats = await DB.getCustomCategories();
        output.textContent += 'getCustomCategories count: ' + customCats.length + '\n';
        output.textContent += 'Custom cats: ' + JSON.stringify(customCats.map(c => c.name)) + '\n';

        await store.refreshCategories();
        output.textContent += 'Store categories count: ' + store.state.categories.length + '\n';

        output.textContent += '✅ TEST PASSED - Check if new category appears above';
        toast.success('DB test passed');
    } catch (err) {
        output.textContent += '❌ ERROR: ' + err.message + '\n' + err.stack;
        toast.error('DB test failed: ' + err.message);
    }
}

async function testCategoryRead() {
    const output = document.getElementById('debugOutput');
    try {
        output.textContent = 'Testing DB read...\n';

        const builtIn = await DB.dbGetAll('categories');
        output.textContent += 'Built-in categories: ' + builtIn.length + '\n';
        output.textContent += 'Names: ' + builtIn.map(c => c.name).join(', ') + '\n\n';

        const customCats = await DB.getCustomCategories();
        output.textContent += 'Custom categories: ' + customCats.length + '\n';
        output.textContent += 'Names: ' + customCats.map(c => c.name).join(', ') + '\n';
        output.textContent += 'Full data: ' + JSON.stringify(customCats) + '\n\n';

        const settings = await DB.dbGetAll('settings');
        output.textContent += 'Settings keys: ' + settings.map(s => s.key).join(', ') + '\n';

        const customCatSetting = settings.find(s => s.key === 'customCategories');
        if (customCatSetting) {
            output.textContent += 'customCategories value: ' + customCatSetting.value + '\n';
        } else {
            output.textContent += '⚠️ customCategories setting not found!\n';
        }

        output.textContent += '\n--- STORE STATE ---\n';
        output.textContent += 'store.state.categories count: ' + store.state.categories.length + '\n';
        output.textContent += 'All store cats: ' + JSON.stringify(store.state.categories.map(c => ({ id: c.id, name: c.name, type: c.type, isCustom: c.isCustom }))) + '\n';

        const merged = [...builtIn, ...customCats];
        output.textContent += '\n--- MERGED ---\n';
        output.textContent += 'Merged count: ' + merged.length + '\n';
        output.textContent += 'Merged names: ' + merged.map(c => c.name).join(', ') + '\n';

        output.textContent += '\n✅ Read complete';
    } catch (err) {
        output.textContent += '❌ ERROR: ' + err.message;
    }
}

window.saveColorSettings = saveColorSettings;
window.addAccountColor = addAccountColor;
window.saveCustomCurrency = saveCustomCurrency;
window.updateSetting = updateSetting;
window.exportAllData = exportAllData;
window.importData = importData;
window.migrateFromFinanceFlow = migrateFromFinanceFlow;
window.testCategoryDB = testCategoryDB;
window.testCategoryRead = testCategoryRead;
