function renderDebts() {
    const content = document.getElementById('contentArea');
    const debts = store.state.debts;
    const totals = store.calculateTotals();
    const currency = store.state.settings.currency || 'USD';

    const totalOriginal = preciseRound(debts.reduce((sum, d) => sum + (parseFloat(d.originalAmount) || 0), 0), 2);
    const totalCurrent = preciseRound(debts.reduce((sum, d) => sum + (parseFloat(d.currentBalance) || 0), 0), 2);
    const totalPaid = preciseRound(totalOriginal - totalCurrent, 2);
    const totalAnnualInterest = preciseRound(debts.reduce((sum, d) => {
        if (d.interestRate && d.currentBalance) {
            return sum + (parseFloat(d.currentBalance) * parseFloat(d.interestRate) / 100);
        }
        return sum;
    }, 0), 2);
    const totalWithInterest = preciseRound(totalCurrent + totalAnnualInterest, 2);
    const avgInterestRate = debts.length > 0 ? preciseRound(debts.reduce((sum, d) => sum + (parseFloat(d.interestRate) || 0), 0) / debts.length, 1) : 0;
    const totalMonthlyPayments = preciseRound(debts.reduce((sum, d) => sum + (parseFloat(d.periodicPayment) || 0), 0), 2);

    content.innerHTML = `
        <div class="fade-in">
            <div class="page-header">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <h1 class="page-title-main">Deudas</h1>
                        <p class="page-description">Controla el pago de tus deudas</p>
                    </div>
                    <div class="page-actions">
                        <button class="btn btn-danger" onclick="openDebtModal()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                            Nueva Deuda
                        </button>
                        <div class="export-menu">
                            <button class="btn btn-secondary" onclick="toggleExportMenu(this)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                Exportar
                            </button>
                            <div class="export-dropdown">
                                <button onclick="exportPageData('debts', 'json')">JSON</button>
                                <button onclick="exportPageData('debts', 'csv')">CSV</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="kpi-cards-3col page-section">
                <div class="card stat-card">
                    <span class="stat-label">Deuda Pendiente</span>
                    <span class="stat-value text-debt">${store.formatCurrency(totalCurrent, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Con Intereses Anuales</span>
                    <span class="stat-value text-expense">${store.formatCurrency(totalWithInterest, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Intereses Anuales Est.</span>
                    <span class="stat-value text-expense">${store.formatCurrency(totalAnnualInterest, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Total Pagado</span>
                    <span class="stat-value text-income">${store.formatCurrency(totalPaid, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Cuotas Mensuales</span>
                    <span class="stat-value">${store.formatCurrency(totalMonthlyPayments, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Tasa Promedio</span>
                    <span class="stat-value">${avgInterestRate.toFixed(1)}%</span>
                </div>
            </div>

            <div class="grid-auto-fill-lg page-section">
                ${debts.length > 0 ? debts.map(debt => {
                    const debtType = DB.debtTypes.find(t => t.id === debt.type);
                    const original = parseFloat(debt.originalAmount) || 0;
                    const current = parseFloat(debt.currentBalance) || 0;
                    const paid = original - current;
                    const progress = original > 0 ? (paid / original) * 100 : 0;
                    const payment = parseFloat(debt.periodicPayment) || 0;
                    const monthsToPay = payment > 0 ? Math.ceil(current / payment) : 0;
                    const annualInterest = (parseFloat(debt.interestRate) || 0) / 100 * current;
                    const totalCost = current + annualInterest;
                    
                    return `
                        <div class="debt-card">
                            <div class="debt-header">
                                <div>
                                    <div class="debt-title">${escapeHtml(debt.title)}</div>
                                    <div class="debt-creditor">${debtType?.name || debt.type}${debt.creditor ? ` • ${escapeHtml(debt.creditor)}` : ''}</div>
                                </div>
                                <button class="btn btn-ghost btn-sm" onclick="openDebtModal(${JSON.stringify(debt).replace(/"/g, '&quot;')})">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                            </div>
                            <div class="debt-stats">
                                <div class="debt-stat"><span class="debt-stat-label">Original</span><span class="debt-stat-value">${store.formatCurrency(original, currency)}</span></div>
                                <div class="debt-stat"><span class="debt-stat-label">Pendiente</span><span class="debt-stat-value" style="color: var(--expense-color);">${store.formatCurrency(current, currency)}</span></div>
                                <div class="debt-stat"><span class="debt-stat-label">Pagado</span><span class="debt-stat-value" style="color: var(--income-color);">${store.formatCurrency(paid, currency)}</span></div>
                                <div class="debt-stat"><span class="debt-stat-label">Cuota</span><span class="debt-stat-value">${store.formatCurrency(payment, currency)}</span></div>
                            </div>
                            ${annualInterest > 0 ? `
                                <div style="background: var(--bg-tertiary); padding: 8px 12px; border-radius: var(--radius-md); margin-bottom: 12px; font-size: var(--text-sm);">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                        <span style="color: var(--text-muted);">Tasa anual:</span>
                                        <span style="font-family: var(--font-mono);">${debt.interestRate}%</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                        <span style="color: var(--text-muted);">Interés anual est.:</span>
                                        <span style="font-family: var(--font-mono); color: var(--expense-color);">${store.formatCurrency(annualInterest, currency)}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; font-weight: 600;">
                                        <span>Costo total est.:</span>
                                        <span style="font-family: var(--font-mono);">${store.formatCurrency(totalCost, currency)}</span>
                                    </div>
                                </div>
                            ` : ''}
                            <div class="debt-progress">
                                <div class="progress-bar"><div class="progress-fill success" style="width: ${progress}%"></div></div>
                                <div class="debt-progress-labels"><span>${progress.toFixed(1)}% pagado</span><span>${monthsToPay} meses restantes</span></div>
                            </div>
                        </div>
                    `;
                }).join('') : `
                    <div class="card" style="grid-column: 1 / -1;">
                        <div class="empty-state">
                            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                            <h4 class="empty-state-title">Sin deudas</h4>
                            <p class="empty-state-description">Agrega tus deudas para seguimiento.</p>
                            <button class="btn btn-danger" onclick="openDebtModal()">Agregar Deuda</button>
                        </div>
                    </div>
                `}
            </div>

            <div class="grid-2 page-section">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Deudas por Tipo</h3>
                    </div>
                    <div class="chart-container" style="height: 280px;">
                        <canvas id="debtsByTypeChart"></canvas>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Progreso de Pago Total</h3>
                    </div>
                    <div class="chart-container" style="height: 280px;">
                        <canvas id="debtsProgressChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => initDebtsCharts(), 100);
}

function calculateDebtFreeDate(debts) {
    if (debts.length === 0) return 'Sin deudas';
    let totalMonthlyPayment = 0;
    debts.forEach(d => { totalMonthlyPayment += parseFloat(d.periodicPayment) || 0; });
    if (totalMonthlyPayment === 0) return 'Verificar';
    const totalDebt = debts.reduce((sum, d) => sum + parseFloat(d.currentBalance), 0);
    const months = Math.ceil(totalDebt / totalMonthlyPayment);
    const freeDate = new Date(); freeDate.setMonth(freeDate.getMonth() + months);
    return freeDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
}

function openDebtModal(debt = null) {
    const isEdit = !!debt;
    modal.open({
        title: isEdit ? 'Editar Deuda' : 'Nueva Deuda',
        content: Forms.createDebtForm(debt),
        footer: `<button class="btn btn-ghost" onclick="modal.close()">Cancelar</button>${isEdit ? `<button class="btn btn-danger" onclick="deleteDebt(${debt.id})">Eliminar</button>` : ''}<button class="btn btn-primary" onclick="${isEdit ? `updateDebt(${debt.id})` : 'saveDebt()'}">${isEdit ? 'Actualizar' : 'Guardar'}</button>`
    });
    setupFormListeners();
}

async function saveDebt() {
    if (window.preventSubmit()) return;
    const form = document.getElementById('debtForm');
    if (!form.checkValidity()) { form.reportValidity(); window.releaseSubmit(); return; }
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    if (data.nomenclatureCode && data.title) {
        await DB.saveNomenclatureCode(data.nomenclatureCode, data.title, null, 'expense');
    }
    const validatedOriginal = window.validatePositiveNumber(data.originalAmount, 'Monto Original');
    if (validatedOriginal === null) { window.releaseSubmit(); return; }
    data.originalAmount = validatedOriginal;
    const validatedBalance = window.validatePositiveNumber(data.currentBalance, 'Saldo Pendiente');
    if (validatedBalance === null) { window.releaseSubmit(); return; }
    data.currentBalance = validatedBalance;
    const validatedPayment = window.validatePositiveNumber(data.periodicPayment, 'Cuota Periódica');
    if (validatedPayment === null) { window.releaseSubmit(); return; }
    data.periodicPayment = validatedPayment;
    if (data.interestRate) data.interestRate = parseFloat(data.interestRate);
    if (data.accountId) data.accountId = parseInt(data.accountId);
    try {
        await DB.dbAdd('debts', data);
        await store.refreshDebts();
        modal.close();
        toast.success('Deuda creada');
        router.navigate('debts');
    } catch (error) { toast.error('Error al crear deuda'); }
    finally { window.releaseSubmit(); }
}

async function updateDebt(id) {
    if (window.preventSubmit()) return;
    const form = document.getElementById('debtForm');
    if (!form.checkValidity()) { form.reportValidity(); window.releaseSubmit(); return; }
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    if (data.nomenclatureCode && data.title) {
        await DB.saveNomenclatureCode(data.nomenclatureCode, data.title, null, 'expense');
    }
    data.id = id;
    const validatedOriginal = window.validatePositiveNumber(data.originalAmount, 'Monto Original');
    if (validatedOriginal === null) { window.releaseSubmit(); return; }
    data.originalAmount = validatedOriginal;
    const validatedBalance = window.validatePositiveNumber(data.currentBalance, 'Saldo Pendiente');
    if (validatedBalance === null) { window.releaseSubmit(); return; }
    data.currentBalance = validatedBalance;
    const validatedPayment = window.validatePositiveNumber(data.periodicPayment, 'Cuota Periódica');
    if (validatedPayment === null) { window.releaseSubmit(); return; }
    data.periodicPayment = validatedPayment;
    if (data.interestRate) data.interestRate = parseFloat(data.interestRate);
    if (data.accountId) data.accountId = parseInt(data.accountId);
    try {
        await DB.dbPut('debts', data);
        await store.refreshDebts();
        modal.close();
        toast.success('Deuda actualizada');
        router.navigate('debts');
    } catch (error) { toast.error('Error al actualizar'); }
    finally { window.releaseSubmit(); }
}

async function deleteDebt(id) {
    if (window.preventSubmit()) return;
    if (confirm('¿Eliminar esta deuda?')) {
        try {
            await DB.dbDelete('debts', id);
            await store.refreshDebts();
            modal.close();
            toast.success('Deuda eliminada');
            router.navigate('debts');
        } catch (error) { toast.error('Error al eliminar'); }
    }
    window.releaseSubmit();
}

window.renderDebts = renderDebts;
window.openDebtModal = openDebtModal;
window.saveDebt = saveDebt;
window.updateDebt = updateDebt;
window.deleteDebt = deleteDebt;

let debtsByTypeChartInstance = null;
let debtsProgressChartInstance = null;

function initDebtsCharts() {
    if (debtsByTypeChartInstance) { debtsByTypeChartInstance.destroy(); debtsByTypeChartInstance = null; }
    if (debtsProgressChartInstance) { debtsProgressChartInstance.destroy(); debtsProgressChartInstance = null; }

    const currency = store.state.settings.currency || 'USD';
    const debts = store.state.debts;

    const byType = {};
    debts.forEach(d => {
        const typeName = DB.debtTypes.find(t => t.id === d.type)?.name || d.type;
        if (!byType[typeName]) byType[typeName] = { total: 0, count: 0 };
        byType[typeName].total += parseFloat(d.currentBalance);
        byType[typeName].count++;
    });

    const typeLabels = Object.keys(byType);
    const typeData = Object.values(byType).map(t => t.total);
    const typeColors = ['#DC2626', '#EF4444', '#F87171', '#F97316', '#FB923C'];

    if (typeLabels.length > 0 && document.getElementById('debtsByTypeChart')) {
        debtsByTypeChartInstance = new Chart(document.getElementById('debtsByTypeChart'), {
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
        window.registerChart('debtsByTypeChart', debtsByTypeChartInstance);
    }

    const debtProgress = debts.map(d => {
        const original = parseFloat(d.originalAmount) || 0;
        const current = parseFloat(d.currentBalance) || 0;
        const paid = original - current;
        const percent = original > 0 ? (paid / original) * 100 : 0;
        return {
            name: d.name || d.title,
            percent,
            paid,
            current
        };
    });

    if (debtProgress.length > 0 && document.getElementById('debtsProgressChart')) {
        debtsProgressChartInstance = new Chart(document.getElementById('debtsProgressChart'), {
            type: 'bar',
            data: {
                labels: debtProgress.map(d => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name),
                datasets: [
                    {
                        label: 'Pagado',
                        data: debtProgress.map(d => d.paid),
                        backgroundColor: '#059669',
                        stack: 'total'
                    },
                    {
                        label: 'Pendiente',
                        data: debtProgress.map(d => d.current),
                        backgroundColor: '#DC2626',
                        stack: 'total'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { font: { family: 'Raleway', size: 11 }, padding: 12 } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${store.formatCurrency(ctx.raw, currency)}`
                        }
                    }
                },
                scales: {
                    x: { stacked: true, grid: { display: false } },
                    y: { stacked: true, grid: { color: '#E5E7EB' }, beginAtZero: true }
                }
            }
        });
        window.registerChart('debtsProgressChart', debtsProgressChartInstance);
    }
}

router.register('debts', renderDebts);