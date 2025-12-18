
import { Account, AccountType, BudgetItem, Category, Jar, MonthlyBalance, SubCategory, TextCategoryRule, Transaction, TransactionType } from '../types';

const STORAGE_KEYS = {
  ACCOUNT_TYPES: 'finanza_account_types_v7',
  ACCOUNTS: 'finanza_accounts_v7',
  MONTHLY_BALANCES: 'finanza_monthly_balances_v7',
  CATEGORIES: 'finanza_categories_v7',
  SUBCATEGORIES: 'finanza_subcategories_v7',
  TRANSACTIONS: 'finanza_transactions_v7',
  BUDGET: 'finanza_budget_v7',
  JARS: 'finanza_jars_v7',
  RULES: 'finanza_rules_v7',
};

// --- SEED DATA ---
const seedAccountTypes: AccountType[] = [
  { id: 'type_cash', name: 'EFECTIVO', includeInCashflow: true, isActive: true, description: 'Dinero físico' },
  { id: 'type_bank', name: 'BANCO', includeInCashflow: true, isActive: true, description: 'Cuentas bancarias (CBU)' },
  { id: 'type_wallet', name: 'BILLETERA VIRTUAL', includeInCashflow: true, isActive: true, description: 'MercadoPago, Naranja X, etc (CVU)' },
  { id: 'type_invest', name: 'INVERSIÓN', includeInCashflow: false, isActive: true, description: 'Fondos no líquidos inmediatos' },
];

const seedAccounts: Account[] = [
  { id: 'acc_1', name: 'EFECTIVO', accountTypeId: 'type_cash', currency: 'ARS', isActive: true },
  { id: 'acc_3', name: 'CTA CP', accountTypeId: 'type_bank', currency: 'ARS', isActive: true },
  { id: 'acc_8', name: 'CTA. MERCP', accountTypeId: 'type_wallet', currency: 'ARS', isActive: true },
];

const seedCategories: Category[] = [
  { id: '1', name: 'AHORRO', type: TransactionType.OUT },
  { id: '2', name: 'ALIMENTOS', type: TransactionType.OUT },
  { id: '3', name: 'ALQUILER', type: TransactionType.OUT },
  { id: '4', name: 'COMIDA', type: TransactionType.OUT },
  { id: '5', name: 'EDUCACIÓN', type: TransactionType.OUT },
  { id: '7', name: 'INGRESOS', type: TransactionType.IN },
  { id: '12', name: 'SERVICIOS', type: TransactionType.OUT },
  { id: '13', name: 'SUSCRIPCIONES', type: TransactionType.OUT },
  { id: '15', name: 'VIÁTICOS', type: TransactionType.OUT },
];

const seedTransactions: Transaction[] = [
  // --- OCTUBRE 2024 ---
  { id: 't_oct_1', date: '2024-10-01', categoryId: '7', description: 'Sueldo Octubre', amount: 850000, type: TransactionType.IN, accountId: 'acc_3' },
  { id: 't_oct_2', date: '2024-10-05', categoryId: '3', description: 'Alquiler Depto', amount: 250000, type: TransactionType.OUT, accountId: 'acc_3' },
  { id: 't_oct_3', date: '2024-10-10', categoryId: '12', description: 'Expensas Oct', amount: 45000, type: TransactionType.OUT, accountId: 'acc_3' },
  { id: 't_oct_4', date: '2024-10-12', categoryId: '2', description: 'Compra Carcor', amount: 85000, type: TransactionType.OUT, accountId: 'acc_8' },
  { id: 't_oct_5', date: '2024-10-20', categoryId: '4', description: 'Cena Amigos', amount: 15000, type: TransactionType.OUT, accountId: 'acc_1' },
  
  // --- NOVIEMBRE 2024 ---
  { id: 't_nov_1', date: '2024-11-01', categoryId: '7', description: 'Sueldo Noviembre', amount: 850000, type: TransactionType.IN, accountId: 'acc_3' },
  { id: 't_nov_2', date: '2024-11-05', categoryId: '3', description: 'Alquiler Depto (Ajuste)', amount: 280000, type: TransactionType.OUT, accountId: 'acc_3' },
  { id: 't_nov_3', date: '2024-11-08', categoryId: '13', description: 'Netflix', amount: 8500, type: TransactionType.OUT, accountId: 'acc_8' },
  { id: 't_nov_4', date: '2024-11-15', categoryId: '2', description: 'Supermercado Vea', amount: 110000, type: TransactionType.OUT, accountId: 'acc_8' },
  { id: 't_nov_5', date: '2024-11-22', categoryId: '15', description: 'Carga SUBE', amount: 5000, type: TransactionType.OUT, accountId: 'acc_1' },
  { id: 't_nov_6', date: '2024-11-25', categoryId: '4', description: 'Delivery PedidosYa', amount: 12500, type: TransactionType.OUT, accountId: 'acc_8' },
];

const seedMonthlyBalances: MonthlyBalance[] = [
  { id: 'b_oct_3', accountId: 'acc_3', year: 2024, month: 9, amount: 120000 }, // Inicio Octubre
  { id: 'b_nov_3', accountId: 'acc_3', year: 2024, month: 10, amount: 675000 }, // Inicio Noviembre
  { id: 'b_dec_3', accountId: 'acc_3', year: 2024, month: 11, amount: 1245000 }, // Inicio Diciembre
];

function getOrSeed<T>(key: string, seed: T[]): T[] {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(stored);
}

export const StorageService = {
  getAccountTypes: (): AccountType[] => getOrSeed(STORAGE_KEYS.ACCOUNT_TYPES, seedAccountTypes),
  getAccounts: (): Account[] => getOrSeed(STORAGE_KEYS.ACCOUNTS, seedAccounts),
  saveAccounts: (data: Account[]) => localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(data)),
  addAccount: (acc: Account) => {
    const all = StorageService.getAccounts();
    all.push(acc);
    StorageService.saveAccounts(all);
  },
  updateAccount: (acc: Account) => {
    const all = StorageService.getAccounts();
    const idx = all.findIndex(a => a.id === acc.id);
    if (idx >= 0) {
      all[idx] = acc;
      StorageService.saveAccounts(all);
    }
  },
  deleteAccount: (id: string) => {
    const all = StorageService.getAccounts();
    const filtered = all.filter(a => a.id !== id);
    StorageService.saveAccounts(filtered);
  },

  getMonthlyBalances: (): MonthlyBalance[] => getOrSeed(STORAGE_KEYS.MONTHLY_BALANCES, seedMonthlyBalances),
  saveMonthlyBalances: (data: MonthlyBalance[]) => localStorage.setItem(STORAGE_KEYS.MONTHLY_BALANCES, JSON.stringify(data)),

  getCategories: (): Category[] => getOrSeed(STORAGE_KEYS.CATEGORIES, seedCategories),
  getSubCategories: (): SubCategory[] => getOrSeed(STORAGE_KEYS.SUBCATEGORIES, []),
  
  getTransactions: (): Transaction[] => getOrSeed(STORAGE_KEYS.TRANSACTIONS, seedTransactions),
  saveTransactions: (data: Transaction[]) => localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data)),
  addTransaction: (t: Transaction) => {
    const all = StorageService.getTransactions();
    all.push(t);
    StorageService.saveTransactions(all);
  },

  getBudgetItems: (): BudgetItem[] => getOrSeed(STORAGE_KEYS.BUDGET, []),
  saveBudgetItems: (data: BudgetItem[]) => localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(data)),

  getJars: (): Jar[] => getOrSeed(STORAGE_KEYS.JARS, []),
  saveJars: (data: Jar[]) => localStorage.setItem(STORAGE_KEYS.JARS, JSON.stringify(data)),

  getRules: (): TextCategoryRule[] => getOrSeed(STORAGE_KEYS.RULES, []),
  saveRules: (data: TextCategoryRule[]) => localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(data)),

  exportAllData: () => {
    const data: any = {};
    Object.entries(STORAGE_KEYS).forEach(([_, key]) => {
      data[key] = localStorage.getItem(key);
    });
    return JSON.stringify(data);
  },

  importAllData: (json: string) => {
    const data = JSON.parse(json);
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string') localStorage.setItem(key, value);
    });
  }
};
