
import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storageService';
import { Account, Category, ImportLine, TransactionType, Transaction } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { formatCurrency } from '../utils/calculations';
import { Camera, Loader2, CheckCircle2, ChevronLeft, ChevronRight, FileText, Sparkles, AlertTriangle, Trash2, Info, BrainCircuit, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ImportPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [importedLines, setImportedLines] = useState<ImportLine[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingTransactions, setExistingTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Fixed: Await data loading
    const loadData = async () => {
        const [accs, cats, trans] = await Promise.all([
            StorageService.getAccounts(),
            StorageService.getCategories(),
            StorageService.getTransactions()
        ]);
        setAccounts(accs);
        setCategories(cats);
        setExistingTransactions(trans);
    };
    loadData();
  }, []);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.readAsDataURL(blob);
    });
  };

  const processWithAI = async (file: File) => {
    if (!selectedAccountId) {
      alert("Selecciona primero una cuenta destino.");
      return;
    }

    setIsScanning(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = await blobToBase64(file);

      const prompt = `Analyze this financial transaction screenshot or receipt. 
      Extract ALL transactions found. Return ONLY a JSON array.
      Schema: [{ "date": "YYYY-MM-DD", "description": "Short name", "amount": 123.45, "type": "IN" | "OUT" }]
      If the image is from an Argentine wallet like MercadoPago, Brubank, or Lemon, handle the currency (ARS) correctly. 
      Interpret signs like '-' as OUT and '+' or 'Ingreso' as IN.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: file.type } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                type: { type: Type.STRING }
              },
              required: ["date", "description", "amount", "type"]
            }
          }
        }
      });

      const rawJson = JSON.parse(response.text);
      // Fixed: Await getRules() promise before using find
      const rules = await StorageService.getRules();
      
      const lines: ImportLine[] = rawJson.map((item: any) => {
        // Auto-apply rules logic
        const ruleMatch = rules.find(r => 
          item.description.toLowerCase().includes(r.pattern.toLowerCase())
        );

        const isDuplicate = !!existingTransactions.find(t => 
          t.accountId === selectedAccountId && 
          Math.abs(t.amount - item.amount) < 1 && 
          t.date === item.date
        );

        return {
          id: crypto.randomUUID(),
          rawText: item.description,
          date: item.date,
          description: item.description,
          amount: Math.abs(item.amount),
          type: item.type as TransactionType,
          categoryId: ruleMatch?.categoryId,
          isSelected: !isDuplicate,
          isDuplicate: isDuplicate
        };
      });

      setImportedLines(lines);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("La IA no pudo procesar la imagen. Asegúrate de que los datos sean legibles.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleImport = () => {
    const toImport = importedLines.filter(l => l.isSelected && l.categoryId);
    if (toImport.length === 0) {
      alert("Asegúrate de seleccionar movimientos y asignarles un rubro.");
      return;
    }

    toImport.forEach(async (line) => {
      await StorageService.addTransaction({ 
        id: crypto.randomUUID(), 
        date: line.date, 
        description: line.description, 
        amount: line.amount, 
        type: line.type, 
        accountId: selectedAccountId, 
        categoryId: line.categoryId!, 
      });
    });

    navigate('/transactions');
  };

  if (step === 1) {
    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 rounded-full text-brand border border-brand/20">
            <BrainCircuit size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Powered by Gemini AI</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight">Escáner Inteligente</h1>
          <p className="text-fin-muted max-w-xl mx-auto text-lg">La IA analiza tus capturas y detecta movimientos automáticamente.</p>
        </div>

        <div className="bg-fin-card p-10 rounded-[40px] border border-fin-border shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand ml-1 flex items-center gap-2">
                <Zap size={12} /> Cuenta Destino
              </label>
              <select 
                value={selectedAccountId} 
                onChange={e => setSelectedAccountId(e.target.value)}
                className="w-full bg-fin-bg border border-fin-border rounded-2xl p-4 text-white font-bold focus:border-brand outline-none transition-all cursor-pointer"
              >
                <option value="">¿A dónde va el dinero?</option>
                {accounts.filter(a => a.isActive).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="bg-brand/5 border border-brand/10 rounded-2xl p-5 flex items-center gap-4">
               <Info className="text-brand shrink-0" size={20} />
               <p className="text-xs text-fin-muted leading-relaxed">Sube capturas de MercadoPago, bancos o tickets físicos. La IA identificará montos y fechas sin fallar.</p>
            </div>
          </div>

          <div 
            onClick={() => !isScanning && fileInputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center gap-8 py-24 rounded-[32px] border-2 border-dashed transition-all cursor-pointer ${
              isScanning ? 'border-brand bg-brand/5' : 'border-fin-border hover:border-brand/40 hover:bg-brand/5'
            }`}
          >
            {isScanning && <div className="absolute top-0 left-0 w-full scanning-line z-10"></div>}
            
            <div className={`p-8 rounded-3xl bg-brand/10 text-brand group-hover:scale-110 transition-all duration-500 ${isScanning ? 'animate-pulse' : ''}`}>
              {isScanning ? <Loader2 className="animate-spin" size={48} /> : <Camera size={48} strokeWidth={1.5} />}
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-2xl font-black text-white">{isScanning ? 'La IA está pensando...' : 'Subir o Capturar'}</p>
              <p className="text-sm text-fin-muted font-medium">PNG, JPG o WebP hasta 10MB</p>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              capture="environment"
              onChange={e => e.target.files?.[0] && processWithAI(e.target.files[0])} 
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-5">
               <button onClick={() => setStep(1)} className="p-4 bg-fin-card border border-fin-border rounded-2xl text-fin-muted hover:text-white transition-all shadow-lg">
                  <ChevronLeft size={24} />
               </button>
               <div>
                 <h1 className="text-3xl font-black text-white tracking-tight">Confirmar Lectura IA</h1>
                 <p className="text-brand text-xs font-black uppercase tracking-widest mt-1">Revisión de movimientos detectados</p>
               </div>
            </div>
            <button 
              onClick={handleImport}
              className="w-full sm:w-auto bg-brand text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand/20 flex items-center justify-center gap-3 hover:bg-brand-hover transition-all"
            >
                <CheckCircle2 size={18} /> Importar Selección
            </button>
        </div>

        <div className="bg-fin-card rounded-[32px] border border-fin-border overflow-hidden shadow-2xl">
            <table className="w-full text-left text-sm">
                <thead className="bg-fin-bg/40 border-b border-fin-border">
                    <tr className="text-[10px] text-fin-muted font-black uppercase tracking-widest">
                        <th className="px-10 py-6 w-12 text-center">
                            <input type="checkbox" checked={importedLines.every(l => l.isSelected)} onChange={e => setImportedLines(l => l.map(x => ({...x, isSelected: e.target.checked})))} className="w-5 h-5 rounded-lg accent-brand" />
                        </th>
                        <th className="px-10 py-6">Fecha</th>
                        <th className="px-10 py-6">Descripción Detectada</th>
                        <th className="px-10 py-6 text-right">Monto</th>
                        <th className="px-10 py-6">Rubro Sugerido</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-fin-border/30">
                    {importedLines.map(line => (
                        <tr key={line.id} className={`transition-colors group ${line.isDuplicate ? 'bg-amber-500/5' : 'hover:bg-fin-bg/30'} ${!line.isSelected ? 'opacity-40' : ''}`}>
                            <td className="px-10 py-8 text-center">
                                <input type="checkbox" checked={line.isSelected} onChange={e => setImportedLines(lines => lines.map(l => l.id === line.id ? { ...l, isSelected: e.target.checked } : l))} className="w-5 h-5 rounded-lg accent-brand cursor-pointer" />
                            </td>
                            <td className="px-10 py-8 font-bold text-white/50 tabular-nums text-xs">{line.date}</td>
                            <td className="px-10 py-8">
                                <p className="font-black text-white text-[15px]">{line.description}</p>
                                {line.isDuplicate && <span className="text-[8px] font-black text-amber-500 uppercase flex items-center gap-1 mt-1"><AlertTriangle size={10} /> Posible duplicado</span>}
                            </td>
                            <td className={`px-10 py-8 text-right font-black tabular-nums text-lg ${line.type === 'IN' ? 'text-emerald-500' : 'text-white'}`}>
                                {line.type === 'IN' ? '+' : '-'}{formatCurrency(line.amount)}
                            </td>
                            <td className="px-10 py-8">
                                <select 
                                    className="bg-fin-bg border border-fin-border rounded-xl px-4 py-2 text-[10px] font-black text-white focus:border-brand outline-none w-full"
                                    value={line.categoryId || ''}
                                    onChange={e => setImportedLines(lines => lines.map(l => l.id === line.id ? { ...l, categoryId: e.target.value } : l))}
                                >
                                    <option value="">ASIGNAR...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};
