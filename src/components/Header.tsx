import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  emergencyLock: boolean;
  onToggleEmergencyLock: () => void;
  targetMachine: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  emergencyLock,
  onToggleEmergencyLock,
}) => {
  const navItems = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'apps', label: 'Aplicações' },
    { id: 'curfew', label: 'Horários' },
    { id: 'web', label: 'Filtro Web' },
    { id: 'agent', label: 'Consola Script' },
    { id: 'admin', label: 'Administração' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#090D16]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
          <button
            onClick={() => onTabChange('overview')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 group-hover:border-cyan-400/60 transition-colors">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <span className="text-base font-bold tracking-tight text-white block">
                Sentinel<span className="text-cyan-400">PC</span>
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (4-5 items, clean single-line text with subtle hover underlines/actives) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`whitespace-nowrap transition-colors relative py-1 ${
                  isActive
                    ? 'text-cyan-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action (Emergency Family Pause toggle) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleEmergencyLock}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all border whitespace-nowrap ${
              emergencyLock
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/60 hover:bg-rose-900/90 shadow-sm shadow-rose-950'
                : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-slate-500 hover:text-white'
            }`}
            title={emergencyLock ? 'Desativar pausa imediata' : 'Bloquear temporariamente todo o acesso do PC'}
          >
            <ShieldAlert className={`h-4 w-4 ${emergencyLock ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
            <span>{emergencyLock ? 'Pausa Familiar Ativa' : 'Pausa Familiar'}</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="flex md:hidden overflow-x-auto border-t border-slate-800/80 px-4 py-2 gap-3 scrollbar-none">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`text-xs px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 font-medium border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
