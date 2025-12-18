
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, PiggyBank, Scale, Menu, X, Wallet, UploadCloud, ChevronRight, Settings, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { to: "/", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { to: "/transactions", icon: <Receipt size={18} />, label: "Movimientos" },
    { to: "/budget", icon: <Scale size={18} />, label: "Presupuesto" },
    { to: "/jars", icon: <PiggyBank size={18} />, label: "Inversiones" },
    { to: "/import", icon: <UploadCloud size={18} />, label: "Importar OCR" },
    { to: "/accounts", icon: <Wallet size={18} />, label: "Administración" },
    { to: "/settings", icon: <Settings size={18} />, label: "Configuración" },
  ];

  return (
    <div className="flex h-screen bg-fin-bg text-fin-text overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-fin-bg border-r border-fin-border">
        <div className="h-24 px-10 flex items-center gap-4">
          <div className="w-10 h-10 bg-brand rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand/20">
            <Wallet size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-black tracking-tight text-white uppercase">FinanzaFlow</span>
        </div>
        
        <nav className="flex-1 px-6 space-y-2 mt-4">
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
              {/* Fix: Wrapped children in a function to access the 'isActive' prop provided by NavLink */}
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-4">
                    <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                  </div>
                  <ChevronRight size={12} className={`transition-all ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                </>
              )}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-8 space-y-6">
          <div className="bg-fin-card/40 rounded-3xl p-6 border border-fin-border space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-fin-bg border border-fin-border flex items-center justify-center text-fin-muted">
                <User size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-tighter leading-none">Usuario Pro</p>
                <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mt-1">Sincronizado</p>
              </div>
            </div>
            <div className="pt-4 border-t border-fin-border/50">
               <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-fin-muted mb-1">
                 <span>DB Storage</span>
                 <span className="text-white">84%</span>
               </div>
               <div className="h-1.5 w-full bg-fin-bg rounded-full overflow-hidden">
                 <div className="h-full bg-brand w-[84%] rounded-full shadow-[0_0_10px_#3B82F6]"></div>
               </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-16 flex items-center justify-between px-6 bg-fin-bg border-b border-fin-border z-30">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center text-white"><Wallet size={16} /></div>
             <span className="font-black text-xs uppercase tracking-widest">FinanzaFlow</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2.5 bg-fin-card border border-fin-border rounded-xl text-white">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 bg-fin-bg/95 backdrop-blur-xl z-40 p-8 animate-fade-in">
            <nav className="space-y-3">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-5 px-8 py-5 rounded-2xl ${isActive ? "bg-brand text-white font-black" : "bg-fin-card/50 text-fin-muted border border-fin-border"}`}>
                  {item.icon} <span className="text-xs uppercase tracking-widest">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12 scrollbar-hide">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
