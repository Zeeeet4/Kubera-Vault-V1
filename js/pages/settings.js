function renderSettings() {
    const content = document.getElementById('contentArea');
    const settings = store.state.settings;
    const allCurrencies = DB.getAllCurrencies();
    const isDark = settings.theme === 'dark';

    const cats = store.state.categories || [];
    const incomeCats = cats.filter(c => c.type === 'income');
    const expenseCats = cats.filter(c => c.type === 'expense');
    const customIncomeCats = cats.filter(c => c.type === 'income' && c.isCustom);
    const customExpenseCats = cats.filter(c => c.type === 'expense' && c.isCustom);

    // Track original color values for revert
    window._originalColors = {
        incomeColor: settings.incomeColor || '#059669',
        expenseColor: settings.expenseColor || '#DC2626',
        debtColor: settings.debtColor || '#DC2626',
        investmentColor: settings.investmentColor || '#7C3AED'
    };
    window._hasPendingChanges = false;

    content.innerHTML = `
        <div class="fade-in">
            <div class="page-header">
                <h1 class="page-title-main">Ajustes</h1>
                <p class="page-description">Personaliza tu experiencia y gestiona tus datos</p>
            </div>

            <div class="settings-section">
                <h3 class="settings-title">Apariencia</h3>
                <div class="card" style="margin-bottom: 16px;">
                    <div class="settings-item">
                        <div class="settings-item-info">
                            <div class="settings-item-title">Modo Oscuro</div>
                            <div class="settings-item-description">Cambia entre tema claro y oscuro</div>
                        </div>
                        <label class="toggle ${isDark ? 'active' : ''}" onclick="toggleThemeSetting()">
                            <div class="toggle-knob"></div>
                        </label>
                    </div>
                </div>
            </div>

            <div class="settings-section">
                <h3 class="settings-title">Colores de Números</h3>
                <div class="card" style="margin-bottom: 16px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        <div>
                            <label class="input-label">Ingresos</label>
                            <div class="color-picker" id="incomeColorPicker">
                                ${['#059669', '#10B981', '#34D399', '#22C55E', '#16A34A'].map(c => `
                                    <div class="color-option ${(settings.incomeColor || '#059669') === c ? 'selected' : ''}" data-color="${c}" style="background-color: ${c}"></div>
                                `).join('')}
                            </div>
                            <input type="hidden" id="incomeColor" value="${settings.incomeColor || '#059669'}">
                        </div>
                        <div>
                            <label class="input-label">Gastos</label>
                            <div class="color-picker" id="expenseColorPicker">
                                ${['#DC2626', '#EF4444', '#F87171', '#E11D48', '#BE123C'].map(c => `
                                    <div class="color-option ${(settings.expenseColor || '#DC2626') === c ? 'selected' : ''}" data-color="${c}" style="background-color: ${c}"></div>
                                `).join('')}
                            </div>
                            <input type="hidden" id="expenseColor" value="${settings.expenseColor || '#DC2626'}">
                        </div>
                        <div>
                            <label class="input-label">Deudas</label>
                            <div class="color-picker" id="debtColorPicker">
                                ${['#DC2626', '#B91C1C', '#991B1B', '#7F1D1D', '#EF4444'].map(c => `
                                    <div class="color-option ${(settings.debtColor || '#DC2626') === c ? 'selected' : ''}" data-color="${c}" style="background-color: ${c}"></div>
                                `).join('')}
                            </div>
                            <input type="hidden" id="debtColor" value="${settings.debtColor || '#DC2626'}">
                        </div>
                        <div>
                            <label class="input-label">Inversiones</label>
                            <div class="color-picker" id="investmentColorPicker">
                                ${['#7C3AED', '#8B5CF6', '#A78BFA', '#6D28D9', '#5B21B6'].map(c => `
                                    <div class="color-option ${(settings.investmentColor || '#7C3AED') === c ? 'selected' : ''}" data-color="${c}" style="background-color: ${c}"></div>
                                `).join('')}
                            </div>
                            <input type="hidden" id="investmentColor" value="${settings.investmentColor || '#7C3AED'}">
                        </div>
                    </div>
                </div>
            </div>

            <div class="settings-section">
                <h3 class="settings-title">Colores de Cuentas</h3>
                <div class="card" style="margin-bottom: 16px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
                        ${DB.getAccountColors().map(c => `
                            <div class="color-option" style="background-color: ${c}; width: 40px; height: 40px;"></div>
                        `).join('')}
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="color" id="newAccountColor" value="#2563EB" style="width: 40px; height: 40px; border: none; cursor: pointer; border-radius: var(--radius-md);">
                        <button class="btn btn-secondary btn-sm" onclick="addAccountColor()">Agregar Color</button>
                    </div>
                </div>
            </div>

            <div class="settings-section">
                <h3 class="settings-title">Monedas</h3>
                <div class="card" style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <span>Moneda principal: <strong>${DB.getCurrencyByCode(settings.currency || 'USD').name}</strong></span>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
                        ${allCurrencies.map(c => `
                            <span class="badge ${(settings.currency || 'USD') === c.code ? 'badge-primary' : 'badge-success'}" style="cursor: pointer;" onclick="updateSetting('currency', '${c.code}'); renderSettings();">
                                ${c.symbol} ${c.code}
                            </span>
                        `).join('')}
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="openAddCurrencyModal()">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Agregar Moneda Personalizada
                    </button>
                </div>
            </div>

            <div class="settings-section">
                <h3 class="settings-title">Categorías de Ingreso <span style="font-weight: 400; font-size: 14px; color: var(--text-secondary);">(${incomeCats.length} total, ${customIncomeCats.length} personalizadas)</span></h3>
                <div class="card" style="margin-bottom: 24px;">
                    ${incomeCats.length === 0 ? '<p style="color: var(--text-secondary); padding: 12px 0;">⚠️ No hay categorías. La base de datos puede estar vacía.</p>' : ''}
                    ${incomeCats.map(c => `
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-light);">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <input type="color" value="${c.color}" class="color-input" style="width: 30px; height: 30px; border: none; cursor: pointer;" onchange="updateCategoryColor('${c.id}', this.value)">
                                <span>${c.name}</span>
                                ${c.isCustom ? '<span style="font-size: 10px; background: var(--accent-primary); color: white; padding: 2px 6px; border-radius: 4px;">custom</span>' : ''}
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-ghost btn-sm" onclick="openEditCategoryModal('${c.id}', 'income')">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                </button>
                                ${c.isCustom ? `
                                <button class="btn btn-ghost btn-sm" onclick="deleteCategory('${c.id}')">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                    </svg>
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                    <button class="btn btn-primary btn-sm" style="margin-top: 16px;" onclick="openAddCategoryModal('income')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Nueva Categoría
                    </button>
                </div>

                <h3 class="settings-title">Categorías de Gasto <span style="font-weight: 400; font-size: 14px; color: var(--text-secondary);">(${expenseCats.length} total, ${customExpenseCats.length} personalizadas)</span></h3>
                <div class="card">
                    ${expenseCats.length === 0 ? '<p style="color: var(--text-secondary); padding: 12px 0;">⚠️ No hay categorías. La base de datos puede estar vacía.</p>' : ''}
                    ${expenseCats.map(c => `
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-light);">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <input type="color" value="${c.color}" class="color-input" style="width: 30px; height: 30px; border: none; cursor: pointer;" onchange="updateCategoryColor('${c.id}', this.value)">
                                <span>${c.name}</span>
                                ${c.isCustom ? '<span style="font-size: 10px; background: var(--accent-primary); color: white; padding: 2px 6px; border-radius: 4px;">custom</span>' : ''}
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-ghost btn-sm" onclick="openEditCategoryModal('${c.id}', 'expense')">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                </button>
                                ${c.isCustom ? `
                                <button class="btn btn-ghost btn-sm" onclick="deleteCategory('${c.id}')">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                    </svg>
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                    <button class="btn btn-danger btn-sm" style="margin-top: 16px;" onclick="openAddCategoryModal('expense')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Nueva Categoría
                    </button>
                </div>
            </div>

            <div class="settings-section">
                <h3 class="settings-title">Debug - Estado de Categorías</h3>
                <div class="card" style="margin-bottom: 16px;">
                    <div style="font-family: monospace; font-size: 12px; background: var(--bg-secondary); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                        <div>Total categories in store: <strong>${cats.length}</strong></div>
                        <div>Income: <strong>${incomeCats.length}</strong> | Expense: <strong>${expenseCats.length}</strong></div>
                        <div>Custom Income: <strong>${customIncomeCats.length}</strong> | Custom Expense: <strong>${customExpenseCats.length}</strong></div>
                    </div>
                    <div style="margin-bottom: 12px; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 11px; background: #1a1a2e; color: #10B981; padding: 8px; border-radius: 4px;">
                        ${cats.map(c => `<div>[${c.type || 'UNDEFINED'}] ${c.name} ${c.isCustom ? '(custom)' : '(built-in)'}</div>`).join('')}
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="testCategoryDB()" style="margin-right: 8px;">🔧 Test DB Write</button>
                    <button class="btn btn-secondary btn-sm" onclick="testCategoryRead()">🔍 Test DB Read</button>
                    <div id="debugOutput" style="font-family: monospace; font-size: 11px; margin-top: 12px; padding: 8px; background: #1a1a2e; color: #10B981; border-radius: 4px; white-space: pre-wrap; min-height: 20px;"></div>
                </div>
            </div>

            <div class="settings-section">
                <h3 class="settings-title">Datos</h3>
                <div class="settings-item">
                    <div class="settings-item-info">
                        <div class="settings-item-title">Migrar desde FinanceFlow</div>
                        <div class="settings-item-description">Importa datos desde la base de datos antigua</div>
                    </div>
                    <button class="btn btn-primary" onclick="migrateFromFinanceFlow()">
                        🔄 Migrar Datos
                    </button>
                </div>
                <div class="settings-item">
                    <div class="settings-item-info">
                        <div class="settings-item-title">Exportar Datos</div>
                        <div class="settings-item-description">Descargar todos tus datos como backup</div>
                    </div>
                    <button class="btn btn-secondary" onclick="exportAllData()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                        Exportar Backup
                    </button>
                </div>
                <div class="settings-item">
                    <div class="settings-item-info">
                        <div class="settings-item-title">Importar Datos</div>
                        <div class="settings-item-description">Restaurar datos desde un backup</div>
                    </div>
                    <button class="btn btn-secondary" onclick="document.getElementById('importFile').click()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                        </svg>
                        Importar
                    </button>
                    <input type="file" id="importFile" accept=".json,.mmbackup" style="display: none;" onchange="importData(event)">
                </div>
                <div class="settings-item">
                    <div class="settings-item-info">
                        <div class="settings-item-title">Almacenamiento Usado</div>
                    </div>
                    <span id="storageUsed" style="font-weight: 600;">Calculando...</span>
                </div>
            </div>
        </div>
        <div class="settings-save-bar" id="settingsSaveBar">
            <span class="settings-save-msg">Tienes cambios sin guardar</span>
            <div class="settings-save-actions">
                <button class="btn btn-ghost" onclick="cancelColorChanges()">Cancelar</button>
                <button class="btn btn-primary" onclick="saveColorSettings()">Guardar cambios</button>
            </div>
        </div>
    `;

    updateStorageInfo();
    setupColorPickers();
    setupColorChangeTracking();
    hideSaveBar();
}

function setupColorPickers() {
    ['incomeColorPicker', 'expenseColorPicker', 'debtColorPicker', 'investmentColorPicker'].forEach(pickerId => {
        const picker = document.getElementById(pickerId);
        if (picker) {
            picker.querySelectorAll('.color-option').forEach(option => {
                option.addEventListener('click', () => {
                    picker.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                    const hiddenInput = picker.parentElement.querySelector('input[type="hidden"]');
                    if (hiddenInput) hiddenInput.value = option.dataset.color;
                    markPendingChanges();
                });
            });
        }
    });
}

function setupColorChangeTracking() {
    ['incomeColor', 'expenseColor', 'debtColor', 'investmentColor'].forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', markPendingChanges);
        }
    });
}

function markPendingChanges() {
    if (window._hasPendingChanges) return;
    window._hasPendingChanges = true;
    showSaveBar();
}

function showSaveBar() {
    const bar = document.getElementById('settingsSaveBar');
    if (bar) {
        bar.classList.add('visible');
        document.body.style.paddingBottom = '72px';
    }
}

function hideSaveBar() {
    window._hasPendingChanges = false;
    const bar = document.getElementById('settingsSaveBar');
    if (bar) {
        bar.classList.remove('visible');
        document.body.style.paddingBottom = '';
    }
}

async function cancelColorChanges() {
    const orig = window._originalColors;
    if (!orig) return;
    
    // Revert all color pickers to original values
    ['incomeColor', 'expenseColor', 'debtColor', 'investmentColor'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = orig[id];
    });
    
    // Revert visual selection on color pickers
    ['incomeColorPicker', 'expenseColorPicker', 'debtColorPicker', 'investmentColorPicker'].forEach((pickerId, i) => {
        const picker = document.getElementById(pickerId);
        if (!picker) return;
        const key = ['incomeColor', 'expenseColor', 'debtColor', 'investmentColor'][i];
        const targetColor = orig[key];
        picker.querySelectorAll('.color-option').forEach(o => {
            o.classList.toggle('selected', o.dataset.color === targetColor);
        });
    });
    
    hideSaveBar();
    toast.info('Cambios descartados');
}

function setupCategoryColorPicker(pickerId, hiddenInputId) {
    const picker = document.getElementById(pickerId);
    if (!picker) return;
    picker.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            picker.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            document.getElementById(hiddenInputId).value = option.dataset.color;
        });
    });
}

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

        // Update tracked originals so cancel works from new baseline
        window._originalColors = { incomeColor, expenseColor, debtColor, investmentColor };
        
        hideSaveBar();
        toast.success('Colores guardados');
    } catch (err) {
        toast.error('Error al guardar colores');
    }
}

async function toggleThemeSetting() {
    await toggleTheme();
    renderSettings();
}

async function addAccountColor() {
    const color = document.getElementById('newAccountColor')?.value;
    if (!color) return;
    
    const colors = JSON.parse(store.state.settings.accountColors || '[]');
    if (!colors.includes(color)) {
        colors.push(color);
        await DB.dbSetSetting('accountColors', JSON.stringify(colors));
        store.state.settings.accountColors = JSON.stringify(colors);
        toast.success('Color agregado');
        renderSettings();
    }
}

function openAddCurrencyModal() {
    modal.open({
        title: 'Agregar Moneda',
        content: `
            <div class="input-group">
                <label class="input-label">Código (3 letras)</label>
                <input type="text" class="input" id="currencyCode" maxlength="3" placeholder="Ej: GBP" style="text-transform: uppercase;">
            </div>
            <div class="input-group">
                <label class="input-label">Símbolo</label>
                <input type="text" class="input" id="currencySymbol" maxlength="3" placeholder="Ej: £">
            </div>
            <div class="input-group">
                <label class="input-label">Nombre</label>
                <input type="text" class="input" id="currencyName" placeholder="Ej: Libra Esterlina">
            </div>
        `,
        footer: `
            <button class="btn btn-ghost" onclick="modal.close()">Cancelar</button>
            <button class="btn btn-primary" onclick="saveCustomCurrency()">Guardar</button>
        `
    });
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

function openAddCategoryModal(type) {
    modal.open({
        title: 'Nueva Categoría',
        content: `
            <div class="input-group">
                <label class="input-label">Nombre</label>
                <input type="text" class="input" id="categoryName" placeholder="Ej: Suscripciones">
            </div>
            <div class="input-group">
                <label class="input-label">Color</label>
                <div class="color-picker" id="categoryColorPicker" style="margin-top: 8px;">
                    <div class="color-option selected" data-color="#2563EB" style="background-color: #2563EB"></div>
                    <div class="color-option" data-color="#059669" style="background-color: #059669"></div>
                    <div class="color-option" data-color="#DC2626" style="background-color: #DC2626"></div>
                    <div class="color-option" data-color="#D97706" style="background-color: #D97706"></div>
                    <div class="color-option" data-color="#7C3AED" style="background-color: #7C3AED"></div>
                    <div class="color-option" data-color="#EC4899" style="background-color: #EC4899"></div>
                    <div class="color-option" data-color="#06B6D4" style="background-color: #06B6D4"></div>
                    <div class="color-option" data-color="#84CC16" style="background-color: #84CC16"></div>
                </div>
                <input type="hidden" id="categoryColor" value="#2563EB">
            </div>
        `,
        footer: `
            <button class="btn btn-ghost" onclick="modal.close()">Cancelar</button>
            <button class="btn btn-primary" onclick="saveNewCategory('${type}')">Guardar</button>
        `
    });

    setupCategoryColorPicker('categoryColorPicker', 'categoryColor');
    setupFormListeners();
}

async function saveNewCategory(type) {
    const nameEl = document.getElementById('categoryName');
    const colorEl = document.getElementById('categoryColor');
    const name = nameEl?.value;
    const color = colorEl?.value;

    if (!name) {
        toast.error('Ingresa un nombre');
        return;
    }

    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const catData = { id, name, color, type, isCustom: true };
    const success = await DB.addCustomCategory(catData);

    if (success) {
        modal.close();
        await store.refreshCategories();
        toast.success('Categoría agregada');
        renderSettings();
    } else {
        toast.error('Error al guardar');
    }
}

function openEditCategoryModal(id, type) {
    const category = store.state.categories.find(c => c.id === id);
    if (!category) return;

    modal.open({
        title: 'Editar Categoría',
        content: `
            <div class="input-group">
                <label class="input-label">Nombre</label>
                <input type="text" class="input" id="editCategoryName" value="${category.name}">
            </div>
            <div class="input-group">
                <label class="input-label">Color</label>
                <div class="color-picker" id="editCategoryColorPicker" style="margin-top: 8px;">
                    ${['#2563EB', '#059669', '#DC2626', '#D97706', '#7C3AED', '#EC4899', '#06B6D4', '#84CC16'].map(c => `
                        <div class="color-option ${category.color === c ? 'selected' : ''}" data-color="${c}" style="background-color: ${c}"></div>
                    `).join('')}
                </div>
                <input type="hidden" id="editCategoryColor" value="${category.color}">
            </div>
        `,
        footer: `
            <button class="btn btn-ghost" onclick="modal.close()">Cancelar</button>
            <button class="btn btn-primary" onclick="saveEditCategory('${id}')">Guardar</button>
        `
    });

    setupCategoryColorPicker('editCategoryColorPicker', 'editCategoryColor');
    setupFormListeners();
}

async function saveEditCategory(id) {
    const name = document.getElementById('editCategoryName').value;
    const color = document.getElementById('editCategoryColor').value;

    if (!name) {
        toast.error('Ingresa un nombre');
        return;
    }

    const category = store.state.categories.find(c => c.id === id);

    try {
        if (category && category.isCustom) {
            await DB.updateCustomCategory(id, { name, color });
        } else if (category) {
            await DB.updateBuiltInCategory(id, { name, color, type: category.type, icon: category.icon });
        } else {
            toast.error('Categoría no encontrada en el store');
            return;
        }
        
        modal.close();
        await store.refreshCategories();
        toast.success('Categoría actualizada');
        renderSettings();
    } catch (err) {
        toast.error('Error: ' + err.message);
    }
}

async function updateCategoryColor(id, color) {
    try {
        const category = store.state.categories.find(c => c.id === id);
        if (category && category.isCustom) {
            await DB.updateCustomCategory(id, { color });
        } else if (category) {
            await DB.updateBuiltInCategory(id, { color });
        }
        await store.refreshCategories();
        toast.success('Color actualizado');
    } catch (err) {
        toast.error('Error al actualizar color');
    }
}

async function deleteCategory(id) {
    const category = store.state.categories.find(c => c.id === id);
    if (!category) {
        toast.error('Categoría no encontrada');
        return;
    }
    if (!category.isCustom) {
        toast.error('No se pueden eliminar categorías predeterminadas');
        return;
    }
    if (!confirm('¿Eliminar esta categoría?')) return;
    await DB.deleteCustomCategory(id);
    await store.refreshCategories();
    toast.success('Categoría eliminada');
    renderSettings();
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

async function updateStorageInfo() {
    try {
        const size = await DB.calculateStorageSize();
        const kb = (size / 1024).toFixed(1);
        const mb = (size / 1024 / 1024).toFixed(2);
        document.getElementById('storageUsed').textContent = size > 1024 * 1024 ? `${mb} MB` : `${kb} KB`;
    } catch (error) {
        document.getElementById('storageUsed').textContent = 'Error';
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
            if (!confirm('Se importaran ' + ingresos + ' ingresos y ' + gastos + ' gastos. Se reemplazaran los datos actuales. Continuar?')) {
                event.target.value = '';
                return;
            }
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
            if (!confirm('Importar datos? Se reemplazaran los actuales.')) {
                event.target.value = '';
                return;
            }
        }

        await DB.clearAllData();
        await DB.importData(data);
        await store.loadAllData();
        router.navigate('dashboard');
        toast.success('Datos importados correctamente');
    } catch (error) {
        toast.error('Error al importar: ' + error.message);
    }
    event.target.value = '';
}

async function migrateFromFinanceFlow() {
    if (!confirm('Migrar datos desde FinanceFlowDB? Esto fusionará los datos antiguos con los actuales.')) return;
    
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
            toast.success(`Migración completada: ${migrated} registros importados`);
        };
        oldDbRequest.onerror = (err) => {
            toast.error('No se encontró FinanceFlowDB');
            console.error(err);
        };
    } catch (error) {
        console.error('Migration error:', error);
        toast.error('Error en migración: ' + error.message);
    }
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

window.renderSettings = renderSettings;
window.openAddCurrencyModal = openAddCurrencyModal;
window.saveCustomCurrency = saveCustomCurrency;
window.openAddCategoryModal = openAddCategoryModal;
window.saveNewCategory = saveNewCategory;
window.openEditCategoryModal = openEditCategoryModal;
window.saveEditCategory = saveEditCategory;
window.updateCategoryColor = updateCategoryColor;
window.deleteCategory = deleteCategory;
window.updateSetting = updateSetting;
window.exportAllData = exportAllData;
window.importData = importData;
window.migrateFromFinanceFlow = migrateFromFinanceFlow;
window.saveColorSettings = saveColorSettings;
window.cancelColorChanges = cancelColorChanges;
window.toggleThemeSetting = toggleThemeSetting;
window.addAccountColor = addAccountColor;
window.testCategoryDB = testCategoryDB;
window.testCategoryRead = testCategoryRead;

router.register('settings', renderSettings);