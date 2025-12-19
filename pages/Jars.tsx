
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Jar, Account } from '../types';
import { calculateJar, formatCurrency } from '../utils/calculations';
import { Plus, Trash2, PiggyBank, Clock, TrendingUp, ChevronRight } from 'lucide-react';

export const Jars: React.FC = () => {
  const [jars, setJars] = useState<Jar[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newJar, setNewJar] = useState<Partial<Jar>>({ annualRate: 40 });

  useEffect(() => {
    // Fixed: Wrapped data loading in async function to correctly await promises
    const loadData = async () => {
      const [j, a] = await Promise.all([
        StorageService.getJars(),
        StorageService.getAccounts()
      ]);
      setJars(j);
      setAccounts(a);
    };
    loadData();
  }, []);

  // Fixed: Marked handler as async and added await for storage operation
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newJar.name || !newJar.principal || !newJar.startDate || !newJar.endDate || !newJar.accountId) return;
    const jar: Jar = { id: crypto.randomUUID(), accountId: newJar.accountId, name: newJar.name, principal: Number(newJar.principal), annualRate: Number(newJar.annualRate), startDate: newJar.startDate, endDate: newJar.endDate };
    const updated = [...jars, jar];
    setJars(updated); 
    await StorageService.saveJars(updated);
    setIsAdding(false); setNewJar({ annualRate: 40 });
  };

  const calculations = jars.map(calculateJar);
  const totalInvested = calculations.reduce((s, c) => s + c.jar.principal, 0);
  const totalValueNow = calculations.reduce((s, c) => s + c.currentValue, 0);

  return (
    <div className="space-y-10 animate-fade-in">
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fin-text uppercase">Frascos</h1>
          <p className="text-fin-muted text-sm mt-1">Fondos reservados e inversiones activas</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-brand text-fin-bg px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand-hover transition-all">
          Nuevo Frasco
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-fin-card p-10 rounded-2xl border border-fin-border">
           <span className="text-[10px] font-black uppercase tracking-widest text-fin-muted block mb-4">Capital en Custodia</span>
           <p className="text-4xl font-black text-fin-text tracking-tighter">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="bg-fin-card p-10 rounded-2xl border border-brand/20">
           <span className="text-[10px] font-black uppercase tracking-widest text-brand block mb-4">Valor Liquidable Hoy</span>
           <p className="text-4xl font-black text-brand tracking-tighter">{formatCurrency(totalValueNow)}</p>
        </div>
      </div>

      {isAdding && (
         <div className="bg-fin-card p-10 rounded-2xl border border-fin-border animate-fade-in shadow-2xl">
           <h3 className="text-lg font-black mb-10 text-fin-text uppercase tracking-tight">Configurar Reserva</h3>
           <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Nombre</label>
                 <input className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-fin-text" value={newJar.name || ''} onChange={e => setNewJar({...newJar, name: e.target.value})} placeholder="Ej. Viaje" required />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Cuenta Origen</label>
                 <select className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-fin-text" value={newJar.accountId || ''} onChange={e => setNewJar({...newJar, accountId: e.target.value})} required>
                    <option value="">Seleccionar</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                 </select>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Capital Inicial</label>
                 <input type="number" step="0.01" className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-fin-text font-bold" value={newJar.principal || ''} onChange={e => setNewJar({...newJar, principal: Number(e.target.value)})} required />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Inicio</label>
                 <input type="date" className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-fin-text" value={newJar.startDate || ''} onChange={e => setNewJar({...newJar, startDate: e.target.value})} required />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Fin</label>
                 <input type="date" className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-fin-text" value={newJar.endDate || ''} onChange={e => setNewJar({...newJar, endDate: e.target.value})} required />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">TNA (%)</label>
                 <input type="number" step="0.01" className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-fin-text" value={newJar.annualRate || ''} onChange={e => setNewJar({...newJar, annualRate: Number(e.target.value)})} required />
              </div>
              <div className="md:col-span-2 lg:col-span-3 pt-4">
                <button type="submit" className="bg-brand text-fin-bg font-black py-4 px-10 rounded-xl w-full text-xs uppercase tracking-widest">ACTIVAR FRASCO</button>
              </div>
           </form>
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {calculations.map(({ jar, currentValue, finalValue, daysRemaining, daysTotal, daysElapsed, interestAccrued }) => {
            const progress = (daysElapsed / daysTotal) * 100;
            return (
              <div key={jar.id} className="bg-fin-card rounded-2xl border border-fin-border overflow-hidden relative group hover:border-brand/30 transition-all">
                 <div className="h-1 bg-fin-bg w-full absolute top-0">
                    <div className="h-full bg-brand transition-all duration-1000" style={{width: `${Math.min(progress, 100)}%`}}></div>
                 </div>
                 <div className="p-8">
                    <div className="flex justify-between items-start mb-10">
                       <div>
                          <h3 className="text-lg font-black text-fin-text uppercase tracking-tight">{jar.name}</h3>
                          <p className="text-[10px] text-fin-muted font-bold tracking-widest uppercase mt-1">
                             {accounts.find(a => a.id === jar.accountId)?.name}
                          </p>
                       </div>
                       <div className="text-right">
                          <p className="text-2xl font-black text-brand tabular-nums tracking-tighter">{formatCurrency(currentValue)}</p>
                          <p className="text-[9px] text-brand/60 font-black uppercase tracking-widest">Valor actual</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-10">
                       <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-fin-muted mb-1">Invertido</p>
                          <p className="text-sm font-bold text-fin-text tabular-nums">{formatCurrency(jar.principal)}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-fin-muted mb-1">Rendimiento</p>
                          <p className="text-sm font-bold text-emerald-500 tabular-nums">+{formatCurrency(interestAccrued)}</p>
                       </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-black text-fin-muted uppercase tracking-widest bg-fin-bg/50 p-3 rounded-lg">
                       <span>{new Date(jar.startDate).toLocaleDateString()}</span>
                       <span className="text-brand">{daysRemaining} DÍAS RESTANTES</span>
                       <span>{new Date(jar.endDate).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Fixed: Use async handler and await storage operation */}
                    <button onClick={async () => { if(confirm('Eliminar frasco?')) { const u = jars.filter(j => j.id !== jar.id); setJars(u); await StorageService.saveJars(u); }}} className="absolute bottom-8 right-8 text-fin-muted hover:text-red-500 opacity-20 group-hover:opacity-100 transition-opacity">
                       <Trash2 size={16} />
                    </button>
                 </div>
              </div>
            );
         })}
      </div>
    </div>
  );
};
