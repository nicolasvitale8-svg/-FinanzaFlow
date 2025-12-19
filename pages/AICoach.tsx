
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { StorageService } from '../services/storageService';
import { Transaction, Account, Category } from '../types';
import { formatCurrency } from '../utils/calculations';
import { MessageSquare, Send, Bot, Sparkles, Loader2, User, Zap, AlertCircle } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

export const AICoach: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [dataContext, setDataContext] = useState('');

  useEffect(() => {
    // Fixed: Wrapped data fetching in an async function to correctly await StorageService
    const initData = async () => {
        const transactions = await StorageService.getTransactions();
        const categories = await StorageService.getCategories();
        
        // Create a compact context for the AI
        const summary = transactions.slice(-30).map(t => {
          const cat = categories.find(c => c.id === t.categoryId)?.name;
          return `${t.date}: ${t.description} (${cat}) ${t.type === 'IN' ? '+' : '-'}${t.amount}`;
        }).join('\n');

        setDataContext(`You are a world-class financial advisor for 'FinanzaFlow'. 
        User's last 30 transactions:\n${summary}\n
        Be concise, professional, and provide actionable tips in Spanish.`);
        
        setMessages([{
          id: '1',
          role: 'assistant',
          content: '¡Hola! Soy tu asistente financiero personal. He analizado tus últimos movimientos. ¿En qué puedo ayudarte hoy?'
        }]);
    };
    initData();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Fix: Correct usage of GoogleGenAI and systemInstruction config for Complex Text Tasks
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: input,
        config: {
          systemInstruction: dataContext
        }
      });

      const assistantMsg: ChatMessage = { 
        id: crypto.randomUUID(), 
        role: 'assistant', 
        content: response.text || 'Perdón, tuve un problema analizando eso. ¿Podrías repetir?' 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: 'Lo siento, no puedo conectarme con mi cerebro AI en este momento.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
             <MessageSquare className="text-brand" /> Asistente AI
          </h1>
          <p className="text-fin-muted text-sm mt-1 uppercase font-bold tracking-widest flex items-center gap-2">
            <Zap size={14} className="text-amber-500" /> Consultoría Financiera en tiempo real
          </p>
        </div>
      </div>

      <div className="flex-1 bg-fin-card border border-fin-border rounded-[40px] flex flex-col overflow-hidden shadow-2xl relative">
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                  m.role === 'user' ? 'bg-brand/20 text-brand border border-brand/20' : 'bg-fin-bg text-fin-text border border-fin-border'
                }`}>
                  {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={`p-6 rounded-[28px] text-sm leading-relaxed ${
                  m.role === 'user' 
                  ? 'bg-brand text-white font-medium rounded-tr-none' 
                  : 'bg-fin-bg/50 border border-fin-border text-fin-text rounded-tl-none'
                }`}>
                  {m.content}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-4 items-center p-6 bg-fin-bg/50 border border-fin-border rounded-[28px] rounded-tl-none">
                 <Loader2 className="animate-spin text-brand" size={18} />
                 <span className="text-xs font-black uppercase tracking-widest text-fin-muted">Pensando...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-6 bg-fin-bg/30 border-t border-fin-border backdrop-blur-xl">
           <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Pregunta sobre tus gastos, ahorros o pide un consejo..."
                className="w-full bg-fin-bg border border-fin-border rounded-2xl py-5 pl-8 pr-20 text-white focus:border-brand outline-none transition-all placeholder:text-fin-muted font-medium"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 top-2 bottom-2 bg-brand text-white px-6 rounded-xl hover:bg-brand-hover transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
           </form>
        </div>
      </div>
      
      <div className="flex items-center gap-3 px-6 py-4 bg-brand/5 border border-brand/10 rounded-2xl">
         <AlertCircle className="text-brand shrink-0" size={18} />
         <p className="text-[10px] text-fin-muted font-bold leading-tight">
           El Asistente AI utiliza tus datos locales para generar consejos. Recuerda que son recomendaciones algorítmicas y no constituyen asesoramiento financiero legal.
         </p>
      </div>
    </div>
  );
};
