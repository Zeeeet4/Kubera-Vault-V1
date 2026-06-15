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
                <h3 class="settings-title">Bloqueo por PIN</h3>
                <div class="card" style="margin-bottom: 16px;">
                    <div class="settings-item">
                        <div class="settings-item-info">
                            <div class="settings-item-title">PIN de bloqueo</div>
                            <div class="settings-item-description">Protege el acceso a tus datos con un PIN</div>
                        </div>
                        <label class="toggle ${settings.pinEnabled ? 'active' : ''}" onclick="togglePinSetting()">
                            <div class="toggle-knob"></div>
                        </label>
                    </div>
                    <div id="pinSettingsBody" style="${settings.pinEnabled ? 'display:block' : 'display:none'}; padding-top: 8px;">
                        ${settings.pinHash ? `
                        <div class="input-group">
                            <label class="input-label">PIN actual</label>
                            <input type="password" class="input" id="currentPin" placeholder="PIN actual" maxlength="6" inputmode="numeric" autocomplete="off">
                        </div>
                        ` : ''}
                        <div class="input-group">
                            <label class="input-label">${settings.pinHash ? 'Nuevo PIN' : 'PIN'} (4-6 dígitos)</label>
                            <input type="password" class="input" id="newPin" placeholder="${settings.pinHash ? 'Nuevo PIN' : 'Crear PIN'}" maxlength="6" inputmode="numeric" autocomplete="off">
                        </div>
                        <div class="input-group">
                            <label class="input-label">Confirmar PIN</label>
                            <input type="password" class="input" id="confirmPin" placeholder="Confirmar PIN" maxlength="6" inputmode="numeric" autocomplete="off">
                        </div>
                        <div class="input-group">
                            <label class="input-label">Auto-bloqueo (minutos)</label>
                            <input type="number" class="input" id="autoLockMinutes" value="${settings.autoLockMinutes || 15}" min="1" max="60">
                        </div>
                        <button class="btn btn-primary" onclick="savePinSettings()" style="margin-top: 12px;">Guardar configuración PIN</button>
                        <div id="pinMessage" style="margin-top: 8px; font-size: var(--text-sm);"></div>
                    </div>
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

    ['incomeColor', 'expenseColor', 'debtColor', 'investmentColor'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = orig[id];
    });

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

async function toggleThemeSetting() {
    await toggleTheme();
    renderSettings();
}

async function togglePinSetting() {
    if (store.state.settings.pinEnabled) {
        const currentHash = store.state.settings.pinHash;
        if (currentHash) {
            const pin = document.getElementById('currentPin')?.value;
            if (!pin) {
                toast.error('Ingresa tu PIN actual para desactivar');
                renderSettings();
                return;
            }
            const ok = await verifyPin(pin, currentHash);
            if (!ok) {
                toast.error('PIN actual incorrecto');
                renderSettings();
                return;
            }
        }
        await DB.dbSetSetting('pinEnabled', false);
        store.state.settings.pinEnabled = false;
        toast.success('PIN desactivado');
    } else {
        await DB.dbSetSetting('pinEnabled', true);
        store.state.settings.pinEnabled = true;
        toast.success('PIN activado');
    }
    renderSettings();
}

async function savePinSettings() {
    const newPin = document.getElementById('newPin')?.value;
    const confirmPin = document.getElementById('confirmPin')?.value;
    const autoLock = parseInt(document.getElementById('autoLockMinutes')?.value || '15');
    const msgEl = document.getElementById('pinMessage');

    if (newPin) {
        if (newPin.length < 4 || newPin.length > 6) {
            toast.error('El PIN debe tener entre 4 y 6 dígitos');
            if (msgEl) msgEl.textContent = 'El PIN debe tener entre 4 y 6 dígitos';
            return;
        }
        if (newPin !== confirmPin) {
            toast.error('Los PIN no coinciden');
            if (msgEl) msgEl.textContent = 'Los PIN no coinciden';
            return;
        }
        const currentHash = store.state.settings.pinHash;
        if (currentHash) {
            const currentPin = document.getElementById('currentPin')?.value;
            if (!currentPin) {
                toast.error('Ingresa tu PIN actual para cambiar');
                if (msgEl) msgEl.textContent = 'Ingresa tu PIN actual';
                return;
            }
            const ok = await verifyPin(currentPin, currentHash);
            if (!ok) {
                toast.error('PIN actual incorrecto');
                if (msgEl) msgEl.textContent = 'PIN actual incorrecto';
                return;
            }
        }
        const hash = await hashPin(newPin);
        await DB.dbSetSetting('pinHash', hash);
        store.state.settings.pinHash = hash;
    }

    await DB.dbSetSetting('autoLockMinutes', autoLock);
    store.state.settings.autoLockMinutes = autoLock;
    toast.success('Configuración de PIN guardada');
    if (msgEl) msgEl.textContent = '';
    renderSettings();
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

window.renderSettings = renderSettings;
window.togglePinSetting = togglePinSetting;
window.savePinSettings = savePinSettings;
window.cancelColorChanges = cancelColorChanges;
window.toggleThemeSetting = toggleThemeSetting;

router.register('settings', renderSettings);
