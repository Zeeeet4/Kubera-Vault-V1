function renderReports() {
    const content = document.getElementById('contentArea');
    const currency = store.state.settings.currency || 'USD';

    content.innerHTML = `
        <div class="fade-in">
            <div class="page-header">
                <h1 class="page-title-main">Reportes</h1>
                <p class="page-description">Analiza tu estado financiero con gráficos detallados</p>
            </div>

            <div class="report-filters">
                <div class="filter-group">
                    <label class="filter-label">Período</label>
                    <select class="select filter-select" id="reportPeriod" onchange="updateReport()">
                        <option value="6months">Últimos 6 meses</option>
                        <option value="12months">Últimos 12 meses</option>
                        <option value="ytd">Año actual</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Comparar con período anterior</label>
                    <label class="toggle" id="compareToggle" onclick="toggleCompare()">
                        <div class="toggle-knob"></div>
                    </label>
                </div>
                <div class="filter-group" style="margin-left: auto;">
                    <label class="filter-label">Exportar</label>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-sm" onclick="exportPDF()">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                <path d="M14 2v6h6"/>
                            </svg>
                            PDF
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="exportJSON()">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                            </svg>
                            JSON
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="exportCSV()">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                <path d="M14 2v6h6"/>
                            </svg>
                            CSV
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="exportExcel()">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                <path d="M14 2v6h6"/>
                            </svg>
                            Excel
                        </button>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Estado de Resultados</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="pnlChart"></canvas>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Flujo de Caja</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="cashflowChart"></canvas>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Balance General</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="balanceChart"></canvas>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Gastos por Categoría</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="categoryChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-top: 24px;">
                <div class="card-header">
                    <h3 class="card-title">Resumen Financiero</h3>
                </div>
                <div id="summaryTable" style="overflow-x: auto;">
                </div>
            </div>
        </div>
    `;

    updateReport();
}

let pnlChartInstance = null;
let cashflowChartInstance = null;
let categoryChartInstance = null;
let balanceChartInstance = null;

function updateReport() {
    if (pnlChartInstance) { pnlChartInstance.destroy(); pnlChartInstance = null; }
    if (cashflowChartInstance) { cashflowChartInstance.destroy(); cashflowChartInstance = null; }
    if (categoryChartInstance) { categoryChartInstance.destroy(); categoryChartInstance = null; }

    const period = document.getElementById('reportPeriod')?.value || '6months';
    const months = period === '6months' ? 6 : period === '12months' ? 12 : new Date().getMonth() + 1;
    
    initPnLChart(months);
    initCashflowChart(months);
    initCategoryChart(months);
    updateSummaryTable(months);
}

function getMonthPeriod(monthsAgo) {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsAgo);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
    return { start, end, label: d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) };
}

function toggleCompare() {
    const toggle = document.getElementById('compareToggle');
    toggle.classList.toggle('active');
    updateReport();
}

function initPnLChart(months) {
    const labels = [];
    const incomeData = [];
    const expenseData = [];

    for (let i = months - 1; i >= 0; i--) {
        const period = getMonthPeriod(i);
        labels.push(period.label);

        const period2 = getMonthPeriod(i);
        const entries = store.getFilteredData(store.state.entries, period2);
        incomeData.push(entries.reduce((s, e) => s + parseFloat(e.amount), 0));

        const expenses = store.getFilteredData(store.state.expenses, period2);
        expenseData.push(expenses.reduce((s, e) => s + parseFloat(e.amount), 0));
    }

    if (document.getElementById('pnlChart')) {
        pnlChartInstance = new Chart(document.getElementById('pnlChart'), {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Ingresos', data: incomeData, backgroundColor: '#059669' },
                    { label: 'Gastos', data: expenseData, backgroundColor: '#DC2626' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: '#E5E7EB' }, beginAtZero: true }
                }
            }
        });
        window.registerChart('pnlChart', pnlChartInstance);
    }
}

function initCashflowChart(months) {
    const labels = [];
    const cashflowData = [];

    for (let i = months - 1; i >= 0; i--) {
        const period = getMonthPeriod(i);
        labels.push(period.label);

        const entries = store.getFilteredData(store.state.entries, period);
        const expenses = store.getFilteredData(store.state.expenses, period);
        const income = entries.reduce((s, e) => s + parseFloat(e.amount), 0);
        const expense = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
        cashflowData.push(income - expense);
    }

    if (document.getElementById('cashflowChart')) {
        cashflowChartInstance = new Chart(document.getElementById('cashflowChart'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Flujo Neto',
                    data: cashflowData,
                    borderColor: '#2563EB',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.4
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
        window.registerChart('cashflowChart', cashflowChartInstance);
    }
}

function initCategoryChart(months) {
    const categoryTotals = {};

    for (let i = months - 1; i >= 0; i--) {
        const period = getMonthPeriod(i);
        const expenses = store.getFilteredData(store.state.expenses, period);

        expenses.forEach(e => {
            const cat = store.getCategoryInfo(e.category);
            if (!categoryTotals[cat.name]) categoryTotals[cat.name] = 0;
            categoryTotals[cat.name] += parseFloat(e.amount);
        });
    }

    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    if (document.getElementById('categoryChart')) {
        categoryChartInstance = new Chart(document.getElementById('categoryChart'), {
            type: 'doughnut',
            data: {
                labels: sortedCategories.map(c => c[0]),
                datasets: [{
                    data: sortedCategories.map(c => c[1]),
                    backgroundColor: [
                        '#DC2626', '#EF4444', '#F87171', '#F97316',
                        '#FB923C', '#FBBF24', '#F59E0B', '#D97706'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } }
            }
        });
        window.registerChart('categoryChart', categoryChartInstance);
    }
}

function updateSummaryTable(months) {
    const container = document.getElementById('summaryTable');
    const currency = store.state.settings.currency || 'USD';
    const currencySym = DB.currencies.find(c => c.code === currency)?.symbol || '$';

    let totalIncome = 0, totalExpenses = 0;
    const monthlyData = [];

    for (let i = months - 1; i >= 0; i--) {
        const period = getMonthPeriod(i);

        const entries = store.getFilteredData(store.state.entries, period);
        const expenses = store.getFilteredData(store.state.expenses, period);
        const income = preciseRound(entries.reduce((s, e) => s + parseFloat(e.amount), 0), 2);
        const expense = preciseRound(expenses.reduce((s, e) => s + parseFloat(e.amount), 0), 2);

        totalIncome = preciseRound(totalIncome + income, 2);
        totalExpenses = preciseRound(totalExpenses + expense, 2);

        monthlyData.push({
            month: period.label,
            income,
            expense,
            net: preciseRound(income - expense, 2)
        });
    }

    const netTotal = preciseRound(totalIncome - totalExpenses, 2);
    const savingsRate = totalIncome > 0 ? preciseRound(((totalIncome - totalExpenses) / totalIncome) * 100, 1) : 0;
    const totals = store.calculateTotals();

    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Período</th>
                    <th>Ingresos</th>
                    <th>Gastos</th>
                    <th>Flujo Neto</th>
                </tr>
            </thead>
            <tbody>
                ${monthlyData.map(m => `
                    <tr>
                        <td><strong>${m.month}</strong></td>
                        <td style="color: var(--income-color);">+${currencySym}${m.income.toFixed(2)}</td>
                        <td style="color: var(--expense-color);">-${currencySym}${m.expense.toFixed(2)}</td>
                        <td style="color: ${m.net >= 0 ? 'var(--income-color)' : 'var(--expense-color)'};">
                            ${m.net >= 0 ? '+' : ''}${currencySym}${m.net.toFixed(2)}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr style="font-weight: 600; background: var(--bg-tertiary);">
                    <td>Total</td>
                    <td style="color: var(--income-color);">+${currencySym}${totalIncome.toFixed(2)}</td>
                    <td style="color: var(--expense-color);">-${currencySym}${totalExpenses.toFixed(2)}</td>
                    <td style="color: ${netTotal >= 0 ? 'var(--income-color)' : 'var(--expense-color)'};">
                        ${netTotal >= 0 ? '+' : ''}${currencySym}${netTotal.toFixed(2)}
                    </td>
                </tr>
            </tfoot>
        </table>
        <div class="kpi-cards page-section">
            <div class="card stat-card">
                <span class="stat-label">Savings Rate</span>
                <span class="stat-value ${savingsRate >= 20 ? 'text-income' : 'text-expense'}">${savingsRate.toFixed(1)}%</span>
            </div>
            <div class="card stat-card">
                <span class="stat-label">Ingreso Promedio</span>
                <span class="stat-value">${currencySym}${preciseRound(totalIncome / months, 2).toFixed(2)}</span>
            </div>
            <div class="card stat-card">
                <span class="stat-label">Gasto Promedio</span>
                <span class="stat-value">${currencySym}${preciseRound(totalExpenses / months, 2).toFixed(2)}</span>
            </div>
            <div class="card stat-card">
                <span class="stat-label">Patrimonio</span>
                <span class="stat-value ${totals.netWorth >= 0 ? 'text-income' : 'text-expense'}">${store.formatCurrency(totals.netWorth, currency)}</span>
            </div>
            <div class="card stat-card">
                <span class="stat-label">Deuda Total</span>
                <span class="stat-value text-expense">${store.formatCurrency(totals.totalDebt, currency)}</span>
            </div>
        </div>
    `;
}

async function exportJSON() {
    try {
        const data = await DB.exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `kubera-vault-export-${new Date().toISOString().split('T')[0]}.json`);
        toast.success('Datos exportados como JSON');
    } catch (error) {
        toast.error('Error al exportar datos');
    }
}

async function exportCSV() {
    try {
        const data = await DB.exportAllData();
        let csv = '\uFEFF';
        
        const tables = [
            { name: 'Entradas', data: data.entries, fields: ['title', 'amount', 'date', 'category', 'accountId', 'notes'] },
            { name: 'Gastos', data: data.expenses, fields: ['title', 'amount', 'date', 'category', 'accountId', 'beneficiary', 'notes'] },
            { name: 'Cuentas', data: data.accounts, fields: ['name', 'type', 'currency', 'balance', 'bankName'] },
            { name: 'Deudas', data: data.debts, fields: ['title', 'type', 'originalAmount', 'currentBalance', 'interestRate', 'periodicPayment'] },
            { name: 'Tarjetas', data: data.creditCards, fields: ['name', 'entity', 'lastDigits', 'creditLimit', 'cutoffDay', 'paymentDay'] },
            { name: 'Inversiones', data: data.investments, fields: ['name', 'type', 'investedAmount', 'currentValue', 'investmentDate'] }
        ];

        for (const table of tables) {
            if (table.data && table.data.length > 0) {
                csv += `\n${table.name}\n`;
                csv += table.fields.join(',') + '\n';
                table.data.forEach(row => {
                    csv += table.fields.map(f => {
                        const val = row[f];
                        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val ?? '';
                    }).join(',') + '\n';
                });
            }
        }

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        downloadBlob(blob, `kubera-vault-export-${new Date().toISOString().split('T')[0]}.csv`);
        toast.success('Datos exportados como CSV');
    } catch (error) {
        toast.error('Error al exportar datos');
    }
}

async function exportExcel() {
    toast.info('Para Excel, usa la exportación CSV o JSON. Puedes abrir JSON en Excel directamente.');
    exportJSON();
}

async function exportPDF() {
    try {
        const period = document.getElementById('reportPeriod')?.value || '6months';
        const months = period === '6months' ? 6 : period === '12months' ? 12 : new Date().getMonth() + 1;
        const currency = store.state.settings.currency || 'USD';
        const currencySym = DB.currencies.find(c => c.code === currency)?.symbol || '$';
        
        let totalIncome = 0, totalExpenses = 0;
        const monthlyData = [];
        
        for (let i = months - 1; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const monthName = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            const period2 = { start: monthStr + '-01', end: monthStr + '-31' };
            
            const entries = store.getFilteredData(store.state.entries, period2);
            const expenses = store.getFilteredData(store.state.expenses, period2);
            const income = preciseRound(entries.reduce((s, e) => s + parseFloat(e.amount), 0), 2);
            const expense = preciseRound(expenses.reduce((s, e) => s + parseFloat(e.amount), 0), 2);
            
            totalIncome = preciseRound(totalIncome + income, 2);
            totalExpenses = preciseRound(totalExpenses + expense, 2);
            monthlyData.push({ month: monthName, income, expense, net: preciseRound(income - expense, 2) });
        }
        
        const netTotal = preciseRound(totalIncome - totalExpenses, 2);
        const totals = store.calculateTotals();
        const savingsRate = totalIncome > 0 ? preciseRound(((totalIncome - totalExpenses) / totalIncome) * 100, 1) : 0;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Kubera Vault - Reporte Financiero</title>
                <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Raleway', sans-serif; padding: 40px; color: #1A1A2E; }
                    h1 { font-size: 24px; margin-bottom: 8px; }
                    h2 { font-size: 18px; margin: 24px 0 12px; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; }
                    .subtitle { color: #6B7280; margin-bottom: 24px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
                    th { text-align: left; font-size: 12px; color: #9CA3AF; text-transform: uppercase; padding: 8px 12px; border-bottom: 2px solid #E5E7EB; }
                    td { padding: 10px 12px; border-bottom: 1px solid #E5E7EB; font-size: 14px; white-space: nowrap; }
                    tfoot td { font-weight: 600; background: #F5F5F5; }
                    .income { color: #059669; }
                    .expense { color: #DC2626; }
                    .mono { font-family: 'Space Mono', monospace; white-space: nowrap; }
                    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 24px; }
                    .summary-item { text-align: center; padding: 16px; background: #F5F5F5; border-radius: 8px; }
                    .summary-label { font-size: 12px; color: #9CA3AF; }
                    .summary-value { font-size: 20px; font-weight: 700; font-family: 'Space Mono', monospace; white-space: nowrap; }
                    @media print { body { padding: 20px; } }
                </style>
            </head>
            <body>
                <h1>Kubera Vault - Reporte Financiero</h1>
                <p class="subtitle">Generado el ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                
                <h2>Resumen Mensual</h2>
                <table>
                    <thead><tr><th>Período</th><th>Ingresos</th><th>Gastos</th><th>Flujo Neto</th></tr></thead>
                    <tbody>
                        ${monthlyData.map(m => `
                            <tr>
                                <td><strong>${m.month}</strong></td>
                                <td class="income mono">+${currencySym}${m.income.toFixed(2)}</td>
                                <td class="expense mono">-${currencySym}${m.expense.toFixed(2)}</td>
                                <td class="mono" style="color: ${m.net >= 0 ? '#059669' : '#DC2626'}">${m.net >= 0 ? '+' : ''}${currencySym}${m.net.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td>Total</td>
                            <td class="income mono">+${currencySym}${totalIncome.toFixed(2)}</td>
                            <td class="expense mono">-${currencySym}${totalExpenses.toFixed(2)}</td>
                            <td class="mono" style="color: ${netTotal >= 0 ? '#059669' : '#DC2626'}">${netTotal >= 0 ? '+' : ''}${currencySym}${netTotal.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
                
                <h2>Indicadores Clave</h2>
                <div class="summary">
                    <div class="summary-item">
                        <div class="summary-label">Patrimonio Neto</div>
                        <div class="summary-value" style="color: ${totals.netWorth >= 0 ? '#059669' : '#DC2626'}">${store.formatCurrency(totals.netWorth, currency)}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Deuda Total</div>
                        <div class="summary-value expense">${store.formatCurrency(totals.totalDebt, currency)}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Savings Rate</div>
                        <div class="summary-value">${savingsRate.toFixed(1)}%</div>
                    </div>
                </div>
                
                <script>window.onload = function() { window.print(); }<\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
        toast.success('PDF generado - usa "Guardar como PDF" en el diálogo de impresión');
    } catch (error) {
        toast.error('Error al generar PDF');
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

window.renderReports = renderReports;
window.updateReport = updateReport;
window.exportJSON = exportJSON;
window.exportCSV = exportCSV;
window.exportExcel = exportExcel;
window.exportPDF = exportPDF;

router.register('reports', renderReports);
