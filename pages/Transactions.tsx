
import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { Account, Category, Transaction, TransactionType } from '../types';
import { Plus, X, Tag, Calendar, Wallet, Filter, ListFilter, RotateCcw, TrendingUp, TrendingDown, DollarSign, Search } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter States
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    type: TransactionType.OUT, amount: 0, description: '',
  });

  useEffect(() => { loadData(); }, []);

  // Fixed: Updated to correctly await asynchronous calls to the storage service
  const loadData = async () => {
    const [t, a, c] = await Promise.all([
      StorageService.getTransactions(),
      StorageService.getAccounts(),
      StorageService.getCategories()
    ]);
    setTransactions(t);
    setAccounts(a);
    setCategories(c);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.categoryId || !formData.accountId) return;
    const newTransaction: Transaction = {
      id: crypto.randomUUID(), date: formData.date!, type: formData.type!, amount: Number(formData.amount),
      categoryId: formData.categoryId!, accountId: formData.accountId!,
      description: formData.description || 'Sin descripción',
    };
    // Fixed: Await storage operation before refreshing view
    await StorageService.addTransaction(newTransaction);
    loadData();
    setIsModalOpen(false);
    setFormData({ date: new Date().toISOString().split('T')[0], type: TransactionType.OUT, amount: 0, description: '' });
  };

  const clearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterCategory('');
    setFilterAccount('');
    setFilterType('');
    setSearchTerm('');
  };

  // Memoized Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterStartDate && t.date < filterStartDate) return false;
      if (filterEndDate && t.date > filterEndDate) return false;
      if (filterCategory && t.categoryId !== filterCategory) return false;
      if (filterAccount && t.accountId !== filterAccount) return false;
      if (filterType && t.type !== filterType) return false;
      if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterStartDate, filterEndDate, filterCategory, filterAccount, filterType, searchTerm]);

  // Totals for filtered data
  const filteredTotals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.type === TransactionType.IN) acc.in += t.amount;
      else acc.out += t.amount;
      return acc;
    }, { in: 0, out: 0 });
  }, [filteredTransactions]);

  const activeFilterCount = [filterStartDate, filterEndDate, filterCategory, filterAccount, filterType, searchTerm].filter(Boolean).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Movimientos</h1>
          <p className="text-fin-muted mt-3 text-sm font-medium">Analiza y filtra tu actividad financiera</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 md:flex-none px-6 py-3.5 rounded-2xl font-bold text-sm transition-all border flex items-center justify-center gap-3 ${
              activeFilterCount > 0 || showFilters 
              ? 'bg-brand/10 border-brand text-brand shadow-lg shadow-brand/5' 
              : 'bg-fin-card border-fin-border text-fin-muted hover:text-white'
            }`}
          >
            <Filter size={18} /> 
            Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none bg-brand text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-brand-hover transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-3"
          >
            <Plus size={18} strokeWidth={3} /> Nueva
          </button>
        </div>
      </div>

      {/* Dynamic Filter Panel */}
      {showFilters && (
        <div className="bg-fin-card p-8 rounded-2xl border border-fin-border animate-fade-in shadow-xl space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            
            {/* Search Input */}
            <div className="space-y-2 lg:col-span-2 xl:col-span-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1 flex items-center gap-2">
                <Search size={12}/> Buscar
              </label>
              <input 
                type="text" 
                placeholder="Descripción..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-xs text-white focus:border-brand outline-none"
              />
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1 flex items-center gap-2">
                <Calendar size={12}/> Desde
              </label>
              <input 
                type="date" 
                value={filterStartDate} 
                onChange={e => setFilterStartDate(e.target.value)} 
                className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-xs text-white focus:border-brand outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1 flex items-center gap-2">
                <Calendar size={12}/> Hasta
              </label>
              <input 
                type="date" 
                value={filterEndDate} 
                onChange={e => setFilterEndDate(e.target.value)} 
                className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-xs text-white focus:border-brand outline-none" 
              />
            </div>

            {/* Selectors */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1 flex items-center gap-2">
                <Tag size={12}/> Rubro
              </label>
              <select 
                value={filterCategory} 
                onChange={e => setFilterCategory(e.target.value)} 
                className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-xs text-white focus:border-brand outline-none appearance-none cursor-pointer"
              >
                <option value="">Todos los rubros</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1 flex items-center gap-2">
                <Wallet size={12}/> Cuenta
              </label>
              <select 
                value={filterAccount} 
                onChange={e => setFilterAccount(e.target.value)} 
                className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-xs text-white focus:border-brand outline-none appearance-none cursor-pointer"
              >
                <option value="">Todas las cuentas</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1 flex items-center gap-2">
                <ListFilter size={12}/> Flujo
              </label>
              <div className="flex items-center gap-2">
                <select 
                  value={filterType} 
                  onChange={e => setFilterType(e.target.value as any)} 
                  className="flex-1 bg-fin-bg border border-fin-border rounded-xl p-3 text-xs text-white focus:border-brand outline-none appearance-none cursor-pointer"
                >
                  <option value="">Ambos</option>
                  <option value={TransactionType.IN}>Ingresos</option>
                  <option value={TransactionType.OUT}>Gastos</option>
                </select>
                {activeFilterCount > 0 && (
                  <button 
                    onClick={clearFilters}
                    className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm flex-shrink-0"
                    title="Limpiar filtros"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-fin-card p-6 rounded-2xl border border-fin-border flex items-center gap-5 hover:border-emerald-500/30 transition-all group">
           <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl group-hover:scale-110 transition-transform"><TrendingUp size={24}/></div>
           <div>
             <p className="text-[10px] font-black text-fin-muted uppercase tracking-widest mb-1">Entradas Filtradas</p>
             <p className="text-2xl font-black text-white tabular-nums tracking-tight">{formatCurrency(filteredTotals.in)}</p>
           </div>
        </div>
        <div className="bg-fin-card p-6 rounded-2xl border border-fin-border flex items-center gap-5 hover:border-red-500/30 transition-all group">
           <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl group-hover:scale-110 transition-transform"><TrendingDown size={24}/></div>
           <div>
             <p className="text-[10px] font-black text-fin-muted uppercase tracking-widest mb-1">Salidas Filtradas</p>
             <p className="text-2xl font-black text-white tabular-nums tracking-tight">{formatCurrency(filteredTotals.out)}</p>
           </div>
        </div>
        <div className="bg-fin-card p-6 rounded-2xl border border-fin-border flex items-center gap-5 hover:border-brand/30 transition-all group">
           <div className="p-4 bg-brand/10 text-brand rounded-2xl group-hover:scale-110 transition-transform"><DollarSign size={24}/></div>
           <div>
             <p className="text-[10px] font-black text-fin-muted uppercase tracking-widest mb-1">Resultado Neto</p>
             <p className="text-2xl font-black text-white tabular-nums tracking-tight">{formatCurrency(filteredTotals.in - filteredTotals.out)}</p>
           </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-fin-card rounded-2xl border border-fin-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-fin-bg/40 border-b border-fin-border">
              <tr className="text-[10px] text-fin-muted font-black uppercase tracking-widest">
                <th className="px-8 py-5">Fecha</th>
                <th className="px-8 py-5">Descripción</th>
                <th className="px-8 py-5">Clasificación</th>
                <th className="px-8 py-5">Cuenta</th>
                <th className="px-8 py-5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fin-border/30">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-6 text-fin-muted">
                      <div className="p-6 bg-fin-bg rounded-full border border-fin-border">
                        <ListFilter size={48} strokeWidth={1} className="opacity-30" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white">Sin resultados</p>
                        <p className="text-xs font-medium italic opacity-60">No encontramos movimientos que coincidan con los filtros aplicados</p>
                      </div>
                      {activeFilterCount > 0 && (
                        <button 
                          onClick={clearFilters} 
                          className="px-6 py-2.5 bg-brand/10 text-brand rounded-xl text-[11px] font-black uppercase tracking-widest border border-brand/20 hover:bg-brand hover:text-white transition-all"
                        >
                          Limpiar Todos los Filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  const cat = categories.find(c => c.id === t.categoryId);
                  const acc = accounts.find(a => a.id === t.accountId);
                  return (
                    <tr key={t.id} className="hover:bg-fin-bg/30 transition-colors group">
                      <td className="px-8 py-5 font-bold text-white/60 tabular-nums text-xs whitespace-nowrap">{t.date}</td>
                      <td className="px-8 py-5">
                         <p className="font-bold text-white text-[14px] leading-tight truncate max-w-[220px]">{t.description}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-fin-bg border border-fin-border rounded-lg text-[10px] font-black text-brand uppercase tracking-tighter">
                          <Tag size={10} /> {cat?.name}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                         <span className="text-[10px] font-bold text-fin-muted uppercase tracking-widest bg-fin-bg/20 px-2.5 py-1.5 rounded-lg border border-fin-border/50">
                           {acc?.name}
                         </span>
                      </td>
                      <td className={`px-8 py-5 text-right font-black tabular-nums text-[16px] ${t.type === 'IN' ? 'text-emerald-500' : 'text-white'}`}>
                         {t.type === 'IN' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-fin-bg/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-fin-card rounded-3xl w-full max-w-md border border-fin-border shadow-2xl p-10 animate-fade-in relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 text-fin-muted hover:text-white transition-colors">
              <X size={24}/>
            </button>
            <h2 className="text-2xl font-black text-white mb-10 tracking-tight">Nueva Operación</h2>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted flex items-center gap-2">
                    <Calendar size={12}/> Fecha
                  </label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-white focus:border-brand outline-none" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted flex items-center gap-2">
                    <Wallet size={12}/> Cuenta
                  </label>
                  <select value={formData.accountId || ''} onChange={e => setFormData({...formData, accountId: e.target.value})} className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-white focus:border-brand outline-none appearance-none cursor-pointer" required>
                    <option value="">Seleccionar...</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Categoría</label>
                <select value={formData.categoryId || ''} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-white focus:border-brand outline-none appearance-none cursor-pointer" required>
                  <option value="">Elegir rubro...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Monto (ARS)</label>
                <input type="number" step="0.01" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full bg-fin-bg border border-fin-border rounded-xl p-4 text-3xl font-black text-white tabular-nums focus:border-brand outline-none" placeholder="0.00" required />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Concepto</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-white focus:border-brand outline-none" placeholder="¿En qué gastaste?" required />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 flex bg-fin-bg border border-fin-border rounded-xl p-1">
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, type: TransactionType.OUT})}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${formData.type === TransactionType.OUT ? 'bg-red-500 text-white' : 'text-fin-muted'}`}
                  >
                    Gasto
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, type: TransactionType.IN})}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${formData.type === TransactionType.IN ? 'bg-emerald-500 text-white' : 'text-fin-muted'}`}
                  >
                    Ingreso
                  </button>
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-brand/20 hover:bg-brand-hover transition-all">
                Registrar Movimiento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
