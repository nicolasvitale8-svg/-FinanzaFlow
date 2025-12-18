import { Jar, JarCalculation, Transaction, TransactionType, Account, MonthlyBalance } from '../types';

export const calculateJar = (jar: Jar): JarCalculation => {
  const start = new Date(jar.startDate);
  const end = new Date(jar.endDate);
  const today = new Date();
  
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);
  today.setHours(0,0,0,0);

  const oneDay = 24 * 60 * 60 * 1000;
  
  const daysTotal = Math.round(Math.abs((end.getTime() - start.getTime()) / oneDay));
  let daysElapsed = Math.round((today.getTime() - start.getTime()) / oneDay);
  
  if (daysElapsed < 0) daysElapsed = 0;
  if (daysElapsed > daysTotal) daysElapsed = daysTotal; 

  const daysRemaining = daysTotal - daysElapsed;

  const dailyRate = (jar.annualRate / 100) / 365;

  const currentValue = jar.principal * Math.pow(1 + dailyRate, daysElapsed);
  const finalValue = jar.principal * Math.pow(1 + dailyRate, daysTotal);
  const interestAccrued = currentValue - jar.principal;

  return {
    jar,
    daysTotal,
    daysElapsed,
    daysRemaining,
    currentValue,
    finalValue,
    interestAccrued
  };
};

/**
 * Calculates account balances for a specific period (Month/Year).
 * If no monthly balance exists for the start of the period, it returns 0 as start.
 */
export const calculatePeriodBalance = (
  account: Account,
  transactions: Transaction[],
  monthlyBalances: MonthlyBalance[],
  month: number,
  year: number
) => {
  // 1. Find Opening Balance for this month
  const openingRecord = monthlyBalances.find(mb => mb.accountId === account.id && mb.year === year && mb.month === month);
  const openingBalance = openingRecord ? openingRecord.amount : 0;

  // 2. Filter Transactions for this specific month/year and account
  const periodTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return t.accountId === account.id && d.getMonth() === month && d.getFullYear() === year;
  });

  const totalIn = periodTransactions.filter(t => t.type === TransactionType.IN).reduce((sum, t) => sum + t.amount, 0);
  const totalOut = periodTransactions.filter(t => t.type === TransactionType.OUT).reduce((sum, t) => sum + t.amount, 0);

  return {
    account,
    openingBalance, // Initial for this month
    totalIn,
    totalOut,
    finalBalance: openingBalance + totalIn - totalOut,
    hasOpeningRecord: !!openingRecord
  };
};

/**
 * Proposes an opening balance for a new month based on the PREVIOUS month's final balance.
 */
export const getProposedOpeningBalance = (
  accountId: string,
  transactions: Transaction[],
  monthlyBalances: MonthlyBalance[],
  targetMonth: number,
  targetYear: number
): number => {
  // Determine previous period
  let prevMonth = targetMonth - 1;
  let prevYear = targetYear;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear = targetYear - 1;
  }

  // Calculate the final balance of the previous period
  // We need to simulate the 'calculatePeriodBalance' logic for that previous month
  const prevOpeningRecord = monthlyBalances.find(mb => mb.accountId === accountId && mb.year === prevYear && mb.month === prevMonth);
  const prevOpening = prevOpeningRecord ? prevOpeningRecord.amount : 0;

  const prevTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return t.accountId === accountId && d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });

  const totalIn = prevTransactions.filter(t => t.type === TransactionType.IN).reduce((sum, t) => sum + t.amount, 0);
  const totalOut = prevTransactions.filter(t => t.type === TransactionType.OUT).reduce((sum, t) => sum + t.amount, 0);

  return prevOpening + totalIn - totalOut;
};

// Legacy global calculation (still useful for 'current state' if we assume strict continuity)
export const calculateAccountBalances = (accounts: Account[], transactions: Transaction[]) => {
  return accounts.map(acc => {
    const accTrans = transactions.filter(t => t.accountId === acc.id);
    const totalIn = accTrans.filter(t => t.type === TransactionType.IN).reduce((sum, t) => sum + t.amount, 0);
    const totalOut = accTrans.filter(t => t.type === TransactionType.OUT).reduce((sum, t) => sum + t.amount, 0);
    // Note: This legacy calculation assumes 0 start, which is superseded by Monthly Balances logic in the dashboard
    return {
      ...acc,
      currentBalance: totalIn - totalOut // Simplified
    };
  });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', { 
    style: 'currency', 
    currency: 'ARS', 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(amount);
};

export const formatPercentage = (val: number) => {
  return `${(val * 100).toFixed(1)}%`;
};
