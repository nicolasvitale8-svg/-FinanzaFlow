
import React, { useRef, useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { GoogleDriveService } from '../services/googleDriveService';
import { 
  Download, Upload, Database, AlertCircle, 
  Cloud, Smartphone, Monitor, RefreshCw, ChevronRight, 
  ExternalLink, Terminal, CheckCircle2, LogOut, Loader2, Key, Info, Globe
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dataStats, setDataStats] = useState({ transactions: 0, accounts: 0 });
  const [isGoogleSyncing, setIsGoogleSyncing] = useState(false);
  const [googleUser, setGoogleUser] = useState<string | null>(GoogleDriveService.getAccessToken());
  const [clientId, setClientId] = useState(GoogleDriveService.getClientId());
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      const [t, a] = await Promise.all([StorageService.getTransactions(), StorageService.getAccounts()]);
      setDataStats({ transactions: t.length, accounts: a.length });
    };
    loadStats();
  }, []);

  const saveClientId = () => {
    GoogleDriveService.setClientId(clientId);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleGoogleLogin = () => {
    if (!clientId) {
      alert("Por favor, ingresa tu Google Client ID primero.");
      return;
    }

    try {
      // @ts-ignore
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response: any) => {
          if (response.access_token) {
            GoogleDriveService.setAccessToken(response.access_token);
            setGoogleUser(response.access_token);
            syncNow();
          }
        },
      });
      client.requestAccessToken();
    } catch (e) {
      alert("Error al iniciar sesión. Verifica que el Client ID sea correcto y que tu dominio esté autorizado en Google Cloud Console.");
    }
  };

  const syncNow = async () => {
    setIsGoogleSyncing(true);
    const success = await StorageService.pullFromGoogleDrive();
    if (success) {
      alert("Sincronización exitosa: Datos traídos desde Drive.");
    }
    await StorageService.pushToGoogleDrive();
    setIsGoogleSyncing(false);
    window.location.reload();
  };

  const handleLogout = () => {
    GoogleDriveService.logout();
    setGoogleUser(null);
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand text-[10px] font-black uppercase tracking-[0.4em]">
            <Terminal size={12} /> Cloud Infrastructure
          </div>
          <h1 className="text-5xl font-extrabold text-white tracking-tighter">Despliegue</h1>
        </div>
        
        <div className={`px-6 py-4 rounded-3xl flex items-center gap-4 border-2 transition-all ${
          googleUser 
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>
           <div className="p-2 rounded-lg bg-fin-bg border border-white/10"><Globe size={14}/></div>
           <div>
             <span className="text-[10px] font-black uppercase tracking-widest block leading-none">
               {googleUser ? 'Listo para el Celular' : 'Solo en esta PC'}
             </span>
             <span className="text-[9px] font-bold opacity-60">
               {googleUser ? 'Datos en la nube activados' : 'Configura Drive para portabilidad'}
             </span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Google Drive Configuration */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-fin-card p-10 rounded-[40px] border border-fin-border shadow-2xl space-y-10">
              
              {/* Step 1: Client ID */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center"><Key size={20} /></div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">1. Llave de Google (Client ID)</h3>
                </div>
                
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    placeholder="XXXXXXXX.apps.googleusercontent.com"
                    className="flex-1 bg-fin-bg border border-fin-border rounded-2xl px-6 py-4 text-xs text-white focus:border-brand outline-none font-mono"
                  />
                  <button 
                    onClick={saveClientId}
                    className={`px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      isSaved ? 'bg-emerald-500 text-white' : 'bg-brand text-white hover:bg-brand-hover'
                    }`}
                  >
                    {isSaved ? 'Guardado' : 'Guardar'}
                  </button>
                </div>
                <p className="text-[10px] text-fin-muted leading-relaxed flex items-center gap-2">
                  <Info size={12} /> Consigue esta llave gratis en la <a href="https://console.cloud.google.com" target="_blank" className="text-brand hover:underline">Google Cloud Console</a>.
                </p>
              </div>

              {/* Step 2: Connection */}
              <div className="space-y-6 pt-6 border-t border-fin-border/30">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center"><Cloud size={20} /></div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">2. Conexión de Datos</h3>
                </div>

                {!googleUser ? (
                  <button 
                    onClick={handleGoogleLogin}
                    disabled={!clientId}
                    className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-fin-text transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-4 h-4" />
                    Iniciar Sesión con Google Drive
                  </button>
                ) : (
                  <div className="space-y-4">
                     <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl">
                        <div className="flex items-center gap-3">
                           <CheckCircle2 className="text-emerald-500" size={18} />
                           <span className="text-xs font-black text-white uppercase tracking-widest">Estado: Nube Activa</span>
                        </div>
                        <button onClick={syncNow} disabled={isGoogleSyncing} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest">
                          {isGoogleSyncing ? <Loader2 className="animate-spin" size={12} /> : <RefreshCw size={12} />} Force Sync
                        </button>
                     </div>
                     <button 
                       onClick={handleLogout}
                       className="w-full py-4 text-fin-muted hover:text-rose-500 text-[10px] font-black uppercase tracking-widest transition-all"
                     >
                       Desconectar Cuenta
                     </button>
                  </div>
                )}
              </div>
           </div>
        </div>

        {/* Sidebar: Guía Rápida */}
        <div className="space-y-6">
           <div className="bg-fin-card p-8 rounded-[32px] border border-fin-border shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand mb-6">Guía de Despliegue</h3>
              <ul className="space-y-6">
                 {[
                   { t: "Despliega la Web", d: "Sube este código a Vercel o Netlify (es gratis)." },
                   { t: "Configura Google", d: "Crea un proyecto en Google Cloud y habilita 'Google Drive API'." },
                   { t: "Autoriza la URL", d: "Añade la URL de tu app en 'Authorized JavaScript origins'." },
                   { t: "Pega el Client ID", d: "Pon la llave aquí y pulsa Guardar." }
                 ].map((step, i) => (
                   <li key={i} className="flex gap-4">
                      <span className="text-xl font-black text-brand/20">{i+1}</span>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase">{step.t}</p>
                        <p className="text-[10px] text-fin-muted mt-1 leading-tight">{step.d}</p>
                      </div>
                   </li>
                 ))}
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
};
