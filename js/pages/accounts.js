function renderAccounts() {
    const content = document.getElementById('contentArea');
    const accounts = store.state.accounts;
    const totals = store.calculateTotals();
    const currency = store.state.settings.currency || 'USD';
    
    const entriesByAccount = {};
    const expensesByAccount = {};
    store.state.entries.forEach(e => {
        if (e.accountId) entriesByAccount[e.accountId] = (entriesByAccount[e.accountId] || 0) + parseFloat(e.amount);
    });
    store.state.expenses.forEach(e => {
        if (e.accountId) expensesByAccount[e.accountId] = (expensesByAccount[e.accountId] || 0) + parseFloat(e.amount);
    });

    content.innerHTML = `
        <div class="fade-in">
            <div class="page-header">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <h1 class="page-title-main">Cuentas</h1>
                        <p class="page-description">Administra tus cuentas</p>
                    </div>
                    <div class="page-actions">
                        <button class="btn btn-primary" onclick="openAccountModal()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                            Nueva Cuenta
                        </button>
                        <div class="export-menu">
                            <button class="btn btn-secondary" onclick="toggleExportMenu(this)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                Exportar
                            </button>
                            <div class="export-dropdown">
                                <button onclick="exportPageData('accounts', 'json')">JSON</button>
                                <button onclick="exportPageData('accounts', 'csv')">CSV</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="kpi-cards page-section">
                <div class="card stat-card">
                    <span class="stat-label">Total en Cuentas</span>
                    <span class="stat-value text-income">${store.formatCurrency(totals.totalAccounts, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Número de Cuentas</span>
                    <span class="stat-value">${accounts.length}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Total Entradas</span>
                    <span class="stat-value text-income">${store.formatCurrency(Object.values(entriesByAccount).reduce((s, v) => s + v, 0), currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Total Salidas</span>
                    <span class="stat-value text-expense">${store.formatCurrency(Object.values(expensesByAccount).reduce((s, v) => s + v, 0), currency)}</span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr; gap: var(--grid-gap);" class="page-section">
                ${accounts.length > 0 ? accounts.map(account => {
                    const accountType = DB.accountTypes.find(t => t.id === account.type);
                    const baseBalance = parseFloat(account.baseBalance) || 0;
                    const accountIn = entriesByAccount[account.id] || 0;
                    const accountOut = expensesByAccount[account.id] || 0;
                    const balance = baseBalance + accountIn - accountOut;
                    return `
                        <div class="account-card" onclick="openAccountModal(${JSON.stringify(account).replace(/"/g, '&quot;')})">
                            <div class="account-color" style="background-color: ${account.color || '#2563EB'}20; color: ${account.color || '#2563EB'};">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                            </div>
                            <div class="account-info">
                                <div class="account-name">${escapeHtml(account.name)}</div>
                                <div class="account-type">${accountType?.name || account.type}${account.bankName ? ` • ${escapeHtml(account.bankName)}` : ''}</div>
                            </div>
                            <div class="account-balance-section">
                                <div class="account-balance ${balance >= 0 ? 'positive' : 'negative'}">${store.formatCurrency(balance, account.currency || currency)}</div>
                                ${accountIn > 0 || accountOut > 0 ? `<div class="account-flow">+${store.formatCurrencyNoWrap(accountIn, currency)} / -${store.formatCurrencyNoWrap(accountOut, currency)}</div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('') : `
                    <div class="card" style="grid-column: 1 / -1;">
                        <div class="empty-state">
                            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                            <h4 class="empty-state-title">Sin cuentas</h4>
                            <p class="empty-state-description">Agrega tus cuentas bancarias o efectivo.</p>
                            <button class="btn btn-primary" onclick="openAccountModal()">Agregar Cuenta</button>
                        </div>
                    </div>
                `}
            </div>

            <div class="grid-2 page-section">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Balance por Cuenta</h3>
                    </div>
                    <div class="chart-container" style="height: 280px;">
                        <canvas id="accountsByBalanceChart"></canvas>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Distribución por Tipo</h3>
                    </div>
                    <div class="chart-container" style="height: 280px;">
                        <canvas id="accountsByTypeChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => initAccountsCharts(), 100);
}

function openAccountModal(account = null) {
    const isEdit = !!account;
    modal.open({
        title: isEdit ? 'Editar Cuenta' : 'Nueva Cuenta',
        content: Forms.createAccountForm(account),
        footer: `
            <button class="btn btn-ghost" onclick="modal.close()">Cancelar</button>
            ${isEdit ? `<button class="btn btn-danger" onclick="deleteAccount(${account.id})">Eliminar</button>` : ''}
            <button class="btn btn-primary" onclick="${isEdit ? `updateAccount(${account.id})` : 'saveAccount()'}">${isEdit ? 'Actualizar' : 'Guardar'}</button>
        `
    });
    setupFormListeners();
}

async function saveAccount() {
    if (window.preventSubmit()) return;
    const form = document.getElementById('accountForm');
    if (!form.checkValidity()) { form.reportValidity(); window.releaseSubmit(); return; }
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.baseBalance = parseFloat(data.baseBalance) || 0;
    data.balance = data.baseBalance;
    
    if (data.bankName === '__custom__') {
        data.bankName = data.bankNameCustom || '';
    }
    delete data.bankNameCustom;
    
    try {
        await DB.dbAdd('accounts', data);
        await store.refreshAccounts();
        modal.close();
        toast.success('Cuenta creada');
        router.navigate('accounts');
    } catch (error) { toast.error('Error al crear cuenta'); }
    finally { window.releaseSubmit(); }
}

async function updateAccount(id) {
    if (window.preventSubmit()) return;
    const form = document.getElementById('accountForm');
    if (!form.checkValidity()) { form.reportValidity(); window.releaseSubmit(); return; }
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.id = id;
    data.baseBalance = parseFloat(data.baseBalance) || 0;
    
    if (data.bankName === '__custom__') {
        data.bankName = data.bankNameCustom || '';
    }
    delete data.bankNameCustom;
    
    try {
        await DB.dbPut('accounts', data);
        await store.refreshAccounts();
        modal.close();
        toast.success('Cuenta actualizada');
        router.navigate('accounts');
    } catch (error) { toast.error('Error al actualizar'); }
    finally { window.releaseSubmit(); }
}

async function deleteAccount(id) {
    if (window.preventSubmit()) return;
    if (confirm('¿Eliminar esta cuenta?')) {
        try {
            await DB.dbDelete('accounts', id);
            await store.refreshAccounts();
            modal.close();
            toast.success('Cuenta eliminada');
            router.navigate('accounts');
        } catch (error) { toast.error('Error al eliminar'); }
    }
    window.releaseSubmit();
}

window.renderAccounts = renderAccounts;
window.openAccountModal = openAccountModal;
window.saveAccount = saveAccount;
window.updateAccount = updateAccount;
window.deleteAccount = deleteAccount;

let accountsByBalanceChartInstance = null;
let accountsByTypeChartInstance = null;

function initAccountsCharts() {
    if (accountsByBalanceChartInstance) { accountsByBalanceChartInstance.destroy(); accountsByBalanceChartInstance = null; }
    if (accountsByTypeChartInstance) { accountsByTypeChartInstance.destroy(); accountsByTypeChartInstance = null; }

    const currency = store.state.settings.currency || 'USD';
    const accounts = store.state.accounts;

    const entriesByAccount = {};
    const expensesByAccount = {};
    store.state.entries.forEach(e => {
        if (e.accountId) entriesByAccount[e.accountId] = (entriesByAccount[e.accountId] || 0) + parseFloat(e.amount);
    });
    store.state.expenses.forEach(e => {
        if (e.accountId) expensesByAccount[e.accountId] = (expensesByAccount[e.accountId] || 0) + parseFloat(e.amount);
    });

    const accountData = accounts.map(acc => {
        const baseBalance = parseFloat(acc.baseBalance) || 0;
        const accountIn = entriesByAccount[acc.id] || 0;
        const accountOut = expensesByAccount[acc.id] || 0;
        return {
            name: acc.name,
            balance: baseBalance + accountIn - accountOut,
            type: acc.type,
            color: acc.color || '#2563EB'
        };
    });

    if (document.getElementById('accountsByBalanceChart')) {
        accountsByBalanceChartInstance = new Chart(document.getElementById('accountsByBalanceChart'), {
            type: 'bar',
            data: {
                labels: accountData.map(a => a.name.length > 15 ? a.name.substring(0, 15) + '...' : a.name),
                datasets: [{
                    label: 'Balance',
                    data: accountData.map(a => a.balance),
                    backgroundColor: accountData.map(a => a.balance >= 0 ? (a.color || '#059669') : '#DC2626'),
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: '#E5E7EB' }, beginAtZero: false },
                    y: { grid: { display: false } }
                }
            }
        });
        window.registerChart('accountsByBalanceChart', accountsByBalanceChartInstance);
    }

    const byType = {};
    accountData.forEach(a => {
        const typeName = DB.accountTypes.find(t => t.id === a.type)?.name || a.type;
        if (!byType[typeName]) byType[typeName] = { total: 0, count: 0 };
        byType[typeName].total += Math.max(0, a.balance);
        byType[typeName].count++;
    });

    const typeLabels = Object.keys(byType);
    const typeData = Object.values(byType).map(t => t.total);
    const typeColors = ['#2563EB', '#059669', '#7C3AED', '#D97706', '#DC2626'];

    if (typeLabels.length > 0 && document.getElementById('accountsByTypeChart')) {
        accountsByTypeChartInstance = new Chart(document.getElementById('accountsByTypeChart'), {
            type: 'doughnut',
            data: {
                labels: typeLabels,
                datasets: [{
                    data: typeData,
                    backgroundColor: typeColors.slice(0, typeLabels.length),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { font: { family: 'Raleway', size: 11 }, padding: 10, usePointStyle: true } }
                }
            }
        });
        window.registerChart('accountsByTypeChart', accountsByTypeChartInstance);
    }
}

router.register('accounts', renderAccounts);