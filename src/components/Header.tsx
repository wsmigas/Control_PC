import React from 'react';
import { ShieldAlert, ShieldCheck, Laptop, ChevronDown } from 'lucide-react';
import { PCConfig } from '../types';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  emergencyLock: boolean;
  onToggleEmergencyLock: () => void;
  targetMachine: string;
  pcsList?: PCConfig[];
  activePcId?: string;
  onSelectPc?: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  emergencyLock,
  onToggleEmergencyLock,
  pcsList = [],
  activePcId = 'pc1',
  onSelectPc,
}) => {
  const navItems = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'apps', label: 'Aplicações' },
    { id: 'actions', label: 'Ações' },
    { id: 'curfew', label: 'Horários' },
    { id: 'web', label: 'Filtro Web' },
    { id: 'agent', label: 'Agente & Código' },
    { id: 'admin', label: 'Computadores & Admin' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#090D16]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark & PC Selector */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onTabChange('overview')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
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

          {/* PC Quick Selector Dropdown */}
          {pcsList.length > 0 && onSelectPc && (
            <div className="relative hidden sm:flex items-center ml-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-300">
                <Laptop className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <select
                  value={activePcId}
                  onChange={(e) => onSelectPc(e.target.value)}
                  className="bg-transparent text-white font-medium focus:outline-hidden cursor-pointer text-xs pr-4"
                  title="Selecionar computador ativo"
                >
                  {pcsList.map((pc) => (
                    <option key={pc.id} value={pc.id} className="bg-slate-900 text-white">
                      {pc.nome} ({pc.host}) {pc.isOnline ? '🟢' : '⚪'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-3 w-3 text-slate-400 pointer-events-none -ml-4" />
              </div>
            </div>
          )}
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`whitespace-nowrap transition-colors relative py-1 cursor-pointer ${
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

        {/* Zone 3: Emergency Pause Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onToggleEmergencyLock}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all border whitespace-nowrap cursor-pointer ${
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

      {/* Mobile / Tablet navigation bar */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-800/80 px-4 py-2 gap-2 scrollbar-none">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`text-xs px-3 py-1.5 rounded-md whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
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
