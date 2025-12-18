
import React, { useRef } from 'react';
import { StorageService } from '../services/storageService';
import { Download, Upload, Database, AlertCircle, RefreshCcw, Github } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const data = StorageService.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finanzaflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        if (confirm('Esto reemplazará todos tus datos actuales. ¿Deseas continuar?')) {
          StorageService.importAllData(json);
          alert('Datos importados con éxito. La página se recargará.');
          window.location.reload();
        }
      } catch (err) {
        alert('Error al importar archivo. Formato inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-fade-in pb-20">
      <div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Configuración</h1>
        <p className="text-fin-muted mt-2 font-medium">Gestiona tus datos y preferencias del sistema.</p>
      </div>

      <div className="bg-fin-card rounded-[32px] border border-fin-border overflow-hidden shadow-2xl">
        <div className="p-10 space-y-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-brand/10 text-brand rounded-2xl"><Database size={24} /></div>
            <div>
              <h3 className="text-lg font-bold text-white">Respaldo de Datos</h3>
              <p className="text-sm text-fin-muted">Tus datos se guardan solo en este navegador. Te recomendamos exportarlos periódicamente.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={exportData} className="flex items-center justify-center gap-3 bg-fin-bg border border-fin-border hover:border-brand/40 text-white p-5 rounded-2xl transition-all font-bold group">
              <Download size={20} className="text-brand group-hover:translate-y-1 transition-transform" />
              <span>Exportar JSON</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-3 bg-fin-bg border border-fin-border hover:border-emerald-500/40 text-white p-5 rounded-2xl transition-all font-bold group">
              <Upload size={20} className="text-emerald-500 group-hover:-translate-y-1 transition-transform" />
              <span>Importar JSON</span>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={importData} />
          </div>

          <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl flex items-start gap-4">
            <AlertCircle className="text-red-500 shrink-0 mt-1" size={20} />
            <div>
              <p className="text-sm font-bold text-white">Borrar todo</p>
              <p className="text-xs text-fin-muted mb-4">Se eliminarán cuentas, movimientos y configuraciones permanentemente.</p>
              <button onClick={() => { if(confirm('¿ESTÁS ABSOLUTAMENTE SEGURO?')) { localStorage.clear(); window.location.reload(); } }} className="text-[10px] font-black uppercase text-red-500 tracking-widest hover:underline">Reiniciar Base de Datos</button>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center space-y-6">
        <div className="h-px bg-fin-border w-32 mx-auto"></div>
        <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-fin-muted">Versión 2.5.0 Stable</p>
            <div className="flex items-center gap-4 text-fin-muted">
                <a href="#" className="hover:text-white transition-colors"><Github size={18} /></a>
                <span className="text-xs font-bold italic">Hecho con ❤️ para tu libertad financiera</span>
            </div>
        </div>
      </div>
    </div>
  );
};
