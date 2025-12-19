
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, PiggyBank, Scale, Menu, X, Wallet, UploadCloud, ChevronRight, Settings, User, Sparkles, MessageSquare, Cloud, Database, RefreshCw } from 'lucide-react';
import { isCloudConfigured } from '../services/supabaseClient';
import { GoogleDriveService } from '../services/googleDriveService';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [googleUser, setGoogleUser] = useState(localStorage.getItem('ff_google_token'));

  const navItems = [
    { to: "/", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { to: "/transactions", icon: <Receipt size={18} />, label: "Movimientos" },
    { to: "/budget", icon: <Scale size={18} />, label: "Presupuesto" },
    { to: "/jars", icon: <PiggyBank size={18} />, label: "Inversiones" },
    { to: "/import", icon: <UploadCloud size={18} />, label: "Escáner AI" },
    { to: "/ai-coach", icon: <MessageSquare size={18} />, label: "Asistente AI" },
    { to: "/accounts", icon: <Wallet size={18} />, label: "Administración" },
    { to: "/settings", icon: <Settings size={18} />, label: "Configuración" },
  ];

  return (
    <div className="flex h-screen bg-fin-bg text-fin-text overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-fin-bg border-r border-fin-border">
        <div className="h-24 px-10 flex items-center gap-4">
          <div className="w-10 h-10 bg-brand rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand/20">
            <Sparkles size={20} strokeWidth={2.5} className="animate-pulse" />
          </div>
          <span className="text-xl font-black tracking-tight text-white uppercase">FinanzaFlow</span>
        </div>
        
        <nav className="flex-1 px-6 space-y-2 mt-4 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-5 py-4 rounded-2xl transition-all group ${
                  isActive
                    ? "bg-brand/10 text-brand border border-brand/20 shadow-lg shadow-brand/5"
                    : "text-fin-muted hover:text-white hover:bg-fin-card/40"
                }`
              }
            >
              <div className="flex items-center gap-4">
                <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
              </div>
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          ))}
        </nav>
        
        <div className="p-8">
          <div className="bg-fin-card/40 rounded-3xl p-6 border border-fin-border space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                <User size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-tighter leading-none">Usuario Pro</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                   {googleUser ? (
                     <span className="text-[7px] px-2 py-0.5 bg-brand/10 text-brand border border-brand/20 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                        <RefreshCw size={8} className="animate-spin-slow" /> Google Drive Sync
                     </span>
                   ) : isCloudConfigured ? (
                     <span className="text-[7px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                        <Cloud size={8} /> Supabase Cloud
                     </span>
                   ) : (
                     <span className="text-[7px] px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                        <Database size={8} /> Local Storage
                     </span>
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-16 flex items-center justify-between px-6 bg-fin-bg border-b border-fin-border z-30">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center text-white"><Sparkles size={16} /></div>
             <span className="font-black text-xs uppercase tracking-widest">FinanzaFlow</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2.5 bg-fin-card border border-fin-border rounded-xl text-white">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12 scrollbar-hide relative">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
          {/* Background decoration */}
          <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        </main>
      </div>
    </div>
  );
};
