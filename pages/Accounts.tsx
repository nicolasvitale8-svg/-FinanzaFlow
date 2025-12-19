
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Account, AccountType, MonthlyBalance, TextCategoryRule, Category, TransactionType } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Wallet, Plus, Edit2, X, Trash2, Check, AlertCircle, Info, Zap, Settings2 } from 'lucide-react';

export const Accounts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BALANCES' | 'ACCOUNTS' | 'RULES'>('BALANCES');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [monthlyBalances, setMonthlyBalances] = useState<MonthlyBalance[]>([]);
  const [rules, setRules] = useState<TextCategoryRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  // Modal State for Accounts
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<Account> | null>(null);

  // Modal State for Rules
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<TextCategoryRule> | null>(null);

  useEffect(() => { loadData(); }, []);

  // Fixed loadData to await StorageService results
  const loadData = async () => {
    const [accs, types, balances, rs, cats] = await Promise.all([
        StorageService.getAccounts(),
        StorageService.getAccountTypes(),
        StorageService.getMonthlyBalances(),
        StorageService.getRules(),
        StorageService.getCategories()
    ]);
    setAccounts(accs);
    setAccountTypes(types);
    setMonthlyBalances(balances);
    setRules(rs);
    setCategories(cats);
  };

  // Fixed to call saveMonthlyBalances plural method and await it
  const updateOpeningBalance = async (accountId: string, amount: number) => {
    let updated = [...monthlyBalances];
    const idx = updated.findIndex(mb => mb.accountId === accountId && mb.month === currentMonth && mb.year === currentYear);
    if (idx >= 0) updated[idx] = { ...updated[idx], amount };
    else updated.push({ id: crypto.randomUUID(), accountId, year: currentYear, month: currentMonth, amount });
    await StorageService.saveMonthlyBalances(updated); 
    setMonthlyBalances(updated);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount?.name || !editingAccount?.accountTypeId) return;
    if (editingAccount.id) await StorageService.updateAccount(editingAccount as Account);
    else await StorageService.addAccount({ id: crypto.randomUUID(), name: editingAccount.name, accountTypeId: editingAccount.accountTypeId, currency: editingAccount.currency || 'ARS', isActive: editingAccount.isActive !== undefined ? editingAccount.isActive : true });
    loadData(); setIsAccModalOpen(false); setEditingAccount(null);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule?.pattern || !editingRule?.categoryId) return;
    const newRule: TextCategoryRule = {
      id: editingRule.id || crypto.randomUUID(),
      pattern: editingRule.pattern,
      matchType: 'contains',
      categoryId: editingRule.categoryId,
      isActive: true,
      direction: editingRule.direction || TransactionType.OUT
    };
    const updated = editingRule.id ? rules.map(r => r.id === editingRule.id ? newRule : r) : [...rules, newRule];
    await StorageService.saveRules(updated); loadData(); setIsRuleModalOpen(false); setEditingRule(null);
  };

  const getBalance = (accId: string) => (monthlyBalances.find(m => m.accountId === accId && m.month === currentMonth && m.year === currentYear)?.amount || 0);

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none">Administración</h1>
          <p className="text-fin-muted mt-3 text-sm font-medium">Configura el motor de la aplicación y tus activos.</p>
        </div>
        
        <div className="flex bg-fin-card p-1 rounded-2xl border border-fin-border shadow-lg">
            {[
              { id: 'BALANCES', label: 'Saldos' },
              { id: 'ACCOUNTS', label: 'Cuentas' },
              { id: 'RULES', label: 'Reglas OCR' }
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab.id ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-fin-muted hover:text-fin-text'}`}>{tab.label}</button>
            ))}
        </div>
      </div>

      {activeTab === 'BALANCES' && (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-fin-card p-6 rounded-3xl border border-fin-border">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand/10 text-brand rounded-2xl"><Info size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Período de Conciliación</p>
                    <p className="text-sm font-bold text-white">Saldos iniciales para el mes seleccionado</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-fin-bg px-4 py-2 rounded-2xl border border-fin-border">
                    <select value={currentMonth} onChange={e => setCurrentMonth(Number(e.target.value))} className="bg-transparent border-none text-xs font-bold text-white uppercase outline-none">
                        {Array.from({length: 12}, (_, i) => <option key={i} value={i} className="bg-fin-card">{new Date(2025, i).toLocaleDateString('es-ES', {month: 'long'})}</option>)}
                    </select>
                    <div className="w-px h-4 bg-fin-border"></div>
                    <select value={currentYear} onChange={e => setCurrentYear(Number(e.target.value))} className="bg-transparent border-none text-xs font-bold text-brand outline-none">
                        {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-fin-card">{y}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-fin-card rounded-3xl border border-fin-border overflow-hidden shadow-2xl">
                <table className="w-full text-left text-sm">
                    <thead className="bg-fin-bg/40 border-b border-fin-border">
                        <tr className="text-[10px] text-fin-muted font-black uppercase tracking-widest">
                            <th className="px-10 py-6">Activo Financiero</th>
                            <th className="px-10 py-6 text-right">Saldo de Apertura</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-fin-border/30">
                        {accounts.filter(a => a.isActive).map(acc => (
                            <tr key={acc.id} className="hover:bg-fin-bg/30 transition-colors">
                                <td className="px-10 py-6 font-bold text-white uppercase text-xs flex items-center gap-4">
                                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
                                   {acc.name}
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <input type="number" step="0.01" className="w-40 text-right bg-fin-bg border border-fin-border rounded-xl px-4 py-2 text-sm text-white font-black outline-none focus:border-brand" value={getBalance(acc.id) || ''} onChange={(e) => updateOpeningBalance(acc.id, Number(e.target.value))} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'ACCOUNTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map(acc => (
                <div key={acc.id} className="bg-fin-card p-8 rounded-3xl border border-fin-border flex flex-col justify-between group relative overflow-hidden">
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setEditingAccount(acc); setIsAccModalOpen(true); }} className="p-2 text-fin-muted hover:text-brand bg-fin-bg rounded-lg"><Edit2 size={14} /></button>
                        {/* Fixed: Use async and await for storage operation */}
                        <button onClick={async () => { if(confirm('¿Borrar?')) { await StorageService.deleteAccount(acc.id); loadData(); } }} className="p-2 text-fin-muted hover:text-red-500 bg-fin-bg rounded-lg"><Trash2 size={14} /></button>
                    </div>
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 rounded-xl bg-fin-bg text-brand border border-fin-border"><Wallet size={20} /></div>
                        <div>
                            <h4 className="font-black text-white uppercase text-sm">{acc.name}</h4>
                            <span className="text-[9px] font-black uppercase text-fin-muted">{accountTypes.find(t => t.id === acc.accountTypeId)?.name}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-fin-border/30 pt-4">
                        <span className="text-[10px] font-bold text-white/40 uppercase">{acc.currency}</span>
                        <div className={`w-2 h-2 rounded-full ${acc.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    </div>
                </div>
            ))}
            <button onClick={() => { setEditingAccount({ currency: 'ARS', isActive: true }); setIsAccModalOpen(true); }} className="bg-fin-bg/40 p-8 rounded-3xl border-2 border-dashed border-fin-border flex flex-col items-center justify-center gap-3 text-fin-muted hover:text-brand hover:border-brand/50 transition-all">
                <Plus size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">Añadir Cuenta</span>
            </button>
        </div>
      )}

      {activeTab === 'RULES' && (
        <div className="space-y-6">
            <div className="bg-brand/5 border border-brand/20 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand text-white rounded-2xl shadow-lg shadow-brand/20"><Zap size={20} /></div>
                    <div>
                        <h4 className="font-bold text-white">Auto-Categorización</h4>
                        <p className="text-xs text-fin-muted">Define palabras clave para que el importador OCR asigne rubros automáticamente.</p>
                    </div>
                </div>
                <button onClick={() => { setEditingRule({}); setIsRuleModalOpen(true); }} className="bg-brand text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-hover shadow-lg shadow-brand/20 transition-all flex items-center gap-2">
                    <Plus size={14} /> Nueva Regla
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rules.map(rule => (
                    <div key={rule.id} className="bg-fin-card p-6 rounded-2xl border border-fin-border flex justify-between items-center group">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-brand uppercase tracking-widest">{rule.pattern}</p>
                            <p className="text-xs font-bold text-white">{categories.find(c => c.id === rule.categoryId)?.name}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingRule(rule); setIsRuleModalOpen(true); }} className="p-2 text-fin-muted hover:text-white"><Edit2 size={14}/></button>
                            {/* Fixed: Added async keyword to allow await within the event handler */}
                            <button onClick={async () => { if(confirm('¿Borrar regla?')) { const u = rules.filter(r => r.id !== rule.id); await StorageService.saveRules(u); loadData(); } }} className="p-2 text-fin-muted hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
                {rules.length === 0 && <div className="col-span-full py-20 text-center text-fin-muted text-xs uppercase font-black opacity-20 tracking-widest">No hay reglas configuradas</div>}
            </div>
        </div>
      )}

      {/* Account Modal */}
      {isAccModalOpen && (
        <div className="fixed inset-0 bg-fin-bg/90 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-fin-card rounded-[32px] w-full max-w-lg border border-fin-border shadow-2xl p-10 relative">
            <button onClick={() => setIsAccModalOpen(false)} className="absolute top-8 right-8 text-fin-muted hover:text-white"><X size={24}/></button>
            <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tight">{editingAccount?.id ? 'Editar Cuenta' : 'Nueva Cuenta'}</h2>
            <form onSubmit={handleSaveAccount} className="space-y-6">
                <input type="text" value={editingAccount?.name || ''} onChange={e => setEditingAccount({...editingAccount, name: e.target.value})} className="w-full bg-fin-bg border border-fin-border rounded-xl p-4 text-white font-bold" placeholder="Nombre de la cuenta" required />
                <div className="grid grid-cols-2 gap-4">
                    <select value={editingAccount?.accountTypeId || ''} onChange={e => setEditingAccount({...editingAccount, accountTypeId: e.target.value})} className="bg-fin-bg border border-fin-border rounded-xl p-4 text-white text-xs font-bold" required>
                        <option value="">Tipo...</option>
                        {accountTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <select value={editingAccount?.currency || 'ARS'} onChange={e => setEditingAccount({...editingAccount, currency: e.target.value})} className="bg-fin-bg border border-fin-border rounded-xl p-4 text-white text-xs font-bold">
                        <option value="ARS">ARS</option>
                        <option value="USD">USD</option>
                    </select>
                </div>
                <button type="submit" className="w-full py-4 bg-brand text-white rounded-xl font-black text-xs uppercase tracking-widest">Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}

      {/* Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 bg-fin-bg/90 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-fin-card rounded-[32px] w-full max-w-lg border border-fin-border shadow-2xl p-10 relative">
            <button onClick={() => setIsRuleModalOpen(false)} className="absolute top-8 right-8 text-fin-muted hover:text-white"><X size={24}/></button>
            <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tight">Nueva Regla Inteligente</h2>
            <form onSubmit={handleSaveRule} className="space-y-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-fin-muted ml-1">Palabra Clave (Pattern)</label>
                    <input type="text" value={editingRule?.pattern || ''} onChange={e => setEditingRule({...editingRule, pattern: e.target.value})} className="w-full bg-fin-bg border border-fin-border rounded-xl p-4 text-white font-bold" placeholder="Ej: Carcor, Netflix, Sueldo" required />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-fin-muted ml-1">Asignar Rubro</label>
                    <select value={editingRule?.categoryId || ''} onChange={e => setEditingRule({...editingRule, categoryId: e.target.value})} className="w-full bg-fin-bg border border-fin-border rounded-xl p-4 text-white text-xs font-bold" required>
                        <option value="">Seleccionar rubro...</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <button type="submit" className="w-full py-4 bg-brand text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand/20">Crear Regla</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
