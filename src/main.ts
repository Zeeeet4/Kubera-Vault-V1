import { escapeHtml, preciseRound, preciseSum, generateSiglas, generateAutoCode, validatePositiveNumber } from './lib/utils';
import { db } from './lib/db';
import { store } from './lib/store';
import { router } from './lib/router';
import { modal } from './components/modal';
import { toast } from './components/toast';
import * as Forms from './components/forms';
import { registerDashboard } from './pages/dashboard';
import { hashPin, verifyPin, encryptData, decryptData, generateEncryptionKey, encryptStore, decryptStore } from './lib/crypto';

type ChartInstance = { destroy: () => void };
let isSubmitting = false;
const chartInstances: Record<string, ChartInstance> = {};

window.escapeHtml = escapeHtml;
window.preciseRound = preciseRound;
window.preciseSum = preciseSum as unknown as (arr: (string | number)[]) => number;
window.generateSiglas = generateSiglas;
window.generateAutoCode = generateAutoCode;
window.validatePositiveNumber = validatePositiveNumber;

const win: Record<string, unknown> = window as unknown as Record<string, unknown>;
win.DB = db;
win.store = store;
win.router = router;
win.modal = modal;
win.toast = toast;
win.Forms = Forms;

win.confirmDialog = function (message: string, onConfirm: () => void, options?: { title?: string; confirmText?: string; confirmClass?: string }) {
  const uid = '_cf' + Date.now();
  (window as unknown as Record<string, unknown>)[uid] = () => { onConfirm(); delete (window as unknown as Record<string, unknown>)[uid]; };
  modal.open({
    title: options?.title || 'Confirmar',
    content: `<p>${escapeHtml(message)}</p>`,
    footer: [
      '<button class="btn btn-ghost" onclick="delete window.',
      uid,
      '; window.modal.close();">Cancelar</button>',
      '<button class="btn ',
      options?.confirmClass || 'btn-primary',
      '" onclick="window.',
      uid,
      '(); window.modal.close();">',
      options?.confirmText || 'Confirmar',
      '</button>',
    ].join(''),
  });
};

win._isSubmitting = false;
win._chartInstances = {};
win.hashPin = hashPin;
win.verifyPin = verifyPin;
win.encryptData = encryptData;
win.decryptData = decryptData;
win.toggleTheme = toggleTheme;
win.setupFormListeners = setupGlobalFormListeners;
win.generateEncryptionKey = generateEncryptionKey;
win.encryptStore = encryptStore;
win.decryptStore = decryptStore;

win.preventSubmit = function () {
  if (isSubmitting) return true;
  isSubmitting = true;
  setTimeout(() => { isSubmitting = false; }, 3000);
  return false;
};

win.releaseSubmit = function () {
  isSubmitting = false;
};

win.registerChart = function (key: string, chartInstance: ChartInstance) {
  if (chartInstances[key]) {
    chartInstances[key].destroy();
  }
  chartInstances[key] = chartInstance;
};

win.destroyAllCharts = function () {
  Object.keys(chartInstances).forEach(key => {
    if (chartInstances[key]) {
      chartInstances[key].destroy();
      delete chartInstances[key];
    }
  });
};

function updateThemeIcons(isDark: boolean): void {
  const lightIcon = document.querySelector('.theme-icon-light') as HTMLElement | null;
  const darkIcon = document.querySelector('.theme-icon-dark') as HTMLElement | null;
  if (lightIcon) lightIcon.style.display = isDark ? 'none' : 'block';
  if (darkIcon) darkIcon.style.display = isDark ? 'block' : 'none';
}

async function toggleTheme(): Promise<void> {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    updateThemeIcons(false);
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeIcons(true);
  }
  await db.dbSetSetting('theme', isDark ? 'light' : 'dark');
  router.navigate(router.getCurrentPage());
}

function handleViewChange(view: string): void {
  store.setView(view as 'week' | 'month' | 'year');
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.view === view);
  });
  updatePeriodLabel();
  router.navigate(router.getCurrentPage());
}

function setupEventListeners(): void {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = (item as HTMLElement).dataset.page;
      if (page) router.navigate(page);
    });
  });

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = (btn as HTMLElement).dataset.view;
      if (view) handleViewChange(view);
    });
  });

  document.querySelector('.modal-overlay')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) modal.close();
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

  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

  document.getElementById('exportBtn')?.addEventListener('click', async () => {
    await router.navigate('settings');
    setTimeout(() => {
      const fn = (window as unknown as Record<string, unknown>).exportAllData;
      if (typeof fn === 'function') (fn as () => void)();
    }, 500);
  });

  document.getElementById('importBtn')?.addEventListener('click', async () => {
    await router.navigate('settings');
    setTimeout(() => {
      (document.getElementById('importFile') as HTMLInputElement | null)?.click();
    }, 500);
  });

  setupGlobalFormListeners();
}

function setupGlobalFormListeners(): void {
  document.addEventListener('change', (e) => {
    const target = e.target as HTMLElement;

    if (target.matches('select[name="bankName"]')) {
      const customInput = document.getElementById('bankNameCustom') as HTMLElement | null;
      if (customInput) {
        customInput.style.display = (target as HTMLSelectElement).value === '__custom__' ? 'block' : 'none';
      }
    }

    if (target.matches('[name="recurring"]')) {
      const opts = document.querySelector('.recurrence-options') as HTMLElement | null;
      if (opts) opts.style.display = (target as HTMLInputElement).checked ? 'block' : 'none';
    }

    if (target.matches('[name="isInstallment"]')) {
      const opts = document.querySelector('.installment-options') as HTMLElement | null;
      if (opts) opts.style.display = (target as HTMLInputElement).checked ? 'grid' : 'none';
    }

    if (target.matches('[name="hasMonthlyPayment"]')) {
      const field = target.closest('.input-group')?.querySelector('.monthly-payment-field') as HTMLElement | null;
      if (field) field.style.display = (target as HTMLInputElement).checked ? 'block' : 'none';
    }

    if (target.matches('[data-action="apply-nomen"]')) {
      const select = target as HTMLSelectElement;
      const nomenInput = document.getElementById('nomenclatureCode') as HTMLInputElement | null;
      const nomenMode = document.querySelector('[data-nomen-mode]') as HTMLSelectElement | null;
      if (nomenInput && select.value) {
        nomenInput.value = select.value;
        if (nomenMode) nomenMode.value = 'manual';
        nomenMode?.dispatchEvent(new Event('change'));
      }
    }

    if (target.matches('[data-nomen-mode]')) {
      const mode = (target as HTMLSelectElement).value;
      const container = document.querySelector('[data-nomen-fields]');
      if (!container) return;
      const titleInput = document.querySelector('input[name="title"]') as HTMLInputElement | null;

      if (mode === 'auto-siglas') {
        container.innerHTML = `<div style="display: flex; gap: 8px; align-items: center;">
          <span class="badge badge-primary" style="font-family: var(--font-mono);">${generateSiglas(titleInput?.value || '')}</span>
          <span style="color: var(--text-muted); font-size: var(--text-sm);">-${generateAutoCode()}</span>
        </div>`;
      } else if (mode === 'hybrid') {
        container.innerHTML = `<div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <span class="badge badge-primary" style="font-family: var(--font-mono);">${generateSiglas(titleInput?.value || '')}</span>
          <input type="text" class="input" name="nomenclatureCode" id="nomenclatureCode" placeholder="Código (ej: 01A)" style="width: 80px; font-family: var(--font-mono);">
          <span style="color: var(--text-muted); font-size: var(--text-sm);">-${generateAutoCode()}</span>
        </div>`;
      } else {
        container.innerHTML = `<input type="text" class="input" name="nomenclatureCode" placeholder="Código manual (ej: SAL-01A)" style="font-family: var(--font-mono);">`;
      }
    }

  });

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.matches('.color-option')) {
      const picker = target.closest('.color-picker');
      if (picker) {
        picker.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        target.classList.add('selected');
        const hiddenInput = picker.parentElement?.querySelector('input[type="hidden"]') as HTMLInputElement | null;
        if (hiddenInput) hiddenInput.value = (target as HTMLElement).dataset.color || '';
      }
    }
  });

  document.addEventListener('input', (e) => {
    const target = e.target as HTMLElement;

    if (target.matches('.color-custom')) {
      const hiddenInput = target.closest('.input-group')?.querySelector('input[type="hidden"]') as HTMLInputElement | null;
      if (hiddenInput) hiddenInput.value = (target as HTMLInputElement).value;
    }

    if (target.matches('input[name="title"]')) {
      const mode = (document.querySelector('[data-nomen-mode]') as HTMLSelectElement)?.value;
      if (mode === 'auto-siglas' || mode === 'hybrid') {
        const siglasEl = document.getElementById('autoSiglas') || document.getElementById('hybridSiglas');
        if (siglasEl) siglasEl.textContent = generateSiglas((target as HTMLInputElement).value);
      }
    }
  });
}

function updatePeriodLabel(): void {
  const period = store.getViewPeriod();
  const label = document.getElementById('periodLabel');
  if (label) label.textContent = period.label;
}

const LEGACY_FILES = [
  '/legacy/pages/entries.js',
  '/legacy/pages/expenses.js',
  '/legacy/pages/accounts.js',
  '/legacy/pages/debts.js',
  '/legacy/pages/cards.js',
  '/legacy/pages/investments.js',
  '/legacy/pages/reports.js',
  '/legacy/pages/settings-ui.js',
  '/legacy/pages/settings-data.js',
  '/legacy/pages/settings-categories.js',
  '/legacy/importers/mmbackup.js',
  '/legacy/app.js',
];

function loadLegacyScripts(): Promise<void> {
  return new Promise((resolve) => {
    let index = 0;
    function loadNext(): void {
      if (index >= LEGACY_FILES.length) { resolve(); return; }
      const script = document.createElement('script');
      script.src = LEGACY_FILES[index] + '?t=2028';
      script.onload = () => { index++; loadNext(); };
      script.onerror = () => { index++; loadNext(); };
      document.body.appendChild(script);
    }
    loadNext();
  });
}

let autoLockTimer: ReturnType<typeof setInterval> | null = null;
let pinLastActivity = Date.now();

function showPinOverlay(): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.getElementById('pinOverlay');
    if (!overlay) { resolve(); return; }
    const overlayEl = overlay as HTMLElement;
    overlayEl.style.display = 'flex';

    const input = document.getElementById('pinInput') as HTMLInputElement | null;
    const unlockBtn = document.getElementById('pinUnlockBtn');
    const errorEl = document.getElementById('pinError');
    const titleEl = document.getElementById('pinOverlayTitle');
    const subtitleEl = document.getElementById('pinSubtitle');
    const forgotBtn = document.getElementById('pinForgotBtn');

    if (titleEl) titleEl.textContent = 'Kubera Vault bloqueado';

    let attempts = 0;

    function resetOverlay() {
      if (input) input.value = '';
      if (errorEl) errorEl.textContent = '';
      attempts = 0;
      if (forgotBtn) forgotBtn.style.display = 'none';
      if (subtitleEl) subtitleEl.textContent = 'Ingresa tu PIN para desbloquear';
    }

    function handleForgotPin() {
      const confirmed = confirm('Esto borrará todos tus datos cifrados y desactivará el PIN. ¿Continuar?');
      if (!confirmed) return;
      const settings = store.state.settings as Record<string, unknown>;
      delete settings.pinEnabled;
      delete settings.pinHash;
      db.dbSetSetting('pinEnabled', false);
      db.dbSetSetting('pinHash', '');
      overlayEl.style.display = 'none';
      resetOverlay();
      location.reload();
    }

    function attemptUnlock() {
      const pin = input?.value || '';
      const hash = store.state.settings.pinHash;
      if (!hash || typeof hash !== 'string') {
        overlayEl.style.display = 'none';
        resolve();
        return;
      }
      verifyPin(pin, hash).then((ok) => {
        if (ok) {
          overlayEl.style.display = 'none';
          resetOverlay();
          pinLastActivity = Date.now();
          resolve();
        } else {
          attempts++;
          if (errorEl) errorEl.textContent = 'PIN incorrecto';
          if (input) { input.value = ''; input.focus(); }
          if (attempts >= 3 && forgotBtn) {
            forgotBtn.style.display = 'block';
          }
        }
      });
    }

    unlockBtn?.addEventListener('click', attemptUnlock);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') attemptUnlock();
    });
    forgotBtn?.addEventListener('click', handleForgotPin);
    input?.focus();
  });
}

function setupAutoLock(): void {
  const minutes = (store.state.settings.autoLockMinutes as number) || 15;
  const ms = minutes * 60 * 1000;

  function resetActivity() { pinLastActivity = Date.now(); }

  document.addEventListener('click', resetActivity);
  document.addEventListener('keydown', resetActivity);
  document.addEventListener('mousemove', resetActivity);
  document.addEventListener('touchstart', resetActivity);

  if (autoLockTimer) clearInterval(autoLockTimer);
  autoLockTimer = setInterval(() => {
    const pinHash = store.state.settings.pinHash;
    const pinEnabled = store.state.settings.pinEnabled;
    if (pinEnabled && pinHash && Date.now() - pinLastActivity >= ms) {
      showPinOverlay().then(() => { pinLastActivity = Date.now(); });
    }
  }, 10000);
}

async function initApp(): Promise<void> {
  try {
    await db.initDB();
    await db.initDefaultData();

    const settingsData = await db.dbGetAll<{ key: string; value: string | number | boolean }>('settings');
    const settings: Record<string, string | number | boolean> = {};
    settingsData.forEach(s => { settings[s.key] = s.value; });
    store.state.settings = settings;

    if (settings.pinEnabled && settings.pinHash) {
      await showPinOverlay();
    }

    registerDashboard();

    await loadLegacyScripts();

    await store.loadAllData();

    if (store.state.settings.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      updateThemeIcons(true);
    }

    const appSettings = store.state.settings as Record<string, string>;
    if (appSettings.incomeColor) document.documentElement.style.setProperty('--income-color', appSettings.incomeColor);
    if (appSettings.expenseColor) document.documentElement.style.setProperty('--expense-color', appSettings.expenseColor);
    if (appSettings.debtColor) document.documentElement.style.setProperty('--debt-color', appSettings.debtColor);
    if (appSettings.investmentColor) document.documentElement.style.setProperty('--investment-color', appSettings.investmentColor);

    setupEventListeners();
    updatePeriodLabel();
    router.navigate('dashboard');

    if (settings.pinEnabled && settings.pinHash) {
      setupAutoLock();
    }
  } catch (error) {
    console.error('Error initializing app:', error);
    toast.error('Error al inicializar la aplicación');
  }
}

document.addEventListener('DOMContentLoaded', initApp);
