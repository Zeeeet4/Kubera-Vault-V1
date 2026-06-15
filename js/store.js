class Store {
    constructor() {
        this.state = {
            currentPage: 'dashboard',
            currentView: 'month',
            currentDate: new Date(),
            accounts: [],
            entries: [],
            expenses: [],
            debts: [],
            creditCards: [],
            investments: [],
            categories: [],
            reminders: [],
            settings: {},
            isLoading: true
        };
        this.listeners = [];
    }

    getCurrentMonth() {
        const { currentDate } = this.state;
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    getViewPeriod() {
        const { currentView, currentDate } = this.state;
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        if (currentView === 'week') {
            const startOfWeek = new Date(currentDate);
            const day = startOfWeek.getDay();
            const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
            startOfWeek.setDate(diff);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return {
                start: startOfWeek.toISOString().split('T')[0],
                end: endOfWeek.toISOString().split('T')[0],
                label: `Semana del ${startOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
            };
        } else if (currentView === 'year') {
            return {
                start: `${year}-01-01`,
                end: `${year}-12-31`,
                label: `Año ${year}`
            };
        } else {
            const start = new Date(year, month, 1);
            const end = new Date(year, month + 1, 0);
            return {
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0],
                label: start.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
            };
        }
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notify();
    }

    setView(view) {
        this.setState({ currentView: view });
    }

    setCurrentDate(date) {
        this.setState({ currentDate: date });
    }

    navigatePeriod(direction) {
        const { currentView, currentDate } = this.state;
        const newDate = new Date(currentDate);

        if (currentView === 'week') {
            newDate.setDate(newDate.getDate() + (direction * 7));
        } else if (currentView === 'year') {
            newDate.setFullYear(newDate.getFullYear() + direction);
        } else {
            newDate.setMonth(newDate.getMonth() + direction);
        }

        this.setState({ currentDate: newDate });
    }

    async loadAllData() {
        this.setState({ isLoading: true });

        try {
            const [accounts, entries, expenses, debts, creditCards, investments, categories, reminders] = await Promise.all([
                DB.dbGetAll('accounts'),
                DB.dbGetAll('entries'),
                DB.dbGetAll('expenses'),
                DB.dbGetAll('debts'),
                DB.dbGetAll('creditCards'),
                DB.dbGetAll('investments'),
                DB.dbGetAll('categories'),
                DB.dbGetAll('reminders')
            ]);

            const customCats = await DB.getCustomCategories();
            const mergedCategories = [...categories, ...customCats];

            const settings = {};
            const settingsData = await DB.dbGetAll('settings');
            settingsData.forEach(s => settings[s.key] = s.value);

            this.setState({
                accounts,
                entries,
                expenses,
                debts,
                creditCards,
                investments,
                categories: mergedCategories,
                reminders,
                settings,
                isLoading: false
            });
        } catch (error) {
            console.error('Error loading data:', error);
            this.setState({ isLoading: false });
        }
    }

    async refreshAccounts() {
        const accounts = await DB.dbGetAll('accounts');
        this.setState({ accounts });
    }

    async refreshEntries() {
        const entries = await DB.dbGetAll('entries');
        this.setState({ entries });
        await this.updateAccountBalances();
    }

    async refreshExpenses() {
        const expenses = await DB.dbGetAll('expenses');
        this.setState({ expenses });
        await this.updateAccountBalances();
    }

    async refreshDebts() {
        const debts = await DB.dbGetAll('debts');
        this.setState({ debts });
    }

    async refreshCreditCards() {
        const creditCards = await DB.dbGetAll('creditCards');
        this.setState({ creditCards });
    }

    async refreshInvestments() {
        const investments = await DB.dbGetAll('investments');
        this.setState({ investments });
    }

    async refreshCategories() {
        try {
            const categories = await DB.dbGetAll('categories');
            const customCats = await DB.getCustomCategories();
            const merged = [...categories, ...customCats];
            this.setState({ categories: merged });
        } catch (err) {
            console.error('refreshCategories error:', err);
        }
    }

    async refreshReminders() {
        const reminders = await DB.dbGetAll('reminders');
        this.setState({ reminders });
    }

    async refreshAll() {
        try {
            const [accounts, entries, expenses, debts, creditCards, investments, categories, reminders, settingsData] = await Promise.all([
                DB.dbGetAll('accounts'),
                DB.dbGetAll('entries'),
                DB.dbGetAll('expenses'),
                DB.dbGetAll('debts'),
                DB.dbGetAll('creditCards'),
                DB.dbGetAll('investments'),
                DB.dbGetAll('categories'),
                DB.dbGetAll('reminders'),
                DB.dbGetAll('settings')
            ]);
            const customCats = await DB.getCustomCategories();
            const mergedCats = [...categories, ...customCats];
            const settings = {};
            settingsData.forEach(s => settings[s.key] = s.value);
            this.setState({ accounts, entries, expenses, debts, creditCards, investments, categories: mergedCats, reminders, settings });
        } catch (err) {
            console.error('refreshAll error:', err);
        }
    }

    async updateAccountBalances() {
        const accounts = await DB.dbGetAll('accounts');
        const entries = await DB.dbGetAll('entries');
        const expenses = await DB.dbGetAll('expenses');

        for (const account of accounts) {
            const accountEntries = entries.filter(e => parseInt(e.accountId) === account.id);
            const accountExpenses = expenses.filter(e => parseInt(e.accountId) === account.id);
            const totalIn = preciseRound(accountEntries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0), 2);
            const totalOut = preciseRound(accountExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0), 2);
            const baseBalance = parseFloat(account.baseBalance || 0);
            const calculatedBalance = preciseRound(baseBalance + totalIn - totalOut, 2);

            if (Math.abs(calculatedBalance - parseFloat(account.balance || 0)) > 0.01) {
                await DB.dbPut('accounts', { ...account, balance: calculatedBalance });
            }
        }

        const updatedAccounts = await DB.dbGetAll('accounts');
        this.setState({ accounts: updatedAccounts });
    }

    getFilteredData(data, period = null) {
        if (!period) {
            period = this.getViewPeriod();
        }
        return data.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= new Date(period.start) && itemDate <= new Date(period.end);
        });
    }

    calculateTotals(period = null) {
        const { entries, expenses, accounts, debts, investments } = this.state;
        if (!period) period = this.getViewPeriod();
        
        const filteredEntries = this.getFilteredData(entries, period);
        const filteredExpenses = this.getFilteredData(expenses, period);
        
        const totalIncome = preciseRound(filteredEntries.reduce((sum, e) => sum + parseFloat(e.amount), 0), 2);
        const totalExpenses = preciseRound(filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0), 2);
        const totalBalance = preciseRound(totalIncome - totalExpenses, 2);
        const savingsRate = totalIncome > 0 ? preciseRound(((totalIncome - totalExpenses) / totalIncome) * 100, 1) : 0;
        
        const totalDebt = preciseRound(debts.reduce((sum, d) => sum + parseFloat(d.currentBalance), 0), 2);
        
        const totalAccounts = preciseRound(accounts.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0), 2);
        const totalInvestments = preciseRound(investments.reduce((sum, i) => sum + parseFloat(i.currentValue || 0), 0), 2);
        
        const totalAssets = preciseRound(totalAccounts + totalInvestments, 2);
        const netWorth = preciseRound(totalAssets - totalDebt, 2);

        return {
            totalIncome,
            totalExpenses,
            totalBalance,
            savingsRate,
            totalDebt,
            totalAccounts,
            totalInvestments,
            totalAssets,
            netWorth
        };
    }

    getEntriesByCategory() {
        const period = this.getViewPeriod();
        const filteredEntries = this.getFilteredData(this.state.entries, period);
        const byCategory = {};
        filteredEntries.forEach(entry => {
            if (!byCategory[entry.category]) {
                byCategory[entry.category] = { total: 0, count: 0, items: [] };
            }
            byCategory[entry.category].total += parseFloat(entry.amount);
            byCategory[entry.category].count++;
            byCategory[entry.category].items.push(entry);
        });
        return byCategory;
    }

    getExpensesByCategory() {
        const period = this.getViewPeriod();
        const filteredExpenses = this.getFilteredData(this.state.expenses, period);
        const byCategory = {};
        filteredExpenses.forEach(expense => {
            if (!byCategory[expense.category]) {
                byCategory[expense.category] = { total: 0, count: 0, items: [] };
            }
            byCategory[expense.category].total += parseFloat(expense.amount);
            byCategory[expense.category].count++;
            byCategory[expense.category].items.push(expense);
        });
        return byCategory;
    }

    getRecentTransactions(limit = 5) {
        const { entries, expenses } = this.state;
        const allTransactions = [
            ...entries.map(e => ({ ...e, type: 'income' })),
            ...expenses.map(e => ({ ...e, type: 'expense' }))
        ];
        allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        return allTransactions.slice(0, limit);
    }

    formatCurrency(amount, currency = 'USD') {
        const currencyInfo = DB.getCurrencyByCode(currency);
        const preciseAmount = Math.round(Math.abs(amount) * 100) / 100;
        const formatted = preciseAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `${currencyInfo.symbol}${formatted}`;
    }

    formatCurrencyNoWrap(amount, currency = 'USD') {
        const currencyInfo = DB.getCurrencyByCode(currency);
        const preciseAmount = Math.round(Math.abs(amount) * 100) / 100;
        const formatted = preciseAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: false
        });
        return `${currencyInfo.symbol}${formatted}`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    getMonthName(monthStr) {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }

    getPreviousMonth(monthStr) {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 2);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    getNextMonth(monthStr) {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month));
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    getCategoryInfo(categoryId) {
        return this.state.categories.find(c => c.id === categoryId) || { name: categoryId, color: '#6B7280' };
    }

    getAccountInfo(accountId) {
        return this.state.accounts.find(a => a.id === accountId) || { name: 'Sin cuenta' };
    }
}

window.Store = Store;
window.store = new Store();

function setupFormListeners() {
    document.querySelectorAll('.color-picker').forEach(picker => {
        picker.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                picker.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                const hiddenInput = picker.parentElement.querySelector('input[type="hidden"]');
                if (hiddenInput) hiddenInput.value = option.dataset.color;
            });
        });
    });

    const customColorPicker = document.getElementById('customColorPicker') || document.getElementById('cardCustomColorPicker');
    if (customColorPicker) {
        customColorPicker.addEventListener('input', (e) => {
            const hiddenInput = e.target.closest('.input-group').querySelector('input[type="hidden"]');
            if (hiddenInput) hiddenInput.value = e.target.value;
        });
    }

    const bankSelect = document.querySelector('select[name="bankName"]');
    const bankCustomInput = document.getElementById('bankNameCustom');
    if (bankSelect && bankCustomInput) {
        bankSelect.addEventListener('change', () => {
            bankCustomInput.style.display = bankSelect.value === '__custom__' ? 'block' : 'none';
        });
    }

    const recurringCheck = document.getElementById('recurringCheck');
    if (recurringCheck) {
        recurringCheck.addEventListener('change', () => {
            const options = document.querySelector('.recurrence-options');
            if (options) options.style.display = recurringCheck.checked ? 'block' : 'none';
        });
    }

    const installmentCheck = document.getElementById('installmentCheck');
    if (installmentCheck) {
        installmentCheck.addEventListener('change', () => {
            const options = document.querySelector('.installment-options');
            if (options) options.style.display = installmentCheck.checked ? 'grid' : 'none';
        });
    }
}

window.setupFormListeners = setupFormListeners;

function applyNomenclatureCode(code) {
    if (!code) return;
    const titleEl = document.querySelector('input[name="title"]') || document.querySelector('input[name="name"]');
    const nomenInput = document.getElementById('nomenclatureCode');
    const nomenMode = document.getElementById('nomenclatureMode');
    if (nomenInput) {
        nomenInput.value = code;
        if (nomenMode) nomenMode.value = 'manual';
        nomenMode?.dispatchEvent(new Event('change'));
    }
}
window.applyNomenclatureCode = applyNomenclatureCode;
