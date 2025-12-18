
import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storageService';
import { calculatePeriodBalance, calculateJar, formatCurrency } from '../utils/calculations';
import { Account, Transaction, Jar, MonthlyBalance } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Lock, ChevronRight, LayoutGrid, List, Wallet, ArrowUpRight, UploadCloud, PlusCircle, Settings, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface PeriodAccountState {
  account: Account;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  finalBalance: number;
  hasOpeningRecord: boolean;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [jars, setJars] = useState<Jar[]>([]);
  const [monthlyBalances, setMonthlyBalances] = useState<MonthlyBalance[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [periodStates, setPeriodStates] = useState<PeriodAccountState[]>([]);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { calculateDashboardData(); }, [currentMonth, currentYear, transactions, monthlyBalances, accounts]);

  const loadData = () => {
    setTransactions(StorageService.getTransactions());
    setAccounts(StorageService.getAccounts());
    setJars(StorageService.getJars());
    setMonthlyBalances(StorageService.getMonthlyBalances());
  };

  const calculateDashboardData = () => {
    const states = accounts.filter(a => a.isActive).map(acc => 
      calculatePeriodBalance(acc, transactions, monthlyBalances, currentMonth, currentYear)
    );
    setPeriodStates(states);
  };

  const totalIn = periodStates.reduce((s, st) => s + st.totalIn, 0);
  const totalOut = periodStates.reduce((s, st) => s + st.totalOut, 0);
  const totalFinal = periodStates.reduce((s, st) => s + st.finalBalance, 0);
  const totalInJars = jars.map(calculateJar).reduce((acc, j) => acc + j.currentValue, 0);

  const chartData = [
    { name: 'Entradas', amount: totalIn, color: '#10B981' },
    { name: 'Salidas', amount: totalOut, color: '#EF4444' },
    { name: 'Neto', amount: totalFinal, color: '#3B82F6' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 20) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <div className="space-y-12 animate-fade-in pb-16">
      {/* Welcome & Period Picker */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand text-[10px] font-black uppercase tracking-[0.3em]">
            <Sparkles size={12} /> Sistema Activo
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">{getGreeting()}, Usuario.</h1>
          <p className="text-fin-muted font-medium">Hoy es {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        
        <div className="flex bg-fin-card rounded-2xl border border-fin-border p-1 shadow-xl">
          <button onClick={() => {
            const d = new Date(currentYear, currentMonth - 1);
            setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear());
          }} className="p-3 hover:bg-fin-bg rounded-xl text-fin-muted hover:text-white transition-all">
            <ChevronRight className="rotate-180" size={18} />
          </button>
          <div className="px-6 flex items-center justify-center font-black text-[11px] uppercase tracking-widest text-white min-w-[140px]">
            {new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={() => {
            const d = new Date(currentYear, currentMonth + 1);
            setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear());
          }} className="p-3 hover:bg-fin-bg rounded-xl text-fin-muted hover:text-white transition-all">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Quick Action Center */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Importar con OCR', icon: <UploadCloud />, path: '/import', color: 'bg-brand/10 text-brand border-brand/20' },
          { label: 'Nueva Operación', icon: <PlusCircle />, path: '/transactions', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
          { label: 'Configurar Respaldo', icon: <Settings />, path: '/settings', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' }
        ].map((action, i) => (
          <button 
            key={i} 
            onClick={() => navigate(action.path)}
            className={`flex items-center justify-between p-6 rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-95 group ${action.color}`}
          >
            <div className="flex items-center gap-4">
              <span className="p-3 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform">{action.icon}</span>
              <span className="text-[11px] font-black uppercase tracking-widest">{action.label}</span>
            </div>
            <ChevronRight size={16} className="opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Ingresos', value: totalIn, icon: <TrendingUp />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Salidas', value: totalOut, icon: <TrendingDown />, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Saldo Neto', value: totalFinal, icon: <DollarSign />, color: 'text-brand', bg: 'bg-brand/10' },
          { label: 'Invested Capital', value: totalInJars, icon: <Lock />, color: 'text-amber-500', bg: 'bg-amber-500/10' }
        ].map((card, idx) => (
          <div key={idx} className="bg-fin-card p-8 rounded-[32px] border border-fin-border shadow-sm group hover:border-brand/40 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className={`p-4 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <span className="text-[9px] font-black text-fin-muted uppercase tracking-[0.2em]">{card.label}</span>
            </div>
            <h2 className="text-3xl font-black text-white tabular-nums tracking-tighter">
              {formatCurrency(card.value)}
            </h2>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Chart Section */}
          <div className="bg-fin-card p-10 rounded-[32px] border border-fin-border">
            <div className="flex items-center justify-between mb-12">
              <h3 className="font-black text-xl flex items-center gap-4">
                <LayoutGrid size={20} className="text-brand" /> Distribución Mensual
              </h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 800}} dy={15} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.02)'}} 
                    contentStyle={{backgroundColor: '#141C2F', borderRadius: '24px', border: '1px solid #1F2937', padding: '16px'}} 
                  />
                  <Bar dataKey="amount" radius={[8, 8, 8, 8]} barSize={56}>
                    {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Accounts Summary */}
          <div className="bg-fin-card rounded-[32px] border border-fin-border overflow-hidden shadow-2xl">
            <div className="px-10 py-8 border-b border-fin-border flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <Wallet size={20} className="text-brand" />
                  <h3 className="font-black text-xl">Saldos Disponibles</h3>
               </div>
               <button onClick={() => navigate('/accounts')} className="text-[10px] font-black text-brand uppercase tracking-widest hover:underline">Gestionar</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="text-[10px] text-fin-muted font-black uppercase tracking-widest bg-fin-bg/40">
                    <th className="px-10 py-5">Cuenta</th>
                    <th className="px-10 py-5 text-right">Balance de Periodo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fin-border/30">
                  {periodStates.map(st => (
                    <tr key={st.account.id} className="hover:bg-fin-bg/30 transition-colors group">
                      <td className="px-10 py-6 font-bold text-white uppercase tracking-tight text-xs flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${st.finalBalance >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        {st.account.name}
                      </td>
                      <td className={`px-10 py-6 text-right font-black tabular-nums text-lg ${st.finalBalance >= 0 ? 'text-white' : 'text-red-500'}`}>
                        {formatCurrency(st.finalBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1">
          <div className="bg-fin-card rounded-[32px] border border-fin-border h-full flex flex-col shadow-2xl overflow-hidden">
            <div className="px-10 py-8 border-b border-fin-border flex items-center justify-between bg-fin-bg/20">
              <h3 className="font-black text-xl flex items-center gap-4">
                <List size={20} className="text-brand" /> Recientes
              </h3>
              <button onClick={() => navigate('/transactions')} className="p-2.5 bg-fin-bg rounded-xl border border-fin-border hover:text-brand transition-all">
                <ArrowUpRight size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto divide-y divide-fin-border/30 scrollbar-hide">
              {transactions
                .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map(t => (
                <div key={t.id} className="p-8 hover:bg-fin-bg/30 transition-all cursor-default group">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[14px] font-bold text-white group-hover:text-brand transition-colors leading-tight">{t.description}</p>
                    <span className={`text-[14px] font-black tabular-nums ${t.type === 'IN' ? 'text-emerald-500' : 'text-white'}`}>
                      {t.type === 'IN' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] text-fin-muted font-black uppercase tracking-[0.2em]">{t.date}</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-fin-border group-hover:bg-brand transition-colors"></div>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-fin-muted space-y-4">
                  <LayoutGrid size={40} className="opacity-10" />
                  <p className="text-xs font-bold uppercase tracking-widest italic opacity-40">Sin movimientos registrados</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
