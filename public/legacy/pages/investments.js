function renderInvestments() {
    const content = document.getElementById('contentArea');
    const investments = store.state.investments;
    const currency = store.state.settings.currency || 'USD';

    const totalInvested = preciseRound(investments.reduce((sum, i) => sum + parseFloat(i.investedAmount), 0), 2);
    const totalCurrent = preciseRound(investments.reduce((sum, i) => sum + parseFloat(i.currentValue), 0), 2);
    const totalGain = preciseRound(totalCurrent - totalInvested, 2);
    const totalGainPercent = totalInvested > 0 ? preciseRound((totalGain / totalInvested) * 100, 2) : 0;
    const avgInvestment = preciseRound(investments.length > 0 ? totalInvested / investments.length : 0, 2);
    const bestInvestment = investments.length > 0 ? investments.reduce((best, i) => {
        const gain = parseFloat(i.currentValue) - parseFloat(i.investedAmount);
        const bestGain = parseFloat(best.currentValue) - parseFloat(best.investedAmount);
        return gain > bestGain ? i : best;
    }) : null;

    const byType = {};
    investments.forEach(inv => {
        if (!byType[inv.type]) byType[inv.type] = { total: 0, count: 0 };
        byType[inv.type].total += parseFloat(inv.currentValue);
        byType[inv.type].count++;
    });

    content.innerHTML = `
        <div class="fade-in">
            <div class="page-header">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <h1 class="page-title-main">Inversiones</h1>
                        <p class="page-description">Rastrea tu portafolio</p>
                    </div>
                    <div class="page-actions">
                        <button class="btn btn-primary" onclick="openInvestmentModal()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                            Nueva Inversión
                        </button>
                        <div class="export-menu">
                            <button class="btn btn-secondary" onclick="toggleExportMenu(this)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                Exportar
                            </button>
                            <div class="export-dropdown">
                                <button onclick="exportPageData('investments', 'json')">JSON</button>
                                <button onclick="exportPageData('investments', 'csv')">CSV</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="kpi-cards-3col page-section">
                <div class="card stat-card"><span class="stat-label">Total Invertido</span><span class="stat-value">${store.formatCurrency(totalInvested, currency)}</span></div>
                <div class="card stat-card"><span class="stat-label">Valor Actual</span><span class="stat-value text-investment">${store.formatCurrency(totalCurrent, currency)}</span></div>
                <div class="card stat-card"><span class="stat-label">Ganancia/Pérdida</span><span class="stat-value ${totalGain >= 0 ? 'text-income' : 'text-expense'}">${totalGain >= 0 ? '+' : ''}${store.formatCurrency(totalGain, currency)}</span></div>
                <div class="card stat-card"><span class="stat-label">Rentabilidad</span><span class="stat-value ${totalGainPercent >= 0 ? 'text-income' : 'text-expense'}">${totalGainPercent >= 0 ? '+' : ''}${totalGainPercent.toFixed(2)}%</span></div>
                <div class="card stat-card"><span class="stat-label">N° Inversiones</span><span class="stat-value">${investments.length}</span></div>
                <div class="card stat-card"><span class="stat-label">Promedio</span><span class="stat-value">${store.formatCurrency(avgInvestment, currency)}</span></div>
            </div>

            ${investments.length > 0 ? `<div class="card page-section"><div class="chart-container" style="height: 250px;"><canvas id="investmentsByTypeChart"></canvas></div></div>` : ''}

            <div class="grid-auto-fill-lg page-section">
                ${investments.length > 0 ? investments.map(inv => {
                    const invType = DB.investmentTypes.find(t => t.id === inv.type);
                    const invested = parseFloat(inv.investedAmount) || 0;
                    const current = parseFloat(inv.currentValue) || 0;
                    const gain = current - invested;
                    const gainPercent = invested > 0 ? (gain / invested) * 100 : 0;
                    
                    return `
                        <div class="investment-card">
                            <div class="investment-header">
                                <div>
                                    <div class="investment-name">${escapeHtml(inv.name)}</div>
                                    <div class="investment-type">${invType?.name || inv.type}${inv.provider ? ` • ${escapeHtml(inv.provider)}` : ''}</div>
                                </div>
                                <button class="btn btn-ghost btn-sm" onclick="openInvestmentModal(${JSON.stringify(inv).replace(/"/g, '&quot;')})">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                            </div>
                            <div class="investment-stats">
                                <div class="investment-stat"><span class="investment-stat-label">Invertido</span><span class="investment-stat-value">${store.formatCurrency(invested, currency)}</span></div>
                                <div class="investment-stat"><span class="investment-stat-label">Valor Actual</span><span class="investment-stat-value">${store.formatCurrency(current, currency)}</span></div>
                                <div class="investment-stat"><span class="investment-stat-label">Ganancia</span><span class="investment-stat-value ${gain >= 0 ? 'positive' : 'negative'}">${gain >= 0 ? '+' : ''}${gainPercent.toFixed(2)}%</span></div>
                            </div>
                            <div style="margin-top: 12px; font-size: var(--text-sm); color: var(--text-muted);">
                                <div>Fecha: ${store.formatDate(inv.investmentDate)}</div>
                                ${inv.maturityDate ? `<div>Vence: ${store.formatDate(inv.maturityDate)}</div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('') : `
                    <div class="card" style="grid-column: 1 / -1;">
                        <div class="empty-state">
                            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg>
                            <h4 class="empty-state-title">Sin inversiones</h4>
                            <p class="empty-state-description">Agrega tus inversiones.</p>
                            <button class="btn btn-primary" onclick="openInvestmentModal()">Agregar Inversión</button>
                        </div>
                    </div>
                `}
            </div>
        </div>
    `;

    if (investments.length > 0) initInvestmentsChart(byType);
}

let investmentsByTypeChartInstance = null;

function initInvestmentsChart(byType) {
    if (investmentsByTypeChartInstance) { investmentsByTypeChartInstance.destroy(); investmentsByTypeChartInstance = null; }

    const labels = Object.keys(byType).map(type => DB.investmentTypes.find(t => t.id === type)?.name || type);
    const data = Object.values(byType).map(v => v.total);

    if (document.getElementById('investmentsByTypeChart')) {
        investmentsByTypeChartInstance = new Chart(document.getElementById('investmentsByTypeChart'), {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: ['#2563EB', '#7C3AED', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#84CC16'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { family: 'Raleway', size: 12 }, padding: 12, usePointStyle: true } } } }
        });
        window.registerChart('investmentsByTypeChart', investmentsByTypeChartInstance);
    }
}

function openInvestmentModal(investment = null) {
    const isEdit = !!investment;
    modal.open({
        title: isEdit ? 'Editar Inversión' : 'Nueva Inversión',
        content: Forms.createInvestmentForm(investment),
        footer: `<button class="btn btn-ghost" onclick="modal.close()">Cancelar</button>${isEdit ? `<button class="btn btn-danger" onclick="deleteInvestment(${investment.id})">Eliminar</button>` : ''}<button class="btn btn-primary" onclick="${isEdit ? `updateInvestment(${investment.id})` : 'saveInvestment()'}">${isEdit ? 'Actualizar' : 'Guardar'}</button>`
    });
    setupFormListeners();
}

async function saveInvestment() {
    if (window.preventSubmit()) return;
    const form = document.getElementById('investmentForm');
    if (!form.checkValidity()) { form.reportValidity(); window.releaseSubmit(); return; }
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    if (data.nomenclatureCode && data.name) {
        await DB.saveNomenclatureCode(data.nomenclatureCode, data.name, null, 'expense');
    }
    const validatedInvested = window.validatePositiveNumber(data.investedAmount, 'Monto Invertido');
    if (validatedInvested === null) { window.releaseSubmit(); return; }
    data.investedAmount = validatedInvested;
    const validatedCurrent = window.validatePositiveNumber(data.currentValue, 'Valor Actual');
    if (validatedCurrent === null) { window.releaseSubmit(); return; }
    data.currentValue = validatedCurrent;
    if (data.accountId) data.accountId = parseInt(data.accountId);
    try {
        await DB.dbAdd('investments', data);
        await store.refreshInvestments();
        modal.close();
        toast.success('Inversión creada');
        router.navigate('investments');
    } catch (error) { toast.error('Error al crear inversión'); }
    finally { window.releaseSubmit(); }
}

async function updateInvestment(id) {
    if (window.preventSubmit()) return;
    const form = document.getElementById('investmentForm');
    if (!form.checkValidity()) { form.reportValidity(); window.releaseSubmit(); return; }
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    if (data.nomenclatureCode && data.name) {
        await DB.saveNomenclatureCode(data.nomenclatureCode, data.name, null, 'expense');
    }
    data.id = id;
    const validatedInvested = window.validatePositiveNumber(data.investedAmount, 'Monto Invertido');
    if (validatedInvested === null) { window.releaseSubmit(); return; }
    data.investedAmount = validatedInvested;
    const validatedCurrent = window.validatePositiveNumber(data.currentValue, 'Valor Actual');
    if (validatedCurrent === null) { window.releaseSubmit(); return; }
    data.currentValue = validatedCurrent;
    if (data.accountId) data.accountId = parseInt(data.accountId);
    try {
        await DB.dbPut('investments', data);
        await store.refreshInvestments();
        modal.close();
        toast.success('Inversión actualizada');
        router.navigate('investments');
    } catch (error) { toast.error('Error al actualizar'); }
    finally { window.releaseSubmit(); }
}

async function deleteInvestment(id) {
    if (window.preventSubmit()) return;
    if (confirm('¿Eliminar esta inversión?')) {
        try {
            await DB.dbDelete('investments', id);
            await store.refreshInvestments();
            modal.close();
            toast.success('Inversión eliminada');
            router.navigate('investments');
        } catch (error) { toast.error('Error al eliminar'); }
    }
    window.releaseSubmit();
}

window.renderInvestments = renderInvestments;
window.openInvestmentModal = openInvestmentModal;
window.saveInvestment = saveInvestment;
window.updateInvestment = updateInvestment;
window.deleteInvestment = deleteInvestment;

router.register('investments', renderInvestments);