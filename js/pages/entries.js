function renderEntries() {
    const content = document.getElementById('contentArea');
    const period = store.getViewPeriod();
    const entries = store.state.entries.filter(e => {
        const cat = store.getCategoryInfo(e.category);
        return cat.type === 'income';
    });
    const filteredEntries = store.getFilteredData(entries, period);
    const currency = store.state.settings.currency || 'USD';
    const totalIncome = preciseRound(filteredEntries.reduce((s, e) => s + parseFloat(e.amount), 0), 2);
    const recurringCount = filteredEntries.filter(e => e.recurring).length;
    const avgAmount = preciseRound(filteredEntries.length > 0 ? totalIncome / filteredEntries.length : 0, 2);
    const maxEntry = filteredEntries.length > 0 ? Math.max(...filteredEntries.map(e => parseFloat(e.amount))) : 0;
    const linkedDebts = filteredEntries.filter(e => e.linkedDebtId).length;

    content.innerHTML = `
        <div class="fade-in">
            <div class="page-header">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <h1 class="page-title-main">Entradas</h1>
                        <p class="page-description">${period.label}</p>
                    </div>
                    <div class="page-actions">
                        <button class="btn btn-primary" onclick="openEntryModal()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                            Nueva Entrada
                        </button>
                        <div class="export-menu">
                            <button class="btn btn-secondary" onclick="toggleExportMenu(this)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                Exportar
                            </button>
                            <div class="export-dropdown" id="exportDropdownEntries">
                                <button onclick="exportPageData('entries', 'json')">JSON</button>
                                <button onclick="exportPageData('entries', 'csv')">CSV</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="kpi-cards-3col page-section">
                <div class="card stat-card">
                    <span class="stat-label">Total Entradas</span>
                    <span class="stat-value text-income">+${store.formatCurrency(totalIncome, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Transacciones</span>
                    <span class="stat-value">${filteredEntries.length}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Promedio</span>
                    <span class="stat-value">${store.formatCurrency(avgAmount, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Mayor Entrada</span>
                    <span class="stat-value text-income">${store.formatCurrency(maxEntry, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Recurrentes</span>
                    <span class="stat-value">${recurringCount}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Vinculadas a Deudas</span>
                    <span class="stat-value">${linkedDebts}</span>
                </div>
            </div>

            <div class="grid-2 page-section">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Entradas por Categoría</h3>
                    </div>
                    <div class="chart-container" style="height: 280px;">
                        <canvas id="entriesByCategoryChart"></canvas>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Evolución Mensual (6 meses)</h3>
                    </div>
                    <div class="chart-container" style="height: 280px;">
                        <canvas id="entriesTrendChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="card page-section">
                ${filteredEntries.length > 0 ? `
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Título</th>
                                <th>Fecha</th>
                                <th>Categoría</th>
                                <th>Cuenta</th>
                                <th>Monto</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredEntries.sort((a, b) => new Date(b.date) - new Date(a.date)).map(entry => `
                                <tr>
                                    <td><span style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted);">${escapeHtml(entry.nomenclatureCode) || '-'}</span></td>
                                    <td><strong>${escapeHtml(entry.title)}</strong>${entry.recurring ? ' <span class="badge badge-purple">Recurrente</span>' : ''}</td>
                                    <td>${store.formatDate(entry.date)}</td>
                                    <td><span class="badge badge-success">${escapeHtml(store.getCategoryInfo(entry.category).name)}</span></td>
                                    <td>${escapeHtml(store.getAccountInfo(entry.accountId).name)}</td>
                                    <td class="transaction-amount income">+${store.formatCurrency(parseFloat(entry.amount), currency)}</td>
                                    <td>
                                        <div style="display: flex; gap: 8px;">
                                            <button class="btn btn-ghost btn-sm" onclick="editEntry(${entry.id})">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                            </button>
                                            <button class="btn btn-ghost btn-sm" onclick="deleteEntry(${entry.id})">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `
                    <div class="empty-state">
                        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M17 7l-5-5-5 5"/></svg>
                        <h4 class="empty-state-title">Sin entradas</h4>
                        <p class="empty-state-description">¡Comienza agregando tus fuentes de ingreso!</p>
                        <button class="btn btn-primary" onclick="openEntryModal()">Agregar Entrada</button>
                    </div>
                `}
            </div>
        </div>
    `;

    setTimeout(() => initEntriesCharts(), 100);
}

function openEntryModal(entry = null) {
    const isEdit = !!entry;
    modal.open({
        title: isEdit ? 'Editar Entrada' : 'Nueva Entrada',
        content: Forms.createEntryForm(entry),
        footer: `
            <button class="btn btn-ghost" onclick="modal.close()">Cancelar</button>
            <button class="btn btn-primary" onclick="${isEdit ? `updateEntry(${entry.id})` : 'saveEntry()'}">${isEdit ? 'Actualizar' : 'Guardar'}</button>
        `
    });
    setupFormListeners();
}

async function editEntry(id) {
    const entry = await DB.dbGet('entries', id);
    if (entry) openEntryModal(entry);
}

async function updateEntry(id) {
    if (window.preventSubmit()) return;
    const form = document.getElementById('entryForm');
    if (!form.checkValidity()) { form.reportValidity(); window.releaseSubmit(); return; }
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.id = id;
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
        await DB.dbPut('entries', data);
        await store.refreshEntries();
        modal.close();
        toast.success('Entrada actualizada');
        router.navigate('entries');
    } catch (error) { toast.error('Error al actualizar'); }
    finally { window.releaseSubmit(); }
}

async function deleteEntry(id) {
    if (window.preventSubmit()) return;
    if (confirm('¿Eliminar esta entrada?')) {
        try {
            await DB.dbDelete('entries', id);
            await store.refreshEntries();
            toast.success('Entrada eliminada');
            router.navigate('entries');
        } catch (error) { toast.error('Error al eliminar'); }
    }
    window.releaseSubmit();
}

window.renderEntries = renderEntries;
window.openEntryModal = openEntryModal;
window.editEntry = editEntry;
window.updateEntry = updateEntry;
window.deleteEntry = deleteEntry;

let entriesByCategoryChartInstance = null;
let entriesTrendChartInstance = null;

function initEntriesCharts() {
    // Destroy old charts
    if (entriesByCategoryChartInstance) { entriesByCategoryChartInstance.destroy(); entriesByCategoryChartInstance = null; }
    if (entriesTrendChartInstance) { entriesTrendChartInstance.destroy(); entriesTrendChartInstance = null; }

    const period = store.getViewPeriod();
    const currency = store.state.settings.currency || 'USD';
    const entries = store.state.entries.filter(e => {
        const cat = store.getCategoryInfo(e.category);
        return cat.type === 'income';
    });
    const filteredEntries = store.getFilteredData(entries, period);

    // Entradas por categoría - Dona
    const byCategory = {};
    filteredEntries.forEach(e => {
        const cat = store.getCategoryInfo(e.category);
        if (!byCategory[cat.name]) byCategory[cat.name] = { total: 0, color: cat.color || '#059669' };
        byCategory[cat.name].total += parseFloat(e.amount);
    });

    const categoryLabels = Object.keys(byCategory);
    const categoryData = Object.values(byCategory).map(c => c.total);
    const categoryColors = Object.values(byCategory).map(c => c.color);

    if (categoryLabels.length > 0 && document.getElementById('entriesByCategoryChart')) {
        entriesByCategoryChartInstance = new Chart(document.getElementById('entriesByCategoryChart'), {
            type: 'doughnut',
            data: {
                labels: categoryLabels,
                datasets: [{
                    data: categoryData,
                    backgroundColor: categoryColors,
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
        window.registerChart('entriesByCategoryChart', entriesByCategoryChartInstance);
    }

    // Evolución mensual - Línea
    const monthlyLabels = [];
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthName = d.toLocaleDateString('es-ES', { month: 'short' });
        monthlyLabels.push(monthName);

        const monthEntries = store.state.entries.filter(e => {
            const cat = store.getCategoryInfo(e.category);
            return cat.type === 'income' && e.date.startsWith(monthStr);
        });
        const total = monthEntries.reduce((s, e) => s + parseFloat(e.amount), 0);
        monthlyData.push(preciseRound(total, 2));
    }

    if (document.getElementById('entriesTrendChart')) {
        entriesTrendChartInstance = new Chart(document.getElementById('entriesTrendChart'), {
        type: 'line',
        data: {
            labels: monthlyLabels,
            datasets: [{
                label: 'Entradas',
                data: monthlyData,
                borderColor: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#059669'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: '#E5E7EB' }, beginAtZero: true }
            }
        }
    });
    window.registerChart('entriesTrendChart', entriesTrendChartInstance);
}
}

router.register('entries', renderEntries);