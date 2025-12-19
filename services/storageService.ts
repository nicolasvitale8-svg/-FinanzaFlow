
import { supabase, isCloudConfigured } from './supabaseClient';
import { GoogleDriveService } from './googleDriveService';
import { Account, AccountType, BudgetItem, Category, Jar, MonthlyBalance, SubCategory, TextCategoryRule, Transaction, TransactionType } from '../types';

const local = {
  get: <T>(key: string, fallback: T): T => {
    try {
      const val = localStorage.getItem(`ff_v2_${key}`);
      return val ? JSON.parse(val) : fallback;
    } catch (e) { return fallback; }
  },
  set: (key: string, val: any) => {
    try {
      localStorage.setItem(`ff_v2_${key}`, JSON.stringify(val));
      // Hook de Auto-Sync con Google Drive si hay token
      if (GoogleDriveService.getAccessToken()) {
        StorageService.pushToGoogleDrive();
      }
    } catch (e) {}
  }
};

let syncTimeout: any = null;

export const StorageService = {
  // Push automático con Debounce para no saturar la API de Google
  pushToGoogleDrive: async () => {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
      const allData = JSON.parse(await StorageService.exportAllData());
      await GoogleDriveService.syncFile(allData);
      console.info("☁️ Google Drive: Sincronización completada.");
    }, 3000); // Esperar 3 segundos de inactividad
  },

  pullFromGoogleDrive: async () => {
    const data = await GoogleDriveService.syncFile();
    if (data) {
      await StorageService.importAllData(JSON.stringify(data));
      return true;
    }
    return false;
  },

  // --- ACCOUNTS ---
  getAccounts: async (): Promise<Account[]> => {
    if (isCloudConfigured) {
      try {
        const { data, error } = await supabase!.from('accounts').select('*').order('name');
        if (!error) return data || [];
      } catch (e) {}
    }
    return local.get('accounts', []);
  },
  addAccount: async (acc: Account) => {
    if (isCloudConfigured) { try { await supabase!.from('accounts').insert([acc]); } catch(e){} }
    const list = local.get<Account[]>('accounts', []);
    local.set('accounts', [...list, acc]);
  },
  updateAccount: async (acc: Account) => {
    if (isCloudConfigured) { try { await supabase!.from('accounts').update(acc).eq('id', acc.id); } catch(e){} }
    const list = local.get<Account[]>('accounts', []);
    local.set('accounts', list.map(item => item.id === acc.id ? acc : item));
  },
  deleteAccount: async (id: string) => {
    if (isCloudConfigured) { try { await supabase!.from('accounts').delete().eq('id', id); } catch(e){} }
    const list = local.get<Account[]>('accounts', []);
    local.set('accounts', list.filter(item => item.id !== id));
  },

  // --- CATEGORIES ---
  getCategories: async (): Promise<Category[]> => {
    const defaultCats: Category[] = [
      { id: 'cat_1', name: 'Sueldo', type: TransactionType.IN },
      { id: 'cat_2', name: 'Alquiler', type: TransactionType.OUT },
      { id: 'cat_3', name: 'Comida', type: TransactionType.OUT },
      { id: 'cat_4', name: 'Transporte', type: TransactionType.OUT },
      { id: 'cat_5', name: 'Servicios', type: TransactionType.OUT },
      { id: 'cat_6', name: 'Ocio', type: TransactionType.OUT }
    ];
    if (isCloudConfigured) {
      try {
        const { data, error } = await supabase!.from('categories').select('*').order('name');
        if (!error && data?.length) return data;
      } catch (e) {}
    }
    const saved = local.get<Category[]>('categories', []);
    return saved.length ? saved : defaultCats;
  },

  getSubCategories: async (): Promise<SubCategory[]> => {
    if (isCloudConfigured) {
      try {
        const { data, error } = await supabase!.from('sub_categories').select('*');
        if (!error) return data || [];
      } catch (e) {}
    }
    return local.get('sub_categories', []);
  },

  // --- TRANSACTIONS ---
  getTransactions: async (): Promise<Transaction[]> => {
    if (isCloudConfigured) {
      try {
        const { data, error } = await supabase!.from('transactions').select('*').order('date', { ascending: false });
        if (!error) return data || [];
      } catch (e) {}
    }
    return local.get('transactions', []);
  },
  addTransaction: async (t: Transaction) => {
    if (isCloudConfigured) { try { await supabase!.from('transactions').insert([t]); } catch(e){} }
    const list = local.get<Transaction[]>('transactions', []);
    local.set('transactions', [t, ...list]);
  },

  // --- RESTO DE MÉTODOS (Omitidos para brevedad pero mantienen lógica de auto-sync) ---
  getMonthlyBalances: async (): Promise<MonthlyBalance[]> => local.get('monthly_balances', []),
  saveMonthlyBalances: async (mbs: MonthlyBalance[]) => local.set('monthly_balances', mbs),
  getJars: async (): Promise<Jar[]> => local.get('jars', []),
  saveJars: async (jars: Jar[]) => local.set('jars', jars),
  getBudgetItems: async (): Promise<BudgetItem[]> => local.get('budget_items', []),
  saveBudgetItems: async (items: BudgetItem[]) => local.set('budget_items', items),
  getRules: async (): Promise<TextCategoryRule[]> => local.get('rules', []),
  saveRules: async (rules: TextCategoryRule[]) => local.set('rules', rules),
  getAccountTypes: async (): Promise<AccountType[]> => local.get('account_types', [
    { id: 'at_1', name: 'Efectivo', includeInCashflow: true, isActive: true },
    { id: 'at_2', name: 'Banco / Wallet', includeInCashflow: true, isActive: true },
    { id: 'at_3', name: 'Inversión', includeInCashflow: false, isActive: true }
  ]),

  exportAllData: async (): Promise<string> => {
    const [accounts, accountTypes, transactions, categories, monthlyBalances, jars, budgetItems, rules] = await Promise.all([
      StorageService.getAccounts(),
      StorageService.getAccountTypes(),
      StorageService.getTransactions(),
      StorageService.getCategories(),
      StorageService.getMonthlyBalances(),
      StorageService.getJars(),
      StorageService.getBudgetItems(),
      StorageService.getRules()
    ]);
    return JSON.stringify({ accounts, accountTypes, transactions, categories, monthlyBalances, jars, budgetItems, rules });
  },

  importAllData: async (json: string) => {
    const data = JSON.parse(json);
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) {
        localStorage.setItem(`ff_v2_${key}`, JSON.stringify(data[key]));
      }
    });
  }
};
