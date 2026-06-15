function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function preciseRound(num, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
}

function preciseSum(arr) {
    return arr.reduce((sum, val) => {
        const num = parseFloat(val) || 0;
        return preciseRound(sum + num, 2);
    }, 0);
}

window.escapeHtml = escapeHtml;
window.preciseRound = preciseRound;
window.preciseSum = preciseSum;

window._isSubmitting = false;
window._chartInstances = {};

window.preventSubmit = function() {
    if (window._isSubmitting) return true;
    window._isSubmitting = true;
    setTimeout(() => { window._isSubmitting = false; }, 3000);
    return false;
};

window.releaseSubmit = function() {
    window._isSubmitting = false;
};

window.registerChart = function(key, chartInstance) {
    if (window._chartInstances[key]) {
        window._chartInstances[key].destroy();
    }
    window._chartInstances[key] = chartInstance;
};

window.destroyAllCharts = function() {
    Object.keys(window._chartInstances).forEach(key => {
        if (window._chartInstances[key]) {
            window._chartInstances[key].destroy();
            delete window._chartInstances[key];
        }
    });
};

window.validatePositiveNumber = function(value, fieldName) {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
        toast.error(`${fieldName} debe ser un número positivo`);
        return null;
    }
    return preciseRound(num, 2);
};

async function initApp() {
    try {
        await DB.initDB();
        await DB.initDefaultData();
        await store.loadAllData();
        
        // Check for old FinanceFlowDB data and offer migration
        const oldDbRequest = indexedDB.open('FinanceFlowDB', 1);
        oldDbRequest.onsuccess = async (e) => {
            const oldDb = e.target.result;
            const stores = Array.from(oldDb.objectStoreNames);
            console.log('Old FinanceFlowDB found with stores:', stores);
            
            let totalCount = 0;
            for (const storeName of stores) {
                const count = await new Promise(resolve => {
                    const tx = oldDb.transaction(storeName, 'readonly');
                    const store = tx.objectStore(storeName);
                    const req = store.count();
                    req.onsuccess = () => resolve(req.result);
                });
                totalCount += count;
                console.log(`  ${storeName}: ${count} records`);
            }
            
            if (totalCount > 0) {
                console.log('🔄 Found old data to migrate:', totalCount, 'records');
                toast.info(`Hay ${totalCount} registros en FinanceFlowDB. Usa Importar para migrar.`);
            }
            oldDb.close();
        };
        oldDbRequest.onerror = () => {
            console.log('No old FinanceFlowDB found');
        };
        
        if (store.state.settings.theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            updateThemeIcons(true);
        }
        
        const settings = store.state.settings;
        if (settings.incomeColor) document.documentElement.style.setProperty('--income-color', settings.incomeColor);
        if (settings.expenseColor) document.documentElement.style.setProperty('--expense-color', settings.expenseColor);
        if (settings.debtColor) document.documentElement.style.setProperty('--debt-color', settings.debtColor);
        if (settings.investmentColor) document.documentElement.style.setProperty('--investment-color', settings.investmentColor);
        
        setupEventListeners();
        updatePeriodLabel();
        router.navigate('dashboard');
        
        // Unregister any old service workers
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => {
                regs.forEach(reg => reg.unregister());
            }).catch(() => {});
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        toast.error('Error al inicializar la aplicación');
    }
}

function updateThemeIcons(isDark) {
    const lightIcon = document.querySelector('.theme-icon-light');
    const darkIcon = document.querySelector('.theme-icon-dark');
    if (lightIcon) lightIcon.style.display = isDark ? 'none' : 'block';
    if (darkIcon) darkIcon.style.display = isDark ? 'block' : 'none';
}

async function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        updateThemeIcons(false);
        await DB.dbSetSetting('theme', 'light');
        store.state.settings.theme = 'light';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcons(true);
        await DB.dbSetSetting('theme', 'dark');
        store.state.settings.theme = 'dark';
    }
    router.navigate(router.getCurrentPage());
}

function setupEventListeners() {
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            if (page) {
                router.navigate(page);
                const sidebar = document.getElementById('sidebar');
                if (sidebar) sidebar.classList.remove('open');
            }
        });
    });

    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    document.querySelector('.modal-overlay')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) modal.close();
    });

    document.getElementById('prevPeriod')?.addEventListener('click', () => {
        store.navigatePeriod(-1);
        updatePeriodLabel();
        router.navigate(router.getCurrentPage());
    });

    document.getElementById('nextPeriod')?.addEventListener('click', () => {
        store.navigatePeriod(1);
        updatePeriodLabel();
        router.navigate(router.getCurrentPage());
    });

    document.addEventListener('keydown', (e) => {
        // ESC no cierra modales - solo el boton X cierra
    });

    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

    document.getElementById('exportBtn')?.addEventListener('click', () => {
        router.navigate('settings');
        setTimeout(() => {
            if (typeof exportAllData === 'function') exportAllData();
        }, 300);
    });

    document.getElementById('importBtn')?.addEventListener('click', () => {
        router.navigate('settings');
        setTimeout(() => {
            const fileInput = document.getElementById('importFile');
            if (fileInput) fileInput.click();
        }, 300);
    });
}

function setView(view) {
    store.setView(view);
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    updatePeriodLabel();
    router.navigate(router.getCurrentPage());
}

function updatePeriodLabel() {
    const period = store.getViewPeriod();
    const label = document.getElementById('periodLabel');
    if (label) label.textContent = period.label;
}

document.addEventListener('DOMContentLoaded', initApp);