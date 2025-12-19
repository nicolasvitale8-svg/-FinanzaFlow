
import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storageService';
import { calculatePeriodBalance, calculateJar, formatCurrency } from '../utils/calculations';
import { Account, Transaction, Jar, MonthlyBalance } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Lock, ChevronRight, List, Wallet, ArrowUpRight, Sparkles, PieChart, BrainCircuit, Zap, Loader2, AlertCircle, Database, Smartphone, Cloud } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import { isCloudConfigured } from '../services/supabaseClient';

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
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      calculateDashboardData();
    }
  }, [currentMonth, currentYear, transactions, monthlyBalances, accounts]);
  
  useEffect(() => {
    if (transactions.length > 0 && !aiInsight) {
       generateAIInsight();
    }
  }, [transactions]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [t, acc, j, mb] = await Promise.all([
        StorageService.getTransactions(),
        StorageService.getAccounts(),
        StorageService.getJars(),
        StorageService.getMonthlyBalances()
      ]);
      
      setTransactions(t || []);
      setAccounts(acc || []);
      setJars(j || []);
      setMonthlyBalances(mb || []);
    } catch (e: any) {
      console.error("Error al cargar datos:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIInsight = async () => {
    setIsLoadingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const recent = transactions.slice(-10).map(t => `${t.description}: ${t.amount}`).join(', ');
      if (!recent) return;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analiza estos últimos gastos y da un consejo financiero ultra-corto (máximo 15 palabras) para hoy: ${recent}`
      });
      setAiInsight(response.text || 'Mantén el control de tus gastos fijos este mes.');
    } catch (e) {
      setAiInsight('Analiza tus rubros para optimizar ahorros.');
    } finally {
      setIsLoadingAI(false);
    }
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
    { name: 'Flujo Neto', amount: totalFinal, color: '#3B82F6' },
  ];

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 animate-pulse">
        <div className="w-16 h-16 bg-brand/20 rounded-2xl flex items-center justify-center text-brand">
          <Loader2 className="animate-spin" size={32} />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-fin-muted">Sincronizando FinanzaFlow...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in pb-16">
      {/* Sync Status Header */}
      {!isCloudConfigured && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-[32px] flex items-center justify-between gap-6 transition-all hover:bg-amber-500/15 cursor-pointer" onClick={() => navigate('/settings')}>
           <div className="flex items-center gap-5">
              <div className="p-3 bg-amber-500/20 text-amber-500 rounded-2xl">
                <Smartphone size={20} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Atención: Modo Local Activo</p>
                <p className="text-xs font-bold text-amber-200/60 leading-tight">Tus datos solo están en esta computadora. Pulsa aquí para sincronizar con tu celular.</p>
              </div>
           </div>
           <div className="hidden sm:flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              Configurar Celular <ChevronRight size={14} />
           </div>
        </div>
      )}

      {/* AI Insight Bar */}
      <div className="bg-brand/10 border border-brand/20 p-4 rounded-3xl flex items-center justify-between gap-4 group cursor-pointer hover:bg-brand/15 transition-all" onClick={() => navigate('/ai-coach')}>
         <div className="flex items-center gap-4">
            <div className="p-2 bg-brand text-white rounded-xl shadow-lg shadow-brand/20">
               {isLoadingAI ? <Loader2 className="animate-spin" size={16} /> : <BrainCircuit size={16} />}
            </div>
            <p className="text-xs font-bold text-fin-text italic">
               {isLoadingAI ? 'Analizando tu comportamiento financiero...' : `AI Insight: "${aiInsight || 'Bienvenido a FinanzaFlow. Comienza registrando un movimiento.'}"`}
            </p>
         </div>
         <span className="text-[10px] font-black uppercase text-brand tracking-widest flex items-center gap-2">
            Ver más <ChevronRight size={12} />
         </span>
      </div>

      {/* Header con Control de Mes */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand text-[10px] font-black uppercase tracking-[0.4em]">
            <Sparkles size={12} className="animate-pulse" /> Estatus Financiero
          </div>
          <h1 className="text-5xl font-extrabold text-white tracking-tighter">Panel de Control</h1>
        </div>
        
        <div className="flex glass rounded-3xl border border-fin-border p-2 shadow-2xl">
          <button onClick={() => {
            const d = new Date(currentYear, currentMonth - 1);
            setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear());
          }} className="p-3 hover:bg-fin-bg rounded-2xl text-fin-muted hover:text-white transition-all">
            <ChevronRight className="rotate-180" size={18} />
          </button>
          <div className="px-8 flex items-center justify-center font-black text-[11px] uppercase tracking-[0.2em] text-white min-w-[180px]">
            {new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={() => {
            const d = new Date(currentYear, currentMonth + 1);
            setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear());
          }} className="p-3 hover:bg-fin-bg rounded-2xl text-fin-muted hover:text-white transition-all">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Tarjetas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'INGRESOS', value: totalIn, icon: <TrendingUp />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'GASTOS', value: totalOut, icon: <TrendingDown />, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { label: 'DISPONIBLE', value: totalFinal, icon: <DollarSign />, color: 'text-brand', bg: 'bg-brand/10' },
          { label: 'EN RESERVA', value: totalInJars, icon: <Lock />, color: 'text-amber-400', bg: 'bg-amber-500/10' }
        ].map((card, idx) => (
          <div key={idx} className="bg-fin-card p-8 rounded-[32px] border border-fin-border relative overflow-hidden card-glow transition-all group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className={`p-4 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-500`}>
                  {card.icon}
                </div>
                <span className="text-[9px] font-black text-fin-muted uppercase tracking-[0.3em]">{card.label}</span>
              </div>
              <h2 className="text-3xl font-black text-white tabular-nums tracking-tighter">
                {formatCurrency(card.value)}
              </h2>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 ? (
         <div className="bg-brand/5 border border-dashed border-brand/30 p-16 rounded-[48px] text-center space-y-6">
            <div className="w-20 h-20 bg-brand/10 text-brand rounded-3xl flex items-center justify-center mx-auto mb-4 border border-brand/20">
               <Wallet size={36} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">¡Bienvenido a FinanzaFlow!</h3>
              <p className="text-fin-muted max-w-sm mx-auto text-sm font-medium">Comienza configurando tu primer activo (Banco, Wallet o Efectivo) para ver tu flujo de caja.</p>
            </div>
            <button onClick={() => navigate('/accounts')} className="px-10 py-4 bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand/20 hover:scale-105 transition-all">Configurar Mi Primera Cuenta</button>
         </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Gráfico */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-fin-card p-10 rounded-[48px] border border-fin-border shadow-2xl relative overflow-hidden h-[450px]">
                <div className="flex items-center justify-between mb-12">
                    <h3 className="font-black text-xl flex items-center gap-4 text-white">
                      <PieChart size={20} className="text-brand" /> Distribución Mensual
                    </h3>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 10, fontWeight: 800}} dy={15} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.03)'}} 
                      contentStyle={{backgroundColor: '#0F172A', borderRadius: '24px', border: '1px solid #1E293B', color: '#F8FAFC'}} 
                      itemStyle={{color: '#F8FAFC', fontWeight: 'bold'}}
                    />
                    <Bar dataKey="amount" radius={[16, 16, 16, 16]} barSize={64}>
                      {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Actividad */}
            <div className="lg:col-span-1">
              <div className="bg-fin-card rounded-[48px] border border-fin-border h-full flex flex-col shadow-2xl overflow-hidden relative min-h-[500px]">
                <div className="px-10 py-8 border-b border-fin-border flex items-center justify-between sticky top-0 bg-fin-card/80 backdrop-blur-xl z-10">
                  <h3 className="font-black text-xl flex items-center gap-4 text-white">
                    <List size={20} className="text-brand" /> Actividad Reciente
                  </h3>
                </div>
                <div className="flex-1 overflow-auto divide-y divide-fin-border/20 scrollbar-hide">
                  {transactions.slice(0, 10).map(t => (
                    <div key={t.id} className="p-8 hover:bg-fin-bg/50 transition-all cursor-default group border-l-4 border-transparent hover:border-brand">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[14px] font-bold text-white leading-tight max-w-[150px] truncate">{t.description}</p>
                        <span className={`text-[15px] font-black tabular-nums ${t.type === 'IN' ? 'text-emerald-400' : 'text-white'}`}>
                          {t.type === 'IN' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-[9px] text-fin-muted font-black uppercase tracking-[0.2em]">{t.date}</p>
                        <div className="w-1 h-1 bg-fin-muted/30 rounded-full"></div>
                        <p className="text-[9px] text-brand font-black uppercase tracking-[0.2em]">Confirmado</p>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                     <div className="p-20 text-center opacity-20 italic text-xs font-black uppercase tracking-widest text-white">Esperando movimientos...</div>
                  )}
                </div>
                <button 
                  onClick={() => navigate('/transactions')}
                  className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-fin-muted hover:text-brand transition-all text-center border-t border-fin-border/30 bg-fin-bg/20"
                >
                  Ver Historial Completo
                </button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};
