function renderExpenses() {
    const content = document.getElementById('contentArea');
    const period = store.getViewPeriod();
    const expenses = store.state.expenses;
    const filteredExpenses = store.getFilteredData(expenses, period);
    const expensesByCategory = store.getExpensesByCategory();
    const currency = store.state.settings.currency || 'USD';
    const totalExpenses = preciseRound(filteredExpenses.reduce((s, e) => s + parseFloat(e.amount), 0), 2);
    const installmentCount = filteredExpenses.filter(e => e.isInstallment).length;
    const linkedDebts = filteredExpenses.filter(e => e.linkedDebtId).length;
    const avgExpense = preciseRound(filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0, 2);
    const maxExpense = filteredExpenses.length > 0 ? Math.max(...filteredExpenses.map(e => parseFloat(e.amount))) : 0;

    const categoryGroups = Object.entries(expensesByCategory).map(([catId, data]) => {
        const cat = store.getCategoryInfo(catId);
        return { ...cat, ...data };
    }).sort((a, b) => b.total - a.total);

    content.innerHTML = `
        <div class="fade-in">
            <div class="page-header">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <h1 class="page-title-main">Salidas</h1>
                        <p class="page-description">${period.label}</p>
                    </div>
                    <div class="page-actions">
                        <button class="btn btn-danger" onclick="openExpenseModal()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                            Nuevo Gasto
                        </button>
                        <div class="export-menu">
                            <button class="btn btn-secondary" onclick="toggleExportMenu(this)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                Exportar
                            </button>
                            <div class="export-dropdown" id="exportDropdownExpenses">
                                <button onclick="exportPageData('expenses', 'json')">JSON</button>
                                <button onclick="exportPageData('expenses', 'csv')">CSV</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="kpi-cards-3col page-section">
                <div class="card stat-card">
                    <span class="stat-label">Total Gastos</span>
                    <span class="stat-value text-expense">-${store.formatCurrency(totalExpenses, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Transacciones</span>
                    <span class="stat-value">${filteredExpenses.length}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Promedio</span>
                    <span class="stat-value">${store.formatCurrency(avgExpense, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Mayor Gasto</span>
                    <span class="stat-value text-expense">-${store.formatCurrency(maxExpense, currency)}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Cuotas Activas</span>
                    <span class="stat-value">${installmentCount}</span>
                </div>
                <div class="card stat-card">
                    <span class="stat-label">Vinculados a Deudas</span>
                    <span class="stat-value">${linkedDebts}</span>
                </div>
            </div>

            <div class="grid-2 page-section">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Gastos por Categoría</h3>
                    </div>
                    <div class="chart-container" style="height: 280px;">
                        <canvas id="expensesByCategoryChart"></canvas>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Evolución de Gastos (6 meses)</h3>
                    </div>
                    <div class="chart-container" style="height: 280px;">
                        <canvas id="expensesTrendChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="card page-section">
                ${categoryGroups.length > 0 ? categoryGroups.map(group => `
                    <div class="category-group">
                        <div class="category-header" onclick="toggleCategoryGroup('${group.id}')">
                            <div class="category-info">
                                <div class="category-icon" style="background-color: ${group.color}20; color: ${group.color};">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22V2M7 17l5 5 5-5"/></svg>
                                </div>
                                <div>
                                    <div class="category-name">${escapeHtml(group.name)}</div>
                                    <div class="category-count">${group.count} transacción${group.count !== 1 ? 'es' : ''}</div>
                                </div>
                            </div>
                            <div class="category-total" style="color: var(--expense-color);">-${store.formatCurrency(group.total, currency)}</div>
                        </div>
                        <div class="category-items" id="categoryItems-${group.id}" style="display: none;">
                            ${group.items.sort((a, b) => new Date(b.date) - new Date(a.date)).map(item => `
                                <div class="transaction-item" style="padding: 12px 16px;">
                                    <div class="transaction-details">
                                        <div class="transaction-title">${escapeHtml(item.title)}${item.isInstallment ? ` <span class="badge badge-warning">Cuota ${item.installmentCurrent}/${item.installmentTotal}</span>` : ''}</div>
                                        <div class="transaction-meta"><span>${store.formatDate(item.date)}</span>${item.beneficiary ? `<span>•</span><span>${escapeHtml(item.beneficiary)}</span>` : ''}${item.linkedDebtId ? `<span>•</span><span style="color: var(--accent-danger);">Deuda vinculada</span>` : ''}</div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div class="transaction-amount expense">-${store.formatCurrency(parseFloat(item.amount), currency)}</div>
                                        <button class="btn btn-ghost btn-sm" onclick="editExpense(${item.id})">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                        </button>
                                        <button class="btn btn-ghost btn-sm" onclick="deleteExpense(${item.id})">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('') : `
                    <div class="empty-state">
                        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22V2M7 17l5 5 5-5"/></svg>
                        <h4 class="empty-state-title">Sin gastos</h4>
                        <p class="empty-state-description">¡Excelente! Mantén ese ritmo.</p>
                        <button class="btn btn-danger" onclick="openExpenseModal()">Agregar Gasto</button>
                    </div>
                `}
            </div>
        </div>
    `;

    setTimeout(() => initExpensesCharts(), 100);
}

function toggleCategoryGroup(id) {
    const items = document.getElementById(`categoryItems-${id}`);
    if (!items) return;
    items.style.display = items.style.display === 'none' ? 'block' : 'none';
}

function openExpenseModal(expense = null) {
    const isEdit = !!expense;
    modal.open({
        title: isEdit ? 'Editar Gasto' : 'Nuevo Gasto',
        content: Forms.createExpenseForm(expense),
        footer: `<button class="btn btn-ghost" onclick="modal.close()">Cancelar</button><button class="btn btn-primary" onclick="${isEdit ? `updateExpense(${expense.id})` : 'saveExpense()'}">${isEdit ? 'Actualizar' : 'Guardar'}</button>`
    });
    setupFormListeners();
}

async function editExpense(id) {
    const expense = await DB.dbGet('expenses', id);
    if (expense) openExpenseModal(expense);
}

async function updateExpense(id) {
    if (window.preventSubmit()) return;
    const form = document.getElementById('expenseForm');
    if (!form.checkValidity()) { form.reportValidity(); window.releaseSubmit(); return; }
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.id = id;
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
        await DB.dbPut('expenses', data);
        
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
        toast.success('Gasto actualizado');
        router.navigate('expenses');
    } catch (error) { toast.error('Error al actualizar'); }
    finally { window.releaseSubmit(); }
}

async function deleteExpense(id) {
    if (window.preventSubmit()) return;
    if (confirm('¿Eliminar este gasto?')) {
        try {
            await DB.dbDelete('expenses', id);
            await store.refreshExpenses();
            toast.success('Gasto eliminado');
            router.navigate('expenses');
        } catch (error) { toast.error('Error al eliminar'); }
    }
    window.releaseSubmit();
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
    try {
        await DB.dbAdd('expenses', data);
        await store.refreshExpenses();
        modal.close();
        toast.success('Gasto guardado');
        router.navigate('expenses');
    } catch (error) { toast.error('Error al guardar'); }
    finally { window.releaseSubmit(); }
}

window.renderExpenses = renderExpenses;
window.openExpenseModal = openExpenseModal;
window.editExpense = editExpense;
window.updateExpense = updateExpense;
window.deleteExpense = deleteExpense;

let expensesByCategoryChartInstance = null;
let expensesTrendChartInstance = null;

function initExpensesCharts() {
    // Destroy old charts
    if (expensesByCategoryChartInstance) { expensesByCategoryChartInstance.destroy(); expensesByCategoryChartInstance = null; }
    if (expensesTrendChartInstance) { expensesTrendChartInstance.destroy(); expensesTrendChartInstance = null; }

    const period = store.getViewPeriod();
    const currency = store.state.settings.currency || 'USD';
    const expenses = store.getFilteredData(store.state.expenses, period);

    // Gastos por categoría - Dona
    const byCategory = {};
    expenses.forEach(e => {
        const cat = store.getCategoryInfo(e.category);
        if (!byCategory[cat.name]) byCategory[cat.name] = { total: 0, color: cat.color || '#DC2626' };
        byCategory[cat.name].total += parseFloat(e.amount);
    });

    const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total).slice(0, 8);
    const categoryLabels = sortedCategories.map(c => c[0]);
    const categoryData = sortedCategories.map(c => c[1].total);
    const categoryColors = sortedCategories.map(c => c[1].color);

    if (categoryLabels.length > 0 && document.getElementById('expensesByCategoryChart')) {
        expensesByCategoryChartInstance = new Chart(document.getElementById('expensesByCategoryChart'), {
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
        window.registerChart('expensesByCategoryChart', expensesByCategoryChartInstance);
    }

    // Evolución mensual - Barras
    const monthlyLabels = [];
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthName = d.toLocaleDateString('es-ES', { month: 'short' });
        monthlyLabels.push(monthName);

        const monthExpenses = store.state.expenses.filter(e => e.date.startsWith(monthStr));
        const total = monthExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
        monthlyData.push(preciseRound(total, 2));
    }

    if (document.getElementById('expensesTrendChart')) {
        expensesTrendChartInstance = new Chart(document.getElementById('expensesTrendChart'), {
        type: 'bar',
        data: {
            labels: monthlyLabels,
            datasets: [{
                label: 'Gastos',
                data: monthlyData,
                backgroundColor: '#DC2626'
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
    window.registerChart('expensesTrendChart', expensesTrendChartInstance);
}
}

router.register('expenses', renderExpenses);