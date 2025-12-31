
import React, { useRef, useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { GoogleDriveService } from '../services/googleDriveService';
import { 
  Download, Upload, Database, AlertCircle, 
  Cloud, Smartphone, Monitor, RefreshCw, ChevronRight, 
  ExternalLink, Terminal, CheckCircle2, LogOut, Loader2, Key, Info, Globe,
  UserPlus, Copy, Code, Shield
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
      alert("Error al iniciar sesión. Verifica que el Client ID sea correcto.");
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
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-24 text-fin-text">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand text-[10px] font-black uppercase tracking-[0.4em]">
            <Terminal size={12} /> System Management
          </div>
          <h1 className="text-5xl font-extrabold text-white tracking-tighter">Ajustes</h1>
        </div>
        
        <div className={`px-6 py-4 rounded-3xl flex items-center gap-4 border-2 transition-all ${
          googleUser 
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>
           <div className="p-2 rounded-lg bg-fin-bg border border-white/10"><Globe size={14}/></div>
           <div>
             <span className="text-[10px] font-black uppercase tracking-widest block leading-none">
               {googleUser ? 'Cloud Active' : 'Offline Mode'}
             </span>
             <span className="text-[9px] font-bold opacity-60">
               {googleUser ? 'Conectado a Google Drive' : 'Datos locales únicamente'}
             </span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Google Drive Card */}
           <div className="bg-fin-card p-10 rounded-[40px] border border-fin-border shadow-2xl space-y-10 relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center"><Cloud size={20} /></div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Cloud Personal (Drive)</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    placeholder="Google Client ID..."
                    className="flex-1 bg-fin-bg border border-fin-border rounded-2xl px-6 py-4 text-xs text-white focus:border-brand outline-none font-mono"
                  />
                  <button onClick={saveClientId} className={`px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isSaved ? 'bg-emerald-500 text-white' : 'bg-brand text-white hover:bg-brand-hover'}`}>
                    {isSaved ? 'Guardado' : 'Guardar ID'}
                  </button>
                </div>

                {!googleUser ? (
                  <button onClick={handleGoogleLogin} className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-fin-text transition-all flex items-center justify-center gap-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-4 h-4" />
                    Vincular mi Google Drive
                  </button>
                ) : (
                  <div className="flex gap-4">
                     <button onClick={syncNow} disabled={isGoogleSyncing} className="flex-1 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                        {isGoogleSyncing ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />} Sincronizar Ahora
                     </button>
                     <button onClick={handleLogout} className="px-6 py-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl">
                        <LogOut size={18} />
                     </button>
                  </div>
                )}
              </div>
           </div>

           {/* Traspaso de Propiedad Section */}
           <div className="bg-brand/5 border border-brand/20 p-10 rounded-[40px] shadow-2xl space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <UserPlus size={120} />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand/20"><UserPlus size={20} /></div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Traspaso de Propiedad</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-4">
                   <p className="text-xs font-bold text-white/80">Pasos para entregar la app a otro usuario:</p>
                   <ul className="space-y-3">
                      {[
                        "Entrega el código fuente (ZIP o GitHub).",
                        "El nuevo dueño debe poner su propio API_KEY.",
                        "Debe crear su propio Client ID en Google Cloud.",
                        "Importar el respaldo de datos que generes aquí."
                      ].map((step, i) => (
                        <li key={i} className="flex gap-3 text-[10px] text-fin-muted font-medium">
                           <span className="text-brand font-black">{i+1}.</span> {step}
                        </li>
                      ))}
                   </ul>
                </div>
                <div className="bg-fin-bg/40 p-6 rounded-3xl border border-white/5 space-y-4">
                   <p className="text-[10px] font-black uppercase text-white tracking-widest">Kit de Traspaso</p>
                   <button 
                     onClick={async () => {
                       const data = await StorageService.exportAllData();
                       const blob = new Blob([data], {type: 'application/json'});
                       const url = URL.createObjectURL(blob);
                       const a = document.createElement('a');
                       a.href = url; a.download = 'finanzaflow_handover_data.json'; a.click();
                     }}
                     className="w-full flex items-center justify-between p-4 bg-brand/10 hover:bg-brand/20 border border-brand/20 rounded-2xl transition-all"
                   >
                      <span className="text-[10px] font-black text-brand uppercase">Exportar Datos Finales</span>
                      <Download size={14} className="text-brand" />
                   </button>
                   <div className="p-4 bg-white/5 rounded-2xl flex items-center justify-between border border-white/5 opacity-50 cursor-not-allowed">
                      <span className="text-[10px] font-black text-white uppercase">Generar ZIP de Código</span>
                      <Code size={14} />
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
           <div className="bg-fin-card p-8 rounded-[32px] border border-fin-border shadow-2xl space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-fin-muted">Respaldo Local</h3>
              <div className="space-y-3">
                 <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-fin-bg border border-fin-border hover:border-brand transition-all rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest">
                    <Upload size={14} className="text-brand" /> Importar JSON
                 </button>
                 <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const text = await file.text();
                      await StorageService.importAllData(text);
                      window.location.reload();
                    }
                 }} />
              </div>
           </div>

           <div className="bg-fin-card p-8 rounded-[32px] border border-fin-border shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                 <Shield className="text-emerald-500" size={16} />
                 <h3 className="text-xs font-black uppercase tracking-widest text-fin-text">Seguridad</h3>
              </div>
              <p className="text-[10px] text-fin-muted font-medium leading-relaxed">
                Tus datos nunca tocan nuestros servidores. Se mueven directamente de tu navegador a tu cuenta personal de Google Drive.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};
