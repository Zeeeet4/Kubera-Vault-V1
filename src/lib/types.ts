export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'expense';
}

export interface Account {
  id?: number;
  name: string;
  type: string;
  bankName?: string;
  currency: string;
  baseBalance: number;
  balance: number;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Entry {
  id?: number;
  title: string;
  amount: number;
  date: string;
  category: string;
  accountId: number;
  nomenclatureCode?: string;
  nomenclatureMode?: string;
  linkedDebtId?: number;
  notes?: string;
  recurring?: boolean;
  recurrenceFrequency?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id?: number;
  title: string;
  amount: number;
  date: string;
  category: string;
  accountId: number;
  nomenclatureCode?: string;
  linkedDebtId?: number;
  beneficiary?: string;
  notes?: string;
  isInstallment?: boolean;
  installmentTotal?: number;
  installmentCurrent?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Debt {
  id?: number;
  title: string;
  type: string;
  nomenclatureCode?: string;
  originalAmount: number;
  currentBalance: number;
  interestRate?: number;
  periodicPayment: number;
  paymentFrequency?: string;
  startDate: string;
  estimatedEndDate?: string;
  creditor?: string;
  accountId?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreditCard {
  id?: number;
  name: string;
  entity: string;
  nomenclatureCode?: string;
  lastDigits?: string;
  creditLimit: number;
  currentDebt: number;
  interestRate?: number;
  autoFee?: number;
  hasMonthlyPayment?: boolean;
  monthlyPayment?: number;
  cutoffDay: number;
  paymentDay: number;
  autoPayAccountId?: number;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Investment {
  id?: number;
  name: string;
  type: string;
  nomenclatureCode?: string;
  investedAmount: number;
  currentValue: number;
  investmentDate: string;
  maturityDate?: string;
  provider?: string;
  accountId?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Reminder {
  id?: number;
  title: string;
  date: string;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Setting {
  key: string;
  value: string | number | boolean;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ExportData {
  version: string;
  exportDate: string;
  settings: Setting[];
  accounts: Account[];
  entries: Entry[];
  expenses: Expense[];
  debts: Debt[];
  creditCards: CreditCard[];
  investments: Investment[];
  categories: Category[];
  reminders: Reminder[];
}

export interface AppState {
  currentPage: string;
  currentView: 'week' | 'month' | 'year';
  currentDate: Date;
  accounts: Account[];
  entries: Entry[];
  expenses: Expense[];
  debts: Debt[];
  creditCards: CreditCard[];
  investments: Investment[];
  categories: Category[];
  reminders: Reminder[];
  settings: Record<string, string | number | boolean>;
  isLoading: boolean;
}

export type CategoryTotals = Record<string, { total: number; count: number; items: Entry[] | Expense[] }>;

export interface PeriodInfo {
  start: string;
  end: string;
  label: string;
}

export interface Totals {
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  savingsRate: number;
  totalDebt: number;
  totalAccounts: number;
  totalInvestments: number;
  totalAssets: number;
  netWorth: number;
}
