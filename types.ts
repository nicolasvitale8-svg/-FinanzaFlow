export enum TransactionType {
  IN = 'IN',
  OUT = 'OUT',
}

export interface AccountType {
  id: string;
  name: string;
  description?: string;
  includeInCashflow: boolean;
  isActive: boolean;
}

export interface Account {
  id: string;
  name: string;
  accountTypeId: string;
  currency: string;
  isActive: boolean;
  // openingBalance is now handled via MonthlyBalance for specific periods, 
  // but we keep a legacy field or just rely on the initialization process.
}

export interface MonthlyBalance {
  id: string;
  accountId: string;
  year: number;
  month: number; // 0-11
  amount: number; // The balance at the START of this month
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType | 'MIX';
  isActive?: boolean;
}

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  isActive?: boolean;
}

export interface Transaction {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  categoryId: string;
  subCategoryId?: string;
  description: string; // Detail 1
  note?: string; // Detail 2
  amount: number;
  type: TransactionType;
  accountId: string;
}

export interface BudgetItem {
  id: string;
  month: number; // 0-11
  year: number;
  categoryId: string;
  subCategoryId?: string;
  label: string;
  type: TransactionType;
  plannedAmount: number;
  plannedDate?: number; // Day of month
}

export interface Jar {
  id: string;
  accountId: string;
  name: string; // e.g. "Viaje Juli"
  startDate: string;
  endDate: string;
  principal: number; // Initial capital
  annualRate: number; // Percentage, e.g. 45 for 45%
}

export interface JarCalculation {
  jar: Jar;
  daysTotal: number;
  daysElapsed: number;
  daysRemaining: number;
  currentValue: number;
  finalValue: number;
  interestAccrued: number;
}

// --- IMPORT & RULES ---

export interface TextCategoryRule {
  id: string;
  pattern: string; // e.g. "carcor"
  matchType: 'contains' | 'equals' | 'startsWith';
  categoryId: string;
  subCategoryId?: string;
  direction?: TransactionType;
  isActive: boolean;
}

export interface ImportLine {
  id: string;
  rawText: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: TransactionType;
  
  // Classification
  categoryId?: string;
  subCategoryId?: string;
  
  // UI State
  isSelected: boolean;
  isDuplicate: boolean;
}

export interface ImportBatch {
  id: string;
  date: string;
  accountId: string;
  lines: ImportLine[];
  status: 'draft' | 'imported';
}