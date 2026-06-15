function renderDashboard() {
    const content = document.getElementById('contentArea');
    const totals = store.calculateTotals();
    const period = store.getViewPeriod();
    const currency = store.state.settings.currency || 'USD';
    const recentTransactions = store.getRecentTransactions(8);
    const expensesByCategory = store.getExpensesByCategory();
    const debts = store.state.debts;
    const cards = store.state.creditCards;
    
    const categoryData = Object.entries(expensesByCategory).map(([catId, data]) => {
        const cat = store.getCategoryInfo(catId);
        return { ...cat, ...data };
    }).sort((a, b) => b.total - a.total);

    const totalDebtInterest = preciseRound(debts.reduce((sum, d) => {
        if (d.interestRate && d.currentBalance) {
            return sum + (parseFloat(d.currentBalance) * parseFloat(d.interestRate) / 100);
        }
        return sum;
    }, 0), 2);

    const totalCardDebt = preciseRound(cards.reduce((sum, c) => sum + (parseFloat(c.currentDebt) || 0), 0), 2);
    const totalCardFees = preciseRound(cards.reduce((sum, c) => sum + (parseFloat(c.autoFee) || 0), 0), 2);
    const totalInstallments = store.state.expenses.filter(e => e.isInstallment).length;
    const totalRecurring = store.state.entries.filter(e => e.recurring).length;
    const avgInstallment = preciseRound(store.state.expenses.filter(e => e.isInstallment).reduce((sum, e) => sum + parseFloat(e.amount), 0) / (totalInstallments || 1), 2);
    const totalDebtWithInterest = preciseRound(totals.totalDebt + totalDebtInterest, 2);
    const totalCardCost = preciseRound(totalCardDebt + totalCardFees * 12, 2);

    content.innerHTML = `
        <div class="fade-in">
            <div class="page-header">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <h1 class="page-title-main">Dashboard</h1>
                        <p class="page-description">${period.label}</p>
                    </div>
                    <div class="page-actions">
                        <button class="btn btn-primary" onclick="openEntryModal()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 5v14M5 12h14"/>
                            </svg>
                            Entrada
                        </button>
                        <button class="btn btn-danger" onclick="openExpenseModal()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 5v14M5 12h14"/>
                            </svg>
                            Gasto
                        </button>
                        <div class="export-menu">
                            <button class="btn btn-secondary" onclick="toggleExportMenu(this)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                                </svg>
                                Exportar
                            </button>
                            <div class="export-dropdown" id="exportDropdown">
                                <button onclick="exportPageData('dashboard', 'json')">Exportar JSON</button>
                                <button onclick="exportPageData('dashboard', 'csv')">Exportar CSV</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="kpi-cards page-section">
                <div class="card stat-card">
                    <span class="stat-label">Balance del Período</span>
                    <span class="stat-value ${totals.totalBalance >= 0 ? 'text-income' : 'text-expense'}">
                        ${totals.totalBalance >= 0 ? '+' : ''}${store.formatCurrency(totals.totalBalance, currency)}
                    </span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Ingresos</span>
                    <span class="stat-value text-income">
                        +${store.formatCurrency(totals.totalIncome, currency)}
                    </span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Gastos</span>
                    <span class="stat-value text-expense">
                        -${store.formatCurrency(totals.totalExpenses, currency)}
                    </span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Savings Rate</span>
                    <span class="stat-value">${totals.savingsRate.toFixed(1)}%</span>
                    <div class="progress-bar" style="margin-top: 8px;">
                        <div class="progress-fill ${totals.savingsRate >= 20 ? 'success' : totals.savingsRate >= 0 ? 'warning' : 'danger'}" style="width: ${Math.max(0, Math.min(100, totals.savingsRate))}%"></div>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid page-section">
                <div class="card stat-card">
                    <span class="stat-label">Patrimonio Neto</span>
                    <span class="stat-value ${totals.netWorth >= 0 ? 'text-income' : 'text-expense'}">
                        ${totals.netWorth >= 0 ? '+' : ''}${store.formatCurrency(totals.netWorth, currency)}
                    </span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Deuda Total</span>
                    <span class="stat-value text-debt">
                        ${store.formatCurrency(totals.totalDebt, currency)}
                    </span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Cuentas</span>
                    <span class="stat-value">${store.formatCurrency(totals.totalAccounts, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Inversiones</span>
                    <span class="stat-value text-investment">
                        ${store.formatCurrency(totals.totalInvestments, currency)}
                    </span>
                </div>
            </div>

            <div class="card page-section">
                <div class="card-header">
                    <h3 class="card-title">Resumen de Deudas y Obligaciones</h3>
                </div>
                <div class="grid-auto-fit-sm">
                    <div class="stat-card">
                        <span class="stat-label">Deudas pendientes</span>
                        <span class="stat-value">${debts.length}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Total con intereses</span>
                        <span class="stat-value text-debt">${store.formatCurrency(totalDebtWithInterest, currency)}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Intereses anuales est.</span>
                        <span class="stat-value text-expense">${store.formatCurrency(totalDebtInterest, currency)}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Deuda tarjetas</span>
                        <span class="stat-value">${store.formatCurrency(totalCardDebt, currency)}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Cuotas anuales tarjetas</span>
                        <span class="stat-value">${store.formatCurrency(totalCardFees * 12, currency)}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Costo total tarjetas/año</span>
                        <span class="stat-value text-expense">${store.formatCurrency(totalCardCost, currency)}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Cuotas activas</span>
                        <span class="stat-value">${totalInstallments}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Entradas recurrentes</span>
                        <span class="stat-value">${totalRecurring}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Promedio cuota</span>
                        <span class="stat-value">${totalInstallments > 0 ? store.formatCurrency(avgInstallment, currency) : '-'}</span>
                    </div>
                </div>
            </div>

            <div class="charts-grid page-section">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Gastos por Categoría</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="expensesChart"></canvas>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Resumen Financiero</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="incomeExpenseChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="card page-section">
                <div class="card-header">
                    <h3 class="card-title">Transacciones Recientes</h3>
                </div>
                ${recentTransactions.length > 0 ? `
                    <div class="transactions-list">
                        ${recentTransactions.map(t => `
                            <div class="transaction-item">
                                <div class="transaction-icon ${t.type}">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        ${t.type === 'income' ? '<path d="M12 2v20M17 7l-5-5-5 5"/>' : '<path d="M12 22V2M7 17l5 5 5-5"/>'}
                                    </svg>
                                </div>
                                <div class="transaction-details">
                                    <div class="transaction-title">${t.nomenclatureCode ? `<span style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); margin-right: 8px;">[${escapeHtml(t.nomenclatureCode)}]</span>` : ''}${escapeHtml(t.title)}</div>
                                    <div class="transaction-meta">
                                        <span>${escapeHtml(store.getCategoryInfo(t.category).name)}</span>
                                        <span>•</span>
                                        <span>${store.formatDate(t.date)}</span>
                                    </div>
                                </div>
                                <div class="transaction-amount ${t.type}">
                                    ${t.type === 'income' ? '+' : '-'}${store.formatCurrency(parseFloat(t.amount), currency)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="empty-state">
                        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012 2h2a2 2 0 012-2"/>
                        </svg>
                        <h4 class="empty-state-title">Sin transacciones</h4>
                        <p class="empty-state-description">¡Agrega tu primera entrada o gasto!</p>
                    </div>
                `}
            </div>
        </div>
    `;

    initCharts(categoryData, totals);
}

function toggleExportMenu(btn) {
    const dropdown = document.getElementById('exportDropdown');
    if (!dropdown) return;
    dropdown.classList.toggle('show');
    setTimeout(() => {
        document.addEventListener('click', closeExportMenu, { once: true });
    }, 0);
}

function closeExportMenu(e) {
    const dropdown = document.getElementById('exportDropdown');
    if (dropdown) dropdown.classList.remove('show');
}

async function exportPageData(page, format) {
    const period = store.getViewPeriod();
    let data, filename;
    
    switch(page) {
        case 'dashboard':
            const entries = store.getFilteredData(store.state.entries, period);
            const expenses = store.getFilteredData(store.state.expenses, period);
            data = [...entries.map(e => ({...e, type: 'income'})), ...expenses.map(e => ({...e, type: 'expense'}))];
            filename = `kubera-vault-transactions-${period.start}.${format}`;
            break;
        case 'entries':
            data = store.getFilteredData(store.state.entries, period);
            filename = `kubera-vault-entries-${period.start}.${format}`;
            break;
        case 'expenses':
            data = store.getFilteredData(store.state.expenses, period);
            filename = `kubera-vault-expenses-${period.start}.${format}`;
            break;
        case 'accounts':
            data = store.state.accounts;
            filename = `kubera-vault-accounts.${format}`;
            break;
        case 'debts':
            data = store.state.debts;
            filename = `kubera-vault-debts.${format}`;
            break;
        case 'cards':
            data = store.state.creditCards;
            filename = `kubera-vault-cards.${format}`;
            break;
        case 'investments':
            data = store.state.investments;
            filename = `kubera-vault-investments.${format}`;
            break;
        default:
            data = store.state.entries;
            filename = `kubera-vault-data.${format}`;
    }

    let content;
    if (format === 'json') {
        content = JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
        content = '\uFEFF';
        if (data.length > 0) {
            const headers = Object.keys(data[0]).filter(k => k !== 'createdAt' && k !== 'updatedAt');
            content += headers.join(',') + '\n';
            data.forEach(row => {
                content += headers.map(h => {
                    const val = row[h];
                    if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
                    return val ?? '';
                }).join(',') + '\n';
            });
        }
    }

    const blob = new Blob([content], format === 'json' ? {type: 'application/json'} : {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    document.getElementById('exportDropdown')?.classList.remove('show');
    toast.success(`Exportado como ${format.toUpperCase()}`);
}

let expensesChartInstance = null;
let incomeExpenseChartInstance = null;

function initCharts(categoryData, totals) {
    if (expensesChartInstance) {
        expensesChartInstance.destroy();
        expensesChartInstance = null;
    }
    if (incomeExpenseChartInstance) {
        incomeExpenseChartInstance.destroy();
        incomeExpenseChartInstance = null;
    }

    const chartColors = ['#DC2626', '#EF4444', '#F87171', '#F97316', '#FB923C', '#FBBF24', '#F59E0B', '#D97706', '#B45309', '#92400E', '#A85100', '#78350F'];

    if (categoryData.length > 0 && document.getElementById('expensesChart')) {
        expensesChartInstance = new Chart(document.getElementById('expensesChart'), {
            type: 'doughnut',
            data: {
                labels: categoryData.map(c => c.name),
                datasets: [{
                    data: categoryData.map(c => c.total),
                    backgroundColor: categoryData.map((c, i) => c.color || chartColors[i % chartColors.length]),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { font: { family: 'Raleway', size: 12 }, padding: 12, usePointStyle: true }
                    }
                }
            }
        });
        window.registerChart('expensesChart', expensesChartInstance);
    }

    const months = [];
    const incomeData = [];
    const expenseData = [];
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push(d.toLocaleDateString('es-ES', { month: 'short' }));
        
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const entries = store.getFilteredData(store.state.entries, { start: monthStr + '-01', end: monthStr + '-31' });
        incomeData.push(entries.reduce((s, e) => s + parseFloat(e.amount), 0));
        
        const expenses = store.getFilteredData(store.state.expenses, { start: monthStr + '-01', end: monthStr + '-31' });
        expenseData.push(expenses.reduce((s, e) => s + parseFloat(e.amount), 0));
    }

    if (document.getElementById('incomeExpenseChart')) {
        incomeExpenseChartInstance = new Chart(document.getElementById('incomeExpenseChart'), {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                { label: 'Ingresos', data: incomeData, backgroundColor: '#059669' },
                { label: 'Gastos', data: expenseData, backgroundColor: '#DC2626' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { family: 'Raleway', size: 12 }, padding: 16, usePointStyle: true } } },
            scales: { x: { grid: { display: false } }, y: { grid: { color: '#E5E7EB' }, beginAtZero: true } }
        }
    });
    window.registerChart('incomeExpenseChart', incomeExpenseChartInstance);
}
}

function openEntryModal() {
    modal.open({
        title: 'Nueva Entrada',
        content: Forms.createEntryForm(),
        footer: `<button class="btn btn-ghost" onclick="modal.close()">Cancelar</button><button class="btn btn-primary" onclick="saveEntry()">Guardar</button>`
    });
    window.setupFormListeners();
}

function openExpenseModal() {
    modal.open({
        title: 'Nuevo Gasto',
        content: Forms.createExpenseForm(),
        footer: `<button class="btn btn-ghost" onclick="modal.close()">Cancelar</button><button class="btn btn-primary" onclick="saveExpense()">Guardar</button>`
    });
    window.setupFormListeners();
}

async function saveEntry() {
    if (window.preventSubmit()) return;
    const form = document.getElementById('entryForm');
    if (!form.checkValidity()) { form.reportValidity(); window.releaseSubmit(); return; }
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const validatedAmount = window.validatePositiveNumber(data.amount, 'Monto');
    if (validatedAmount === null) { window.releaseSubmit(); return; }
    data.amount = validatedAmount;
    data.recurring = data.recurring === 'on';
    
    const nomenclatureMode = data.nomenclatureMode || 'manual';
    if (nomenclatureMode === 'auto-siglas') {
        data.nomenclatureCode = generateSiglas(data.title) + '-' + generateAutoCode(data);
    } else if (nomenclatureMode === 'hybrid') {
        data.nomenclatureCode = generateSiglas(data.title) + '-' + (data.nomenclatureCode || '') + '-' + generateAutoCode(data);
    }
    data.nomenclatureMode = nomenclatureMode;
    
    if (data.linkedDebtId) data.linkedDebtId = parseInt(data.linkedDebtId);
    if (data.accountId) data.accountId = parseInt(data.accountId);
    
    try {
        await DB.dbAdd('entries', data);
        await store.refreshEntries();
        if (data.nomenclatureCode) {
            await DB.saveNomenclatureCode(data.nomenclatureCode, data.title, data.category, 'income');
        }
        modal.close();
        toast.success('Entrada guardada');
        router.navigate(router.getCurrentPage());
    } catch (error) { toast.error('Error al guardar'); }
    finally { window.releaseSubmit(); }
}

async function saveExpense() {
    if (window.preventSubmit()) return;
    const form = document.getElementById('expenseForm');
    if (!form.checkValidity()) { form.reportValidity(); window.releaseSubmit(); return; }
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const validatedAmount = window.validatePositiveNumber(data.amount, 'Monto');
    if (validatedAmount === null) { window.releaseSubmit(); return; }
    data.amount = validatedAmount;
    data.isInstallment = data.isInstallment === 'on';
    if (data.isInstallment) {
        data.installmentTotal = parseInt(data.installmentTotal) || 1;
        data.installmentCurrent = parseInt(data.installmentCurrent) || 1;
    }
    if (data.linkedDebtId) data.linkedDebtId = parseInt(data.linkedDebtId);
    if (data.accountId) data.accountId = parseInt(data.accountId);
    
    try {
        await DB.dbAdd('expenses', data);
        
        if (data.linkedDebtId) {
            const debt = await DB.dbGet('debts', parseInt(data.linkedDebtId));
            if (debt) {
                const newBalance = Math.max(0, parseFloat(debt.currentBalance) - data.amount);
                await DB.dbPut('debts', { ...debt, currentBalance: newBalance });
                await store.refreshDebts();
            }
        }
        
        await store.refreshExpenses();
        modal.close();
        toast.success('Gasto guardado');
        router.navigate(router.getCurrentPage());
    } catch (error) { toast.error('Error al guardar'); }
    finally { window.releaseSubmit(); }
}

function setupNomenclatureListeners() {
    window.setupFormListeners();
    
    const nomenclatureMode = document.getElementById('nomenclatureMode');
    if (nomenclatureMode) {
        nomenclatureMode.addEventListener('change', () => {
            const titleInput = document.querySelector('input[name="title"]');
            const mode = nomenclatureMode.value;
            const container = document.getElementById('nomenclatureFields');
            if (!container) return;
            
            if (mode === 'auto-siglas') {
                container.innerHTML = `<div style="display: flex; gap: 8px; align-items: center;">
                    <span class="badge badge-primary" id="autoSiglas" style="font-family: var(--font-mono);">${generateSiglas(titleInput?.value || '')}</span>
                    <span style="color: var(--text-muted); font-size: var(--text-sm);">-${generateAutoCode(null)}</span>
                </div>`;
            } else if (mode === 'hybrid') {
                container.innerHTML = `<div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                    <span class="badge badge-primary" id="hybridSiglas" style="font-family: var(--font-mono);">${generateSiglas(titleInput?.value || '')}</span>
                    <input type="text" class="input" name="nomenclatureCode" id="nomenclatureCode" placeholder="Código (ej: 01A)" style="width: 80px; font-family: var(--font-mono);">
                    <span style="color: var(--text-muted); font-size: var(--text-sm);">-${generateAutoCode(null)}</span>
                </div>`;
            } else {
                container.innerHTML = `<input type="text" class="input" name="nomenclatureCode" placeholder="Código manual (ej: SAL-01A)" style="font-family: var(--font-mono);">`;
            }
        });
    }

    const titleInput = document.querySelector('input[name="title"]');
    if (titleInput) {
        titleInput.addEventListener('input', () => {
            const mode = document.getElementById('nomenclatureMode')?.value;
            if (mode === 'auto-siglas' || mode === 'hybrid') {
                const siglasEl = document.getElementById('autoSiglas') || document.getElementById('hybridSiglas');
                if (siglasEl) siglasEl.textContent = generateSiglas(titleInput.value);
            }
        });
    }
}

window.renderDashboard = renderDashboard;
window.exportPageData = exportPageData;
window.toggleExportMenu = toggleExportMenu;

router.register('dashboard', renderDashboard);