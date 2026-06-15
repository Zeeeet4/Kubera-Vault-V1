import { store } from '../lib/store';
import { db } from '../lib/db';
import { escapeHtml } from '../lib/utils';
import type { Account, Debt, Entry, Expense, CreditCard, Investment } from '../lib/types';

export function createAccountForm(account: Account | null = null): string {
  const currency = (store.state.settings.currency as string) || 'USD';
  const banks = db.bankEntities;
  const isCustomBank = !!(account && account.bankName && !banks.find(b => b.name === account.bankName));

  return `
    <form id="accountForm" class="form" data-form="account">
      <div class="input-group">
        <label class="input-label">Nombre *</label>
        <input type="text" class="input" name="name" required value="${escapeHtml(account?.name || '')}" placeholder="Ej: Cuenta Principal">
      </div>
      <div class="input-group">
        <label class="input-label">Tipo de Cuenta *</label>
        <select class="select" name="type" required>
          <option value="">Seleccionar...</option>
          ${db.accountTypes.map(t => `
            <option value="${t.id}" ${account?.type === t.id ? 'selected' : ''}>${t.name}</option>
          `).join('')}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Banco/Institución</label>
        <select class="select" name="bankName" data-select="bank" onchange="var inp=document.getElementById('bankNameCustom');if(inp){inp.style.display=this.value==='__custom__'?'block':'none';if(this.value==='__custom__')inp.focus();}">
          <option value="">Seleccionar...</option>
          ${banks.map(b => `
            <option value="${b.name}" ${!isCustomBank && account?.bankName === b.name ? 'selected' : ''}>${b.name}</option>
          `).join('')}
          <option value="__custom__" ${isCustomBank ? 'selected' : ''}>+ Agregar nuevo</option>
        </select>
        <input type="text" class="input" name="bankNameCustom" id="bankNameCustom" style="display:${isCustomBank ? 'block' : 'none'}; margin-top: 8px;" placeholder="Nombre del banco/institución" value="${escapeHtml(isCustomBank ? account.bankName : '')}">
      </div>
      <div class="input-group">
        <label class="input-label">Moneda *</label>
        <select class="select" name="currency" required>
          ${db.currencies.map(c => `
            <option value="${c.code}" ${(account?.currency || currency) === c.code ? 'selected' : ''}>${c.name} (${c.symbol})</option>
          `).join('')}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Balance Inicial</label>
        <input type="number" class="input input-number" name="baseBalance" step="0.01" value="${account?.baseBalance || account?.balance || 0}" placeholder="0.00">
      </div>
      <div class="input-group">
        <label class="input-label">Color de Identificación</label>
        <div class="color-picker">
          ${db.accountColors.map(c => `
            <div class="color-option ${(!account?.color || account?.color === c) ? 'selected' : ''}" data-color="${c}" style="background-color: ${c}"></div>
          `).join('')}
          <input type="color" class="color-custom" value="${account?.color || '#2563EB'}" style="width: 32px; height: 32px; border: none; cursor: pointer; border-radius: 50%;">
        </div>
        <input type="hidden" name="color" value="${account?.color || '#2563EB'}">
      </div>
    </form>
  `;
}

export function createEntryForm(entry: Entry | null = null): string {
  const accounts = store.state.accounts;
  const nomenclatureMode = entry?.nomenclatureMode || 'manual';
  const savedCodes = db.getNomenclatureCodesSync();
  const incomeCodes = savedCodes.filter(c => c.type === 'income');

  return `
    <form id="entryForm" class="form" data-form="entry">
      <div class="input-group">
        <label class="input-label">Título *</label>
        <input type="text" class="input" name="title" required value="${entry?.title || ''}" placeholder="Ej: Pago de nómina">
      </div>
      <div class="input-group">
        <label class="input-label">Nomenclatura</label>
        ${incomeCodes.length > 0 ? `
        <div style="margin-bottom: 8px;">
          <label style="font-size: var(--text-xs); color: var(--text-muted);">Reutilizar código guardado</label>
          <select class="select" data-action="apply-nomen" style="font-size: var(--text-sm);">
            <option value="">— Nuevo código —</option>
            ${incomeCodes.map(c => `
              <option value="${escapeHtml(c.code)}" data-title="${escapeHtml(c.title)}">${escapeHtml(c.code)} — ${escapeHtml(c.title)}</option>
            `).join('')}
          </select>
        </div>
        ` : ''}
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
          <select class="select" name="nomenclatureMode" data-nomen-mode style="flex: 1;">
            <option value="manual" ${nomenclatureMode === 'manual' ? 'selected' : ''}>Manual</option>
            <option value="auto-siglas" ${nomenclatureMode === 'auto-siglas' ? 'selected' : ''}>Automático (siglas)</option>
            <option value="hybrid" ${nomenclatureMode === 'hybrid' ? 'selected' : ''}>Híbrido (siglas + código)</option>
          </select>
        </div>
        <div data-nomen-fields>
          <input type="text" class="input" name="nomenclatureCode" value="${entry?.nomenclatureCode || ''}" placeholder="Código manual (ej: SAL-01A)" style="font-family: var(--font-mono);">
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">Monto *</label>
        <input type="number" class="input input-number" name="amount" required step="0.01" min="0" value="${entry?.amount || ''}" placeholder="0.00">
      </div>
      <div class="input-group">
        <label class="input-label">Fecha *</label>
        <input type="date" class="input" name="date" required value="${entry?.date || new Date().toISOString().split('T')[0]}">
      </div>
      <div class="input-group">
        <label class="input-label">Categoría *</label>
        <select class="select" name="category" required>
          <option value="">Seleccionar...</option>
          ${store.state.categories.filter(c => c.type === 'income').map(c => `
            <option value="${c.id}" ${entry?.category === c.id ? 'selected' : ''}>${c.name}</option>
          `).join('')}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Cuenta Destino *</label>
        <select class="select" name="accountId" required>
          <option value="">Seleccionar...</option>
          ${accounts.map(a => `
            <option value="${a.id}" ${entry?.accountId === a.id ? 'selected' : ''}>${a.name}</option>
          `).join('')}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Deuda asociada (opcional)</label>
        <select class="select" name="linkedDebtId">
          <option value="">Ninguna</option>
          ${store.state.debts.map(d => `
            <option value="${d.id}" ${entry?.linkedDebtId === d.id ? 'selected' : ''}>${d.title}</option>
          `).join('')}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Notas</label>
        <textarea class="input textarea" name="notes" placeholder="Notas adicionales...">${entry?.notes || ''}</textarea>
      </div>
      <div class="input-group">
        <div class="checkbox-group">
          <input type="checkbox" class="checkbox" name="recurring" ${entry?.recurring ? 'checked' : ''}>
          <label>Es recurrente</label>
        </div>
      </div>
      <div class="input-group recurrence-options" style="display: ${entry?.recurring ? 'block' : 'none'}">
        <label class="input-label">Frecuencia</label>
        <select class="select" name="recurrenceFrequency">
          <option value="weekly" ${entry?.recurrenceFrequency === 'weekly' ? 'selected' : ''}>Semanal</option>
          <option value="biweekly" ${entry?.recurrenceFrequency === 'biweekly' ? 'selected' : ''}>Quincenal</option>
          <option value="monthly" ${entry?.recurrenceFrequency === 'monthly' ? 'selected' : ''}>Mensual</option>
        </select>
      </div>
    </form>
  `;
}

export function createExpenseForm(expense: Expense | null = null): string {
  const accounts = store.state.accounts;

  return `
    <form id="expenseForm" class="form" data-form="expense">
      <div class="input-group">
        <label class="input-label">Título *</label>
        <input type="text" class="input" name="title" required value="${expense?.title || ''}" placeholder="Ej: Compra supermercado">
      </div>
      <div class="input-group">
        <label class="input-label">Monto *</label>
        <input type="number" class="input input-number" name="amount" required step="0.01" min="0" value="${expense?.amount || ''}" placeholder="0.00">
      </div>
      <div class="input-group">
        <label class="input-label">Fecha *</label>
        <input type="date" class="input" name="date" required value="${expense?.date || new Date().toISOString().split('T')[0]}">
      </div>
      <div class="input-group">
        <label class="input-label">Categoría *</label>
        <select class="select" name="category" required>
          <option value="">Seleccionar...</option>
          ${store.state.categories.filter(c => c.type === 'expense').map(c => `
            <option value="${c.id}" ${expense?.category === c.id ? 'selected' : ''}>${c.name}</option>
          `).join('')}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Cuenta Origen *</label>
        <select class="select" name="accountId" required>
          <option value="">Seleccionar...</option>
          ${accounts.map(a => `
            <option value="${a.id}" ${expense?.accountId === a.id ? 'selected' : ''}>${a.name}</option>
          `).join('')}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Deuda asociada (opcional)</label>
        <select class="select" name="linkedDebtId">
          <option value="">Ninguna</option>
          ${store.state.debts.map(d => `
            <option value="${d.id}" ${expense?.linkedDebtId === d.id ? 'selected' : ''}>${d.title}</option>
          `).join('')}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Beneficiario</label>
        <input type="text" class="input" name="beneficiary" value="${expense?.beneficiary || ''}" placeholder="Ej: Tienda XYZ">
      </div>
      <div class="input-group">
        <label class="input-label">Notas</label>
        <textarea class="input textarea" name="notes" placeholder="Notas adicionales...">${expense?.notes || ''}</textarea>
      </div>
      <div class="input-group">
        <div class="checkbox-group">
          <input type="checkbox" class="checkbox" name="isInstallment" ${expense?.isInstallment ? 'checked' : ''}>
          <label>Es compra a cuotas</label>
        </div>
      </div>
      <div class="installment-options" style="display: ${expense?.isInstallment ? 'grid' : 'none'}; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div class="input-group">
          <label class="input-label">N° de Cuotas</label>
          <input type="number" class="input" name="installmentTotal" min="1" value="${expense?.installmentTotal || ''}" placeholder="Ej: 12">
        </div>
        <div class="input-group">
          <label class="input-label">Cuota Actual</label>
          <input type="number" class="input" name="installmentCurrent" min="1" value="${expense?.installmentCurrent || ''}" placeholder="1">
        </div>
      </div>
    </form>
  `;
}

export function createDebtForm(debt: Debt | null = null): string {
  const currency = (store.state.settings.currency as string) || 'USD';
  const accounts = store.state.accounts;
  const originalAmount = debt?.originalAmount || '';
  const savedCodes = db.getNomenclatureCodesSync();
  const debtCodes = savedCodes.filter(c => c.type === 'expense');
  const interestRate = debt?.interestRate || '';
  const periodicPayment = debt?.periodicPayment || '';
  const startDate = debt?.startDate || '';
  const estimatedEndDate = debt?.estimatedEndDate || '';

  let totalInterestEstimate = 0;
  let totalCostEstimate = 0;
  if (originalAmount && interestRate && periodicPayment && startDate) {
    const principal = parseFloat(String(originalAmount));
    const annualRate = parseFloat(String(interestRate)) / 100;
    const payment = parseFloat(String(periodicPayment));
    const start = new Date(startDate);
    const end = estimatedEndDate ? new Date(estimatedEndDate) : null;

    if (end && payment > 0) {
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      totalInterestEstimate = (payment * months) - principal;
      totalCostEstimate = payment * months;
    } else if (payment > 0 && annualRate > 0) {
      const monthsToPay = Math.ceil(principal / payment);
      const monthlyRate = annualRate / 12;
      let balance = principal;
      let totalPaid = 0;
      for (let i = 0; i < monthsToPay && balance > 0; i++) {
        const interest = balance * monthlyRate;
        totalPaid += payment;
        balance = balance + interest - payment;
        if (balance < 0) totalPaid += balance;
      }
      totalInterestEstimate = totalPaid - principal;
      totalCostEstimate = totalPaid;
    }
  }

  return `
    <form id="debtForm" class="form" data-form="debt">
      <div class="input-group">
        <label class="input-label">Título *</label>
        <input type="text" class="input" name="title" required value="${debt?.title || ''}" placeholder="Ej: Préstamo Hipotecario">
      </div>
      <div class="input-group">
        <label class="input-label">Nomenclatura</label>
        ${debtCodes.length > 0 ? `
        <div style="margin-bottom: 8px;">
          <label style="font-size: var(--text-xs); color: var(--text-muted);">Reutilizar código guardado</label>
          <select class="select" data-action="apply-nomen" style="font-size: var(--text-sm);">
            <option value="">— Nuevo código —</option>
            ${debtCodes.map(c => `
              <option value="${escapeHtml(c.code)}" data-title="${escapeHtml(c.title)}">${escapeHtml(c.code)} — ${escapeHtml(c.title)}</option>
            `).join('')}
          </select>
        </div>
        ` : ''}
        <input type="text" class="input" name="nomenclatureCode" value="${debt?.nomenclatureCode || ''}" placeholder="Código (ej: DEB-BCP-001)" style="font-family: var(--font-mono); font-size: var(--text-sm);">
      </div>
      <div class="input-group">
        <label class="input-label">Tipo de Deuda *</label>
        <select class="select" name="type" required>
          <option value="">Seleccionar...</option>
          ${db.debtTypes.map(t => `
            <option value="${t.id}" ${debt?.type === t.id ? 'selected' : ''}>${t.name}</option>
          `).join('')}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Monto Original *</label>
        <input type="number" class="input input-number" name="originalAmount" required step="0.01" min="0" value="${originalAmount}" placeholder="0.00">
      </div>
      <div class="input-group">
        <label class="input-label">Saldo Pendiente *</label>
        <input type="number" class="input input-number" name="currentBalance" required step="0.01" min="0" value="${debt?.currentBalance || ''}" placeholder="0.00">
      </div>
      <div class="input-group">
        <label class="input-label">Tasa de Interés (% anual)</label>
        <input type="number" class="input input-number" name="interestRate" step="0.01" min="0" value="${interestRate}" placeholder="Ej: 12.5">
      </div>
      ${totalInterestEstimate > 0 ? `
        <div style="background: var(--bg-tertiary); padding: 12px; border-radius: var(--radius-md); margin-bottom: 16px;">
          <div style="font-size: var(--text-sm); color: var(--text-muted); margin-bottom: 4px;">Estimación de intereses</div>
          <div style="display: flex; justify-content: space-between; font-size: var(--text-sm);">
            <span>Intereses estimados:</span>
            <span style="color: var(--accent-danger); font-family: var(--font-mono); font-weight: 600;">${store.formatCurrency(totalInterestEstimate, currency)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: var(--text-sm); font-weight: 600;">
            <span>Costo total:</span>
            <span style="font-family: var(--font-mono);">${store.formatCurrency(totalCostEstimate, currency)}</span>
          </div>
        </div>
      ` : ''}
      <div class="input-group">
        <label class="input-label">Cuota Periódica *</label>
        <input type="number" class="input input-number" name="periodicPayment" required step="0.01" min="0" value="${periodicPayment}" placeholder="0.00">
      </div>
      <div class="input-group">
        <label class="input-label">Frecuencia de Cuota</label>
        <select class="select" name="paymentFrequency">
          <option value="weekly" ${debt?.paymentFrequency === 'weekly' ? 'selected' : ''}>Semanal</option>
          <option value="biweekly" ${debt?.paymentFrequency === 'biweekly' ? 'selected' : ''}>Quincenal</option>
          <option value="monthly" ${debt?.paymentFrequency === 'monthly' ? 'selected' : ''}>Mensual</option>
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Fecha de Inicio *</label>
        <input type="date" class="input" name="startDate" required value="${startDate}">
      </div>
      <div class="input-group">
        <label class="input-label">Fecha Estimada Fin</label>
        <input type="date" class="input" name="estimatedEndDate" value="${estimatedEndDate}">
      </div>
      <div class="input-group">
        <label class="input-label">Acreedor</label>
        <input type="text" class="input" name="creditor" value="${debt?.creditor || ''}" placeholder="Ej: Banco XYZ">
      </div>
      <div class="input-group">
        <label class="input-label">Cuenta de Pago</label>
        <select class="select" name="accountId">
          <option value="">Seleccionar...</option>
          ${accounts.map(a => `
            <option value="${a.id}" ${debt?.accountId === a.id ? 'selected' : ''}>${a.name}</option>
          `).join('')}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Notas</label>
        <textarea class="input textarea" name="notes" placeholder="Notas adicionales...">${debt?.notes || ''}</textarea>
      </div>
    </form>
  `;
}

export function createCreditCardForm(card: CreditCard | null = null): string {
  const savedCodes = db.getNomenclatureCodesSync();
  const cardCodes = savedCodes.filter(c => c.type === 'expense');

  return `
    <form id="creditCardForm" class="form" data-form="card">
      <div class="input-group">
        <label class="input-label">Nombre *</label>
        <input type="text" class="input" name="name" required value="${card?.name || ''}" placeholder="Ej: Visa Oro">
      </div>
      <div class="input-group">
        <label class="input-label">Nomenclatura</label>
        ${cardCodes.length > 0 ? `
        <div style="margin-bottom: 8px;">
          <label style="font-size: var(--text-xs); color: var(--text-muted);">Reutilizar código guardado</label>
          <select class="select" data-action="apply-nomen" style="font-size: var(--text-sm);">
            <option value="">— Nuevo código —</option>
            ${cardCodes.map(c => `
              <option value="${escapeHtml(c.code)}" data-title="${escapeHtml(c.title)}">${escapeHtml(c.code)} — ${escapeHtml(c.title)}</option>
            `).join('')}
          </select>
        </div>
        ` : ''}
        <input type="text" class="input" name="nomenclatureCode" value="${card?.nomenclatureCode || ''}" placeholder="Código (ej: TC-VISA-001)" style="font-family: var(--font-mono); font-size: var(--text-sm);">
      </div>
      <div class="input-group">
        <label class="input-label">Entidad *</label>
        <select class="select" name="entity" required>
          <option value="">Seleccionar...</option>
          ${db.cardEntities.map(e => `
            <option value="${e.id}" ${card?.entity === e.id ? 'selected' : ''}>${e.name}</option>
          `).join('')}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Últimos 4 Dígitos</label>
        <input type="text" class="input" name="lastDigits" maxlength="4" value="${card?.lastDigits || ''}" placeholder="1234">
      </div>
      <div class="input-group">
        <label class="input-label">Límite de Crédito *</label>
        <input type="number" class="input input-number" name="creditLimit" required step="0.01" min="0" value="${card?.creditLimit || ''}" placeholder="0.00">
      </div>
      <div class="input-group">
        <label class="input-label">Deuda Actual</label>
        <input type="number" class="input input-number" name="currentDebt" step="0.01" min="0" value="${card?.currentDebt || ''}" placeholder="0.00">
      </div>
      <div class="input-group">
        <label class="input-label">Tasa de Interés (% anual)</label>
        <input type="number" class="input input-number" name="interestRate" step="0.01" min="0" value="${card?.interestRate || ''}" placeholder="Ej: 36">
      </div>
      <div class="input-group">
        <label class="input-label">Cargo automático mensual</label>
        <input type="number" class="input input-number" name="autoFee" step="0.01" min="0" value="${card?.autoFee || ''}" placeholder="0.00">
      </div>
      <div class="input-group" style="border-top: 1px solid var(--border-light); padding-top: 16px; margin-top: 8px;">
        <label class="input-label" style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" name="hasMonthlyPayment" id="hasMonthlyPayment" ${(card?.hasMonthlyPayment) ? 'checked' : ''} style="width: 18px; height: 18px;">
          ¿Tiene cuota mensual fija?
        </label>
        <div class="monthly-payment-field" style="display: ${(card?.hasMonthlyPayment) ? 'block' : 'none'}; margin-top: 12px;">
          <label class="input-label">Monto de cuota mensual</label>
          <input type="number" class="input input-number" name="monthlyPayment" step="0.01" min="0" value="${card?.monthlyPayment || ''}" placeholder="0.00">
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">Fecha de Corte (1-31) *</label>
        <input type="number" class="input" name="cutoffDay" required min="1" max="31" value="${card?.cutoffDay || '15'}">
      </div>
      <div class="input-group">
        <label class="input-label">Fecha de Pago (1-31) *</label>
        <input type="number" class="input" name="paymentDay" required min="1" max="31" value="${card?.paymentDay || '10'}">
      </div>
      <div class="input-group">
        <label class="input-label">Cuenta de Pago Automático</label>
        <select class="select" name="autoPayAccountId">
          <option value="">Ninguna</option>
          ${store.state.accounts.map(a => `
            <option value="${a.id}" ${card?.autoPayAccountId === a.id ? 'selected' : ''}>${a.name}</option>
          `).join('')}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Color</label>
        <div class="color-picker">
          ${db.accountColors.map(c => `
            <div class="color-option ${(!card?.color || card?.color === c) ? 'selected' : ''}" data-color="${c}" style="background-color: ${c}"></div>
          `).join('')}
          <input type="color" class="color-custom" value="${card?.color || '#2563EB'}" style="width: 32px; height: 32px; border: none; cursor: pointer; border-radius: 50%;">
        </div>
        <input type="hidden" name="color" value="${card?.color || '#2563EB'}">
      </div>
    </form>
  `;
}

export function createInvestmentForm(investment: Investment | null = null): string {
  const accounts = store.state.accounts;
  const savedCodes = db.getNomenclatureCodesSync();
  const invCodes = savedCodes.filter(c => c.type === 'expense');

  return `
    <form id="investmentForm" class="form" data-form="investment">
      <div class="input-group">
        <label class="input-label">Nombre *</label>
        <input type="text" class="input" name="name" required value="${investment?.name || ''}" placeholder="Ej: Depósito a Plazo BCP">
      </div>
      <div class="input-group">
        <label class="input-label">Nomenclatura</label>
        ${invCodes.length > 0 ? `
        <div style="margin-bottom: 8px;">
          <label style="font-size: var(--text-xs); color: var(--text-muted);">Reutilizar código guardado</label>
          <select class="select" data-action="apply-nomen" style="font-size: var(--text-sm);">
            <option value="">— Nuevo código —</option>
            ${invCodes.map(c => `
              <option value="${escapeHtml(c.code)}" data-title="${escapeHtml(c.title)}">${escapeHtml(c.code)} — ${escapeHtml(c.title)}</option>
            `).join('')}
          </select>
        </div>
        ` : ''}
        <input type="text" class="input" name="nomenclatureCode" value="${investment?.nomenclatureCode || ''}" placeholder="Código (ej: INV-DPF-001)" style="font-family: var(--font-mono); font-size: var(--text-sm);">
      </div>
      <div class="input-group">
        <label class="input-label">Tipo de Inversión *</label>
        <select class="select" name="type" required>
          <option value="">Seleccionar...</option>
          ${db.investmentTypes.map(t => `
            <option value="${t.id}" ${investment?.type === t.id ? 'selected' : ''}>${t.name}</option>
          `).join('')}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Monto Invertido *</label>
        <input type="number" class="input input-number" name="investedAmount" required step="0.01" min="0" value="${investment?.investedAmount || ''}" placeholder="0.00">
      </div>
      <div class="input-group">
        <label class="input-label">Valor Actual *</label>
        <input type="number" class="input input-number" name="currentValue" required step="0.01" min="0" value="${investment?.currentValue || ''}" placeholder="0.00">
      </div>
      <div class="input-group">
        <label class="input-label">Fecha de Inversión *</label>
        <input type="date" class="input" name="investmentDate" required value="${investment?.investmentDate || ''}">
      </div>
      <div class="input-group">
        <label class="input-label">Fecha de Vencimiento/Rescate</label>
        <input type="date" class="input" name="maturityDate" value="${investment?.maturityDate || ''}">
      </div>
      <div class="input-group">
        <label class="input-label">Proveedor/Plataforma</label>
        <input type="text" class="input" name="provider" value="${investment?.provider || ''}" placeholder="Ej: Broker XYZ">
      </div>
      <div class="input-group">
        <label class="input-label">Cuenta Asociada</label>
        <select class="select" name="accountId">
          <option value="">Ninguna</option>
          ${accounts.map(a => `
            <option value="${a.id}" ${investment?.accountId === a.id ? 'selected' : ''}>${a.name}</option>
          `).join('')}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Notas</label>
        <textarea class="input textarea" name="notes" placeholder="Notas adicionales...">${investment?.notes || ''}</textarea>
      </div>
    </form>
  `;
}
