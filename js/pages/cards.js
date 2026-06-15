function renderCards() {
    const content = document.getElementById('contentArea');
    const cards = store.state.creditCards;
    const currency = store.state.settings.currency || 'USD';

    const totalLimit = preciseRound(cards.reduce((sum, c) => sum + (parseFloat(c.creditLimit) || 0), 0), 2);
    const totalDebt = preciseRound(cards.reduce((sum, c) => sum + (parseFloat(c.currentDebt) || 0), 0), 2);
    const totalAnnualInterest = preciseRound(cards.reduce((sum, c) => {
        const debt = parseFloat(c.currentDebt) || 0;
        return sum + ((parseFloat(c.interestRate) || 0) / 100 * debt);
    }, 0), 2);
    const totalAnnualFees = preciseRound(cards.reduce((sum, c) => sum + ((parseFloat(c.autoFee) || 0) * 12), 0), 2);
    const totalMonthlyPayments = preciseRound(cards.filter(c => c.hasMonthlyPayment).reduce((sum, c) => sum + (parseFloat(c.monthlyPayment) || 0), 0), 2);
    const totalMonthlyCost = preciseRound(cards.reduce((sum, c) => {
        const debt = parseFloat(c.currentDebt) || 0;
        const monthlyInterest = ((parseFloat(c.interestRate) || 0) / 100 * debt) / 12;
        const monthlyPayment = c.hasMonthlyPayment ? (parseFloat(c.monthlyPayment) || 0) : 0;
        return sum + debt + monthlyInterest + (parseFloat(c.autoFee) || 0) + monthlyPayment;
    }, 0), 2);
    const totalPaid = preciseRound(cards.reduce((sum, c) => {
        const limit = parseFloat(c.creditLimit) || 0;
        const debt = parseFloat(c.currentDebt) || 0;
        return sum + Math.max(0, limit - debt);
    }, 0), 2);
    const totalRemaining = preciseRound(totalLimit - totalDebt, 2);

    content.innerHTML = `
        <div class="fade-in">
            <div class="page-header">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <h1 class="page-title-main">Tarjetas</h1>
                        <p class="page-description">Gestiona tus tarjetas de crédito</p>
                    </div>
                    <div class="page-actions">
                        <button class="btn btn-primary" onclick="openCardModal()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                            Nueva Tarjeta
                        </button>
                        <div class="export-menu">
                            <button class="btn btn-secondary" onclick="toggleExportMenu(this)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                Exportar
                            </button>
                            <div class="export-dropdown">
                                <button onclick="exportPageData('cards', 'json')">JSON</button>
                                <button onclick="exportPageData('cards', 'csv')">CSV</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="kpi-cards page-section" style="grid-template-columns: repeat(4, 1fr)">
                <div class="card stat-card">
                    <span class="stat-label">Límite Total</span>
                    <span class="stat-value">${store.formatCurrency(totalLimit, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Deuda Total</span>
                    <span class="stat-value text-expense">${store.formatCurrency(totalDebt, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Total Pagado</span>
                    <span class="stat-value text-income">${store.formatCurrency(totalPaid, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Disponible Restante</span>
                    <span class="stat-value">${store.formatCurrency(Math.max(0, totalRemaining), currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Cuotas Mensuales Fijas</span>
                    <span class="stat-value text-expense">${store.formatCurrency(totalMonthlyPayments, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Intereses Anuales</span>
                    <span class="stat-value text-expense">${store.formatCurrency(totalAnnualInterest, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Cuotas Anuales</span>
                    <span class="stat-value">${store.formatCurrency(totalAnnualFees, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Costo Mensual Total</span>
                    <span class="stat-value text-expense">${store.formatCurrency(totalMonthlyCost, currency)}</span>
                </div>
            </div>

            <div class="grid-3 page-section">
                ${cards.length > 0 ? cards.map(card => {
                    const entity = DB.cardEntities.find(e => e.id === card.entity);
                    const limit = parseFloat(card.creditLimit) || 0;
                    const baseDebt = parseFloat(card.currentDebt) || 0;
                    const availableCard = Math.max(0, limit - baseDebt);
                    const usagePercent = limit > 0 ? (baseDebt / limit) * 100 : 0;
                    const monthlyInterest = (parseFloat(card.interestRate) || 0) / 100 * baseDebt / 12;
                    const annualInterest = monthlyInterest * 12;
                    const monthlyFee = parseFloat(card.autoFee) || 0;
                    const annualFee = monthlyFee * 12;
                    const monthlyPayment = card.hasMonthlyPayment ? (parseFloat(card.monthlyPayment) || 0) : 0;
                    const totalMonthlyCost = baseDebt + monthlyInterest + monthlyFee + monthlyPayment;
                    const totalAnnualCost = baseDebt + annualInterest + annualFee + (monthlyPayment * 12);
                    const daysToPayment = getDaysToPayment(card.paymentDay);
                    
                    return `
                        <div>
                            <div class="credit-card-display" style="background: linear-gradient(135deg, ${card.color || '#2563EB'}, ${adjustColor(card.color || '#2563EB', -30)}); margin-bottom: 16px;">
                                <div class="credit-card-header">
                                    <div>
                                        <div class="credit-card-name">${escapeHtml(card.name)}</div>
                                        <div class="credit-card-entity">${entity?.name || card.entity}</div>
                                    </div>
                                    <button class="btn btn-icon" style="background: rgba(255,255,255,0.2);" onclick="openCardModalById(${card.id})">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                </div>
                                <div class="credit-card-digits">•••• •••• •••• ${card.lastDigits || '0000'}</div>
                                <div class="credit-card-footer">
                                    <div class="credit-card-info"><span class="credit-card-label">Deuda</span><span class="credit-card-value">${store.formatCurrency(baseDebt, currency)}</span></div>
                                    <div class="credit-card-info"><span class="credit-card-label">Límite</span><span class="credit-card-value">${store.formatCurrency(limit, currency)}</span></div>
                                    <div class="credit-card-info"><span class="credit-card-label">Pago</span><span class="credit-card-value">Día ${card.paymentDay}</span></div>
                                </div>
                            </div>
                            <div class="card">
                                <div class="credit-card-usage">
                                    <div style="display: flex; justify-content: space-between; font-size: var(--text-sm); margin-bottom: 8px;">
                                        <span>Uso del crédito</span>
                                        <span style="color: ${usagePercent > 80 ? 'var(--accent-danger)' : usagePercent > 50 ? 'var(--accent-warning)' : 'var(--accent-success)'}">${usagePercent.toFixed(1)}%</span>
                                    </div>
                                    <div class="progress-bar"><div class="progress-fill ${usagePercent > 80 ? 'danger' : usagePercent > 50 ? 'warning' : 'success'}" style="width: ${Math.min(100, usagePercent)}%"></div></div>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
                                    <div><span style="font-size: var(--text-xs); color: var(--text-muted);">Corte: Día ${card.cutoffDay}</span></div>
                                    <div><span style="font-size: var(--text-xs); color: var(--text-muted);">Pago: Día ${card.paymentDay}</span></div>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
                                    <div>
                                        <div style="font-size: var(--text-xs); color: var(--text-muted);">Disponible</div>
                                        <div style="font-family: var(--font-mono); font-weight: 600; font-size: var(--text-lg);">${store.formatCurrency(availableCard, currency)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: var(--text-xs); color: var(--text-muted);">Usado</div>
                                        <div style="font-family: var(--font-mono); font-weight: 600; font-size: var(--text-lg); color: var(--expense-color);">${store.formatCurrency(baseDebt, currency)}</div>
                                    </div>
                                </div>
                                ${card.hasMonthlyPayment ? `
                                <div style="margin-top: 12px; padding: 10px 14px; background: linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(220, 38, 38, 0.05)); border: 1px solid rgba(220, 38, 38, 0.3); border-radius: var(--radius-md);">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-size: var(--text-sm); font-weight: 500; color: var(--expense-color);">📋 Cuota mensual fija</span>
                                        <span style="font-family: var(--font-mono); font-weight: 600; color: var(--expense-color); font-size: var(--text-lg);">${store.formatCurrency(card.monthlyPayment || 0, currency)}</span>
                                    </div>
                                </div>
                                ` : ''}
                                ${monthlyInterest > 0 || monthlyFee > 0 ? `
                                    <div style="margin-top: 12px; padding: 8px 12px; background: var(--bg-tertiary); border-radius: var(--radius-md); font-size: var(--text-sm);">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                            <span style="color: var(--text-muted);">Interés mensual:</span>
                                            <span style="font-family: var(--font-mono); color: var(--expense-color);">${store.formatCurrency(monthlyInterest, currency)}</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                            <span style="color: var(--text-muted);">Interés anual:</span>
                                            <span style="font-family: var(--font-mono); color: var(--expense-color);">${store.formatCurrency(annualInterest, currency)}</span>
                                        </div>
                                        ${monthlyFee > 0 ? `
                                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                                <span style="color: var(--text-muted);">Cargo fijo:</span>
                                                <span style="font-family: var(--font-mono);">${store.formatCurrency(monthlyFee, currency)}/mes</span>
                                            </div>
                                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                                <span style="color: var(--text-muted);">Cuotas/año:</span>
                                                <span style="font-family: var(--font-mono);">${store.formatCurrency(annualFee, currency)}</span>
                                            </div>
                                        ` : ''}
                                        <div style="display: flex; justify-content: space-between; font-weight: 600; border-top: 1px solid var(--border-light); padding-top: 4px; margin-top: 4px;">
                                            <span>Total mensual:</span>
                                            <span style="font-family: var(--font-mono); color: var(--expense-color);">${store.formatCurrency(monthlyInterest + monthlyFee + monthlyPayment, currency)}</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; font-weight: 600; margin-top: 4px;">
                                            <span>Costo total/año:</span>
                                            <span style="font-family: var(--font-mono); color: var(--expense-color);">${store.formatCurrency(annualInterest + annualFee + (monthlyPayment * 12), currency)}</span>
                                        </div>
                                    </div>
                                ` : ''}
                                ${daysToPayment <= 10 ? `<div class="badge badge-warning" style="margin-top: 12px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>${daysToPayment} días para el pago</div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('') : `
                    <div class="card" style="grid-column: 1 / -1;">
                        <div class="empty-state">
                            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20M6 16h4"/></svg>
                            <h4 class="empty-state-title">Sin tarjetas</h4>
                            <p class="empty-state-description">Agrega tus tarjetas de crédito.</p>
                            <button class="btn btn-primary" onclick="openCardModal()">Agregar Tarjeta</button>
                        </div>
                    </div>
                `}
            </div>

            <div class="grid-2 page-section">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Uso de Crédito por Tarjeta</h3>
                    </div>
                    <div class="chart-container" style="height: 280px;">
                        <canvas id="cardsUsageChart"></canvas>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Distribución de Deuda</h3>
                    </div>
                    <div class="chart-container" style="height: 280px;">
                        <canvas id="cardsDebtChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => initCardsCharts(), 100);
}

function calculateCardDebt(cardId) {
    const card = store.state.creditCards.find(c => c.id === cardId);
    if (!card) return 0;
    const baseDebt = parseFloat(card.currentDebt) || 0;
    const interest = (parseFloat(card.interestRate) || 0) / 100 * baseDebt / 12;
    const autoFee = parseFloat(card.autoFee) || 0;
    const monthlyPayment = card.hasMonthlyPayment ? (parseFloat(card.monthlyPayment) || 0) : 0;
    return baseDebt + interest + autoFee + monthlyPayment;
}

function calculateCardTotalCost(card) {
    const baseDebt = parseFloat(card.currentDebt) || 0;
    const annualInterest = (parseFloat(card.interestRate) || 0) / 100 * baseDebt;
    const annualFees = (parseFloat(card.autoFee) || 0) * 12;
    const annualMonthlyPayments = card.hasMonthlyPayment ? ((parseFloat(card.monthlyPayment) || 0) * 12) : 0;
    return baseDebt + annualInterest + annualFees + annualMonthlyPayments;
}

function getDaysToPayment(paymentDay) {
    const today = new Date(); const currentDay = today.getDate();
    return paymentDay >= currentDay ? paymentDay - currentDay : (30 - currentDay) + paymentDay;
}

function adjustColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

function openCardModalById(id) {
    const card = store.state.creditCards.find(c => c.id === id);
    if (card) openCardModal(card);
}

function openCardModal(card = null) {
    const isEdit = !!card;
    modal.open({
        title: isEdit ? 'Editar Tarjeta' : 'Nueva Tarjeta',
        content: Forms.createCreditCardForm(card),
        footer: `<button class="btn btn-ghost" onclick="modal.close()">Cancelar</button>${isEdit ? `<button class="btn btn-danger" onclick="deleteCard(${card.id})">Eliminar</button>` : ''}<button class="btn btn-primary" onclick="${isEdit ? `updateCard(${card.id})` : 'saveCard()'}">${isEdit ? 'Actualizar' : 'Guardar'}</button>`
    });
    setupFormListeners();
}

async function saveCard() {
    if (window.preventSubmit()) return;
    const form = document.getElementById('creditCardForm');
    if (!form.checkValidity()) { form.reportValidity(); window.releaseSubmit(); return; }
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    if (data.nomenclatureCode && data.name) {
        await DB.saveNomenclatureCode(data.nomenclatureCode, data.name, null, 'expense');
    }
    const validatedLimit = window.validatePositiveNumber(data.creditLimit, 'Límite de Crédito');
    if (validatedLimit === null) { window.releaseSubmit(); return; }
    data.creditLimit = validatedLimit;
    data.cutoffDay = parseInt(data.cutoffDay);
    data.paymentDay = parseInt(data.paymentDay);
    data.hasMonthlyPayment = document.getElementById('hasMonthlyPayment')?.checked || false;
    if (data.currentDebt) data.currentDebt = parseFloat(data.currentDebt);
    if (data.interestRate) data.interestRate = parseFloat(data.interestRate);
    if (data.autoFee) data.autoFee = parseFloat(data.autoFee);
    if (data.monthlyPayment) data.monthlyPayment = parseFloat(data.monthlyPayment);
    if (data.autoPayAccountId) data.autoPayAccountId = parseInt(data.autoPayAccountId);
    try {
        await DB.dbAdd('creditCards', data);
        await store.refreshCreditCards();
        modal.close();
        toast.success('Tarjeta creada');
        router.navigate('cards');
    } catch (error) { toast.error('Error al crear tarjeta'); }
    finally { window.releaseSubmit(); }
}

async function updateCard(id) {
    if (window.preventSubmit()) return;
    const form = document.getElementById('creditCardForm');
    if (!form.checkValidity()) { form.reportValidity(); window.releaseSubmit(); return; }
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    if (data.nomenclatureCode && data.name) {
        await DB.saveNomenclatureCode(data.nomenclatureCode, data.name, null, 'expense');
    }
    data.id = id;
    const validatedLimit = window.validatePositiveNumber(data.creditLimit, 'Límite de Crédito');
    if (validatedLimit === null) { window.releaseSubmit(); return; }
    data.creditLimit = validatedLimit;
    data.cutoffDay = parseInt(data.cutoffDay);
    data.paymentDay = parseInt(data.paymentDay);
    data.hasMonthlyPayment = document.getElementById('hasMonthlyPayment')?.checked || false;
    if (data.currentDebt) data.currentDebt = parseFloat(data.currentDebt);
    if (data.interestRate) data.interestRate = parseFloat(data.interestRate);
    if (data.autoFee) data.autoFee = parseFloat(data.autoFee);
    if (data.monthlyPayment) data.monthlyPayment = parseFloat(data.monthlyPayment);
    if (data.autoPayAccountId) data.autoPayAccountId = parseInt(data.autoPayAccountId);
    try {
        await DB.dbPut('creditCards', data);
        await store.refreshCreditCards();
        modal.close();
        toast.success('Tarjeta actualizada');
        router.navigate('cards');
    } catch (error) { toast.error('Error al actualizar'); }
    finally { window.releaseSubmit(); }
}

async function deleteCard(id) {
    if (window.preventSubmit()) return;
    if (confirm('¿Eliminar esta tarjeta?')) {
        try {
            await DB.dbDelete('creditCards', id);
            await store.refreshCreditCards();
            modal.close();
            toast.success('Tarjeta eliminada');
            router.navigate('cards');
        } catch (error) { toast.error('Error al eliminar'); }
    }
    window.releaseSubmit();
}

let cardsUsageChartInstance = null;
let cardsDebtChartInstance = null;

function initCardsCharts() {
    if (cardsUsageChartInstance) { cardsUsageChartInstance.destroy(); cardsUsageChartInstance = null; }
    if (cardsDebtChartInstance) { cardsDebtChartInstance.destroy(); cardsDebtChartInstance = null; }

    const currency = store.state.settings.currency || 'USD';
    const cards = store.state.creditCards;

    const usageData = cards.map(c => {
        const limit = parseFloat(c.creditLimit) || 0;
        const debt = parseFloat(c.currentDebt) || 0;
        const available = limit - debt;
        return {
            name: c.name.length > 12 ? c.name.substring(0, 12) + '...' : c.name,
            debt,
            available,
            limit,
            color: c.color || '#2563EB'
        };
    });

    if (cards.length > 0 && document.getElementById('cardsUsageChart')) {
        cardsUsageChartInstance = new Chart(document.getElementById('cardsUsageChart'), {
            type: 'bar',
            data: {
                labels: usageData.map(c => c.name),
                datasets: [
                    {
                        label: 'Disponible',
                        data: usageData.map(c => c.available),
                        backgroundColor: '#059669',
                        stack: 'total'
                    },
                    {
                        label: 'Utilizado',
                        data: usageData.map(c => c.debt),
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
        window.registerChart('cardsUsageChart', cardsUsageChartInstance);
    }

    const debtData = cards.map(c => ({
        name: c.name,
        debt: parseFloat(c.currentDebt) || 0,
        color: c.color || '#2563EB'
    })).filter(c => c.debt > 0);

    if (debtData.length > 0 && document.getElementById('cardsDebtChart')) {
        cardsDebtChartInstance = new Chart(document.getElementById('cardsDebtChart'), {
            type: 'doughnut',
            data: {
                labels: debtData.map(c => c.name),
                datasets: [{
                    data: debtData.map(c => c.debt),
                    backgroundColor: debtData.map(c => c.color),
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
        window.registerChart('cardsDebtChart', cardsDebtChartInstance);
    }
}

window.renderCards = renderCards;
window.openCardModal = openCardModal;
window.saveCard = saveCard;
window.updateCard = updateCard;
window.deleteCard = deleteCard;
window.calculateCardDebt = calculateCardDebt;
window.calculateCardTotalCost = calculateCardTotalCost;
window.getDaysToPayment = getDaysToPayment;
window.adjustColor = adjustColor;

router.register('cards', renderCards);