
import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storageService';
import { Account, Category, ImportLine, TransactionType, Transaction } from '../types';
import { parseRawText, applyRules } from '../utils/importEngine';
import { formatCurrency } from '../utils/calculations';
import { Camera, Loader2, CheckCircle2, ChevronLeft, ChevronRight, FileText, Sparkles, AlertTriangle, Trash2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

declare const Tesseract: any;

export const ImportPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [rawText, setRawText] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [importedLines, setImportedLines] = useState<ImportLine[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingTransactions, setExistingTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setAccounts(StorageService.getAccounts());
    setCategories(StorageService.getCategories());
    setExistingTransactions(StorageService.getTransactions());
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    setScanProgress(0);
    try {
        const { data: { text } } = await Tesseract.recognize(file, 'eng', { 
          logger: (m: any) => { 
            if (m.status === 'recognizing text') setScanProgress(Math.round(m.progress * 100)); 
          } 
        });
        setRawText(prev => (prev ? prev + '\n\n' : '') + text);
    } catch (err) { 
      console.error(err);
      alert("Error al procesar la imagen. Intenta con un archivo más claro."); 
    }
    finally { setIsScanning(false); }
  };

  const processText = () => {
    if (!selectedAccountId) return alert("Por favor, selecciona la cuenta donde se guardarán los movimientos.");
    let lines = parseRawText(rawText);
    const rules = StorageService.getRules();
    
    lines = applyRules(lines, rules).map(line => ({
        ...line,
        isDuplicate: !!existingTransactions.find(t => 
          t.accountId === selectedAccountId && 
          Math.abs(t.amount - line.amount) < 0.01 && 
          t.type === line.type && 
          t.date === line.date
        )
    }));

    if (lines.length === 0) return alert("No pudimos detectar movimientos en el texto. Asegúrate de que la imagen sea legible.");
    
    // Auto-unselect duplicates
    setImportedLines(lines.map(l => ({...l, isSelected: !l.isDuplicate}))); 
    setStep(2);
  };

  const handleImport = () => {
    const toImport = importedLines.filter(l => l.isSelected && l.categoryId);
    if (toImport.length === 0) {
      alert("No hay movimientos seleccionados con categoría asignada.");
      return;
    }

    toImport.forEach(line => {
      StorageService.addTransaction({ 
        id: crypto.randomUUID(), 
        date: line.date, 
        description: line.description, 
        amount: line.amount, 
        type: line.type, 
        accountId: selectedAccountId, 
        categoryId: line.categoryId!, 
        subCategoryId: line.subCategoryId 
      });
    });

    alert(`${toImport.length} movimientos importados con éxito.`);
    navigate('/transactions');
  };

  if (step === 1) {
    return (
      <div className="max-w-3xl mx-auto space-y-12 animate-fade-in pb-20">
        <div className="text-center space-y-4">
          <div className="inline-flex p-3 bg-brand/10 rounded-2xl text-brand mb-2">
            <Sparkles size={28} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Sincronizador Inteligente</h1>
          <p className="text-fin-muted max-w-lg mx-auto font-medium">Carga capturas de tus billeteras digitales (MercadoPago, Lemon, Brubank) para automatizar tu registro.</p>
        </div>

        <div className="bg-fin-card p-10 rounded-[32px] border border-fin-border shadow-2xl space-y-10 relative overflow-hidden">
          {/* Progress Overlay during Scan */}
          {isScanning && (
            <div className="absolute inset-0 z-20 bg-fin-card/60 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center animate-fade-in">
              <div className="relative mb-8">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-fin-border" />
                  <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377 - (377 * scanProgress) / 100} className="text-brand transition-all duration-300 stroke-round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-white tabular-nums">{scanProgress}%</span>
                </div>
              </div>
              <h3 className="text-xl font-black text-white mb-2">Procesando Imagen...</h3>
              <p className="text-fin-muted text-sm font-medium">Tesseract está extrayendo los datos mediante OCR</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand ml-1 flex items-center gap-2">
                <CheckCircle2 size={12} /> 1. Destino
              </label>
              <select 
                value={selectedAccountId} 
                onChange={e => setSelectedAccountId(e.target.value)}
                className="w-full bg-fin-bg border border-fin-border rounded-2xl p-4 text-white font-bold focus:border-brand outline-none appearance-none cursor-pointer transition-all"
              >
                <option value="">Seleccionar cuenta destino...</option>
                {accounts.filter(a => a.isActive).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1 flex items-center gap-2">
                <Info size={12} /> Sugerencia
              </label>
              <div className="bg-fin-bg/50 border border-fin-border rounded-2xl p-4 text-[11px] text-fin-muted italic">
                Usa capturas claras del historial de movimientos para mejores resultados.
              </div>
            </div>
          </div>

          <div 
            onClick={() => !isScanning && fileInputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center gap-6 py-16 px-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
              isScanning ? 'border-brand bg-brand/5' : 'border-fin-border hover:border-brand/40 hover:bg-brand/5'
            }`}
          >
            {/* Scanning Beam Animation */}
            {isScanning && <div className="absolute inset-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent animate-[scan_2s_linear_infinite] shadow-[0_0_15px_#3B82F6]"></div>}

            <div className="p-5 bg-brand/10 rounded-2xl text-brand group-hover:scale-110 transition-transform">
              <Camera size={40} strokeWidth={2} />
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-white">Subir Historial</p>
              <p className="text-xs text-fin-muted font-medium mt-1">Haz clic para seleccionar o arrastra la imagen aquí</p>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted">Contenido Detectado</label>
              <button 
                onClick={() => setRawText("02 de diciembre\n- $ 5.370 00\nPago a Carcor\n\n28 de noviembre\n+ $ 1.250 50\nIngreso de dinero")}
                className="text-[9px] font-black text-brand uppercase tracking-widest hover:underline"
              >
                Cargar ejemplo
              </button>
            </div>
            <div className="relative">
              <textarea 
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Pega texto directamente o sube una imagen..."
                className="w-full h-44 bg-fin-bg border border-fin-border rounded-2xl p-5 text-xs text-fin-muted font-mono focus:text-white focus:border-brand outline-none resize-none transition-all scrollbar-hide"
              />
              <FileText className="absolute bottom-5 right-5 text-fin-border/30" size={20} />
            </div>
          </div>

          <button 
            onClick={processText}
            disabled={!rawText || !selectedAccountId || isScanning}
            className="w-full bg-brand text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-brand-hover disabled:opacity-20 transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-3 group"
          >
            Analizar Movimientos <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-5">
               <button onClick={() => setStep(1)} className="p-3.5 bg-fin-card border border-fin-border rounded-2xl text-fin-muted hover:text-white transition-all shadow-lg">
                  <ChevronLeft size={24} strokeWidth={3} />
               </button>
               <div>
                 <h1 className="text-3xl font-black text-white tracking-tight">Validación de Datos</h1>
                 <p className="text-fin-muted text-xs font-bold uppercase tracking-widest mt-1">Revisa y categoriza antes de guardar</p>
               </div>
            </div>
            <button 
              onClick={handleImport}
              className="w-full sm:w-auto bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all"
            >
                <CheckCircle2 size={18} /> Importar ({importedLines.filter(l => l.isSelected).length})
            </button>
        </div>

        {/* Duplicate Warning Banner */}
        {importedLines.some(l => l.isDuplicate) && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl flex items-center gap-4 animate-fade-in">
            <div className="p-2.5 bg-amber-500/20 text-amber-500 rounded-xl">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Posibles duplicados detectados</p>
              <p className="text-xs text-amber-500/80 font-medium">Hemos desmarcado automáticamente los movimientos que ya parecen estar registrados.</p>
            </div>
          </div>
        )}

        <div className="bg-fin-card rounded-3xl border border-fin-border overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-fin-bg/40 border-b border-fin-border">
                      <tr className="text-[10px] text-fin-muted font-black uppercase tracking-widest">
                          <th className="px-10 py-6 w-12 text-center">
                              <input type="checkbox" checked={importedLines.length > 0 && importedLines.every(l => l.isSelected)} onChange={e => setImportedLines(l => l.map(x => ({...x, isSelected: e.target.checked})))} className="w-5 h-5 rounded-lg border-fin-border bg-fin-bg text-brand focus:ring-brand accent-brand" />
                          </th>
                          <th className="px-10 py-6">Fecha</th>
                          <th className="px-10 py-6">Detalle</th>
                          <th className="px-10 py-6 text-right">Monto</th>
                          <th className="px-10 py-6">Rubro</th>
                          <th className="px-10 py-6 text-center"></th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-fin-border/30">
                      {importedLines.map(line => (
                          <tr key={line.id} className={`${line.isDuplicate ? 'bg-amber-500/5' : 'hover:bg-fin-bg/30'} transition-colors group ${!line.isSelected ? 'opacity-50' : ''}`}>
                              <td className="px-10 py-7 text-center">
                                  <input type="checkbox" checked={line.isSelected} onChange={e => setImportedLines(lines => lines.map(l => l.id === line.id ? { ...l, isSelected: e.target.checked } : l))} className="w-5 h-5 rounded-lg border-fin-border bg-fin-bg text-brand accent-brand cursor-pointer" />
                              </td>
                              <td className="px-10 py-7 font-bold text-white/50 tabular-nums text-xs whitespace-nowrap">{line.date}</td>
                              <td className="px-10 py-7">
                                  <div className="space-y-1">
                                    <p className="font-black text-white text-[15px] leading-tight group-hover:text-brand transition-colors">{line.description}</p>
                                    {line.isDuplicate && (
                                      <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase tracking-tighter bg-amber-500/10 px-2 py-0.5 rounded">
                                        <AlertTriangle size={8} /> Ya registrado
                                      </span>
                                    )}
                                  </div>
                              </td>
                              <td className={`px-10 py-7 text-right font-black tabular-nums text-lg ${line.type === 'IN' ? 'text-emerald-500' : 'text-white'}`}>
                                  {line.type === 'IN' ? '+' : '-'}{formatCurrency(line.amount)}
                              </td>
                              <td className="px-10 py-7">
                                  <select 
                                      className="bg-fin-bg border border-fin-border rounded-xl px-4 py-2.5 text-[11px] font-black text-white focus:border-brand outline-none w-full min-w-[140px] appearance-none cursor-pointer hover:border-brand/50 transition-all"
                                      value={line.categoryId || ''}
                                      onChange={e => setImportedLines(lines => lines.map(l => l.id === line.id ? { ...l, categoryId: e.target.value } : l))}
                                  >
                                      <option value="">ASIGNAR RUBRO...</option>
                                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                  </select>
                              </td>
                              <td className="px-10 py-7 text-center">
                                <button 
                                  onClick={() => setImportedLines(lines => lines.filter(l => l.id !== line.id))}
                                  className="text-fin-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>
        </div>
    </div>
  );
};
