
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { BudgetItem, Category, SubCategory, Transaction, TransactionType } from '../types';
import { formatCurrency, formatPercentage } from '../utils/calculations';
import { Plus, Trash2, Pencil, ChevronRight, PieChart } from 'lucide-react';

export const Budget: React.FC = () => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newItem, setNewItem] = useState<Partial<BudgetItem>>({ type: TransactionType.OUT, plannedAmount: 0 });

  useEffect(() => { loadData(); }, []);

  // Fixed loadData to correctly await async StorageService calls
  const loadData = async () => {
    const [bi, t, c, sc] = await Promise.all([
      StorageService.getBudgetItems(),
      StorageService.getTransactions(),
      StorageService.getCategories(),
      StorageService.getSubCategories()
    ]);
    setBudgetItems(bi);
    setTransactions(t);
    setCategories(c);
    setSubCategories(sc);
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentYear, currentMonth + increment, 1);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
  };

  // Fixed: Marked as async and added await for storage operation
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newItem.label || !newItem.categoryId || !newItem.plannedAmount) return;
    let updatedItems = [...budgetItems];
    if (editingId) {
        updatedItems = updatedItems.map(item => item.id === editingId ? { ...item, label: newItem.label!, categoryId: newItem.categoryId!, subCategoryId: newItem.subCategoryId, type: newItem.type!, plannedAmount: Number(newItem.plannedAmount), plannedDate: Number(newItem.plannedDate) || 1 } : item);
    } else {
        updatedItems.push({ id: crypto.randomUUID(), year: currentYear, month: currentMonth, label: newItem.label!, categoryId: newItem.categoryId!, subCategoryId: newItem.subCategoryId, type: newItem.type!, plannedAmount: Number(newItem.plannedAmount), plannedDate: Number(newItem.plannedDate) || 1 });
    }
    setBudgetItems(updatedItems);
    await StorageService.saveBudgetItems(updatedItems);
    setIsAdding(false); setEditingId(null); setNewItem({ type: TransactionType.OUT, plannedAmount: 0, label: '' });
  };

  const calculateActual = (item: BudgetItem) => {
    return transactions.reduce((sum, t) => {
      const tDate = new Date(t.date);
      if (tDate.getMonth() !== item.month || tDate.getFullYear() !== item.year || t.categoryId !== item.categoryId || t.type !== item.type) return sum;
      if (item.subCategoryId && t.subCategoryId !== item.subCategoryId) return sum;
      return sum + t.amount;
    }, 0);
  };

  const renderBudgetTable = (type: TransactionType, title: string) => {
    const items = budgetItems.filter(i => i.month === currentMonth && i.year === currentYear && i.type === type);
    const totalPlanned = items.reduce((s, i) => s + i.plannedAmount, 0);
    const totalActual = items.reduce((s, i) => s + calculateActual(i), 0);
    const totalPct = totalPlanned > 0 ? totalActual / totalPlanned : 0;

    return (
      <div className="bg-fin-card rounded-2xl border border-fin-border overflow-hidden mb-10">
        <div className="px-8 py-6 bg-fin-bg/40 border-b border-fin-border flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className={`w-1 h-4 rounded-full ${type === 'IN' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
             <h3 className="text-xs font-black uppercase tracking-widest text-fin-text">{title}</h3>
          </div>
          <div className="text-[10px] font-black text-fin-muted tracking-widest uppercase">
             {formatCurrency(totalActual)} / {formatCurrency(totalPlanned)}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[9px] text-fin-muted uppercase tracking-widest border-b border-fin-border">
              <tr>
                <th className="px-8 py-4 font-black">Día</th>
                <th className="px-8 py-4 font-black">Concepto</th>
                <th className="px-8 py-4 text-right font-black">Previsto</th>
                <th className="px-8 py-4 text-right font-black">Real</th>
                <th className="px-8 py-4 text-right font-black">Eje.</th>
                <th className="px-8 py-4 text-right font-black">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fin-border/50">
              {items.map(item => {
                const actual = calculateActual(item);
                const pct = item.plannedAmount > 0 ? actual / item.plannedAmount : 0;
                let barColor = 'bg-brand';
                if (type === 'OUT') { if (pct > 1) barColor = 'bg-red-500'; else if (pct > 0.8) barColor = 'bg-amber-500'; else barColor = 'bg-emerald-500'; }
                else { if (pct >= 1) barColor = 'bg-emerald-500'; else barColor = 'bg-brand'; }

                return (
                  <tr key={item.id} className="hover:bg-fin-bg transition-colors">
                    <td className="px-8 py-5 opacity-40 font-bold">{item.plannedDate || '-'}</td>
                    <td className="px-8 py-5">
                       <p className="font-bold text-fin-text">{item.label}</p>
                       <p className="text-[9px] text-fin-muted mt-0.5 uppercase tracking-tighter">
                          {categories.find(c => c.id === item.categoryId)?.name}
                       </p>
                    </td>
                    <td className="px-8 py-5 text-right tabular-nums text-fin-muted">{formatCurrency(item.plannedAmount)}</td>
                    <td className="px-8 py-5 text-right tabular-nums font-black">{formatCurrency(actual)}</td>
                    <td className="px-8 py-5 text-right w-32">
                      <div className="flex items-center justify-end gap-2 mb-1.5">
                        <span className="text-[10px] font-black opacity-60">{Math.round(pct * 100)}%</span>
                      </div>
                       <div className="w-full bg-fin-bg rounded-full h-1 overflow-hidden">
                          <div className={`h-full rounded-full ${barColor} transition-all duration-1000`} style={{ width: `${Math.min(pct*100, 100)}%` }}></div>
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-3 opacity-20 hover:opacity-100 transition-opacity">
                         <button onClick={() => { setEditingId(item.id); setNewItem(item); setIsAdding(true); }} className="text-fin-text hover:text-brand"><Pencil size={14}/></button>
                         {/* Fixed: Use async handler and await storage operation */}
                         <button onClick={async () => { if(confirm('Eliminar ítem?')) { const u = budgetItems.filter(i => i.id !== item.id); setBudgetItems(u); await StorageService.saveBudgetItems(u); } }} className="text-fin-text hover:text-red-500"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {items.length === 0 && <tr><td colSpan={6} className="px-8 py-16 text-center text-fin-muted text-[10px] uppercase tracking-widest opacity-30 italic">Sin proyección configurada</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fin-text uppercase">Presupuesto</h1>
          <p className="text-fin-muted text-sm mt-1">Planificación financiera por periodos</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex bg-fin-card rounded-xl border border-fin-border p-1 items-center">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-fin-bg rounded-lg text-fin-muted transition-colors">
              <ChevronRight className="rotate-180" size={16} />
            </button>
            <span className="px-4 text-[10px] font-black uppercase tracking-widest text-fin-text">
                {new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'short' })} {currentYear}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-fin-bg rounded-lg text-fin-muted transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <button onClick={() => { setIsAdding(!isAdding); setEditingId(null); setNewItem({ type: TransactionType.OUT, plannedAmount: 0, label: '' }); }} className="bg-brand text-fin-bg px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-hover transition-all">
            {isAdding ? 'CERRAR FORM' : 'NUEVO ITEM'}
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-fin-card p-10 rounded-2xl border border-fin-border animate-fade-in mb-8 shadow-2xl">
           <h3 className="text-lg font-black mb-10 text-fin-text uppercase tracking-tight">{editingId ? 'Editar Item' : 'Nueva Proyección'}</h3>
           <form onSubmit={handleSaveItem} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Tipo</label>
                 <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value as TransactionType})} className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-fin-text">
                   <option value={TransactionType.IN}>Ingreso</option>
                   <option value={TransactionType.OUT}>Gasto</option>
                 </select>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Concepto</label>
                 <input type="text" value={newItem.label || ''} onChange={e => setNewItem({...newItem, label: e.target.value})} placeholder="Ej. Alquiler" className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-fin-text" required />
              </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Rubro</label>
                 <select value={newItem.categoryId || ''} onChange={e => setNewItem({...newItem, categoryId: e.target.value, subCategoryId: undefined})} className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-fin-text" required>
                   <option value="">Seleccionar...</option>
                   {categories.filter(c => c.type === newItem.type || c.type === 'MIX').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Día Previsto</label>
                 <input type="number" max="31" min="1" value={newItem.plannedDate || ''} onChange={e => setNewItem({...newItem, plannedDate: Number(e.target.value)})} className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-fin-text" />
              </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Monto Proyectado</label>
                 <input type="number" step="0.01" value={newItem.plannedAmount || ''} onChange={e => setNewItem({...newItem, plannedAmount: Number(e.target.value)})} className="w-full bg-fin-bg border border-fin-border rounded-xl p-3 text-sm text-fin-text font-bold" required />
              </div>
              <div className="flex items-end">
                 <button type="submit" className="w-full bg-brand text-fin-bg rounded-xl py-4 font-black text-xs uppercase tracking-widest hover:bg-brand-hover">
                    {editingId ? 'ACTUALIZAR' : 'GUARDAR PROYECCIÓN'}
                 </button>
              </div>
           </form>
        </div>
      )}

      {renderBudgetTable(TransactionType.IN, 'Ingresos Planificados')}
      {renderBudgetTable(TransactionType.OUT, 'Gastos Planificados')}
    </div>
  );
};
