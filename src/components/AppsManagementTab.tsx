import React, { useState } from 'react';
import {
  Search,
  Plus,
  Play,
  Square,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Clock,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
  Activity,
  Cpu,
  Layers,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { AppUsageRecord, AppCategory, ProcessItem, formatMinutesToHuman } from '../types';

interface AppsManagementTabProps {
  apps: AppUsageRecord[];
  runningProcesses?: ProcessItem[];
  onEditApp: (app: AppUsageRecord) => void;
  onToggleBlockApp: (appId: string) => void;
  onKillProcess: (appId: string) => void;
  onKillPid?: (pid: number, name?: string) => Promise<void>;
  onKillAll?: (name: string) => Promise<void>;
  onAddCustomApp: (newApp: Omit<AppUsageRecord, 'id'>) => void;
  onRefreshProcs?: () => void;
}

export const AppsManagementTab: React.FC<AppsManagementTabProps> = ({
  apps,
  runningProcesses = [],
  onEditApp,
  onToggleBlockApp,
  onKillProcess,
  onKillPid,
  onKillAll,
  onAddCustomApp,
  onRefreshProcs,
}) => {
  const [viewMode, setViewMode] = useState<'rules' | 'live_procs'>('live_procs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSmallProcs, setShowSmallProcs] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New app form state
  const [newName, setNewName] = useState('');
  const [newProcess, setNewProcess] = useState('');
  const [newCategory, setNewCategory] = useState<AppCategory>('games');
  const [newLimit, setNewLimit] = useState<number>(60);
  const [newIsUnlimited, setNewIsUnlimited] = useState<boolean>(false);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Todas as Aplicações' },
    { id: 'games', label: 'Jogos' },
    { id: 'social', label: 'Redes Sociais' },
    { id: 'study', label: 'Estudo & Escola' },
    { id: 'browsing', label: 'Navegadores' },
    { id: 'creative', label: 'Multimédia' },
  ];

  // Filtered Apps Rules
  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.processName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filtered Live Windows Processes
  const filteredProcs = runningProcesses.filter((proc) => {
    const matchesQuery = proc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (proc.title && proc.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSize = showSmallProcs || proc.mem_mb >= 40;
    return matchesQuery && matchesSize;
  }).sort((a, b) => b.mem_mb - a.mem_mb);

  const runningCount = apps.filter((a) => a.status === 'running').length;
  const blockedCount = apps.filter((a) => a.status === 'blocked').length;
  const withLimitCount = apps.filter((a) => a.dailyLimitMinutes !== null).length;

  const handleAddNewApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newProcess) return;

    onAddCustomApp({
      displayName: newName,
      processName: newProcess.endsWith('.exe') ? newProcess : `${newProcess}.exe`,
      iconType: 'box',
      category: newCategory,
      minutesToday: 0,
      dailyLimitMinutes: newIsUnlimited ? null : newLimit,
      status: 'idle',
      lastActiveTime: 'Nunca',
      isRestricted: !newIsUnlimited,
      allowedDays: [0, 1, 2, 3, 4, 5, 6],
    });

    setNewName('');
    setNewProcess('');
    setIsAddModalOpen(false);
  };

  const handleQuickLimit = (procName: string) => {
    const cleanName = procName.replace(/\.exe$/i, '');
    let existing = apps.find(a => a.processName.toLowerCase() === procName.toLowerCase());
    if (!existing) {
      existing = {
        id: `app-${cleanName.toLowerCase()}`,
        displayName: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        processName: procName.endsWith('.exe') ? procName : `${procName}.exe`,
        iconType: 'box',
        category: 'games',
        minutesToday: 0,
        dailyLimitMinutes: 60,
        status: 'running',
        lastActiveTime: 'Agora mesmo',
        isRestricted: true,
        allowedDays: [0, 1, 2, 3, 4, 5, 6],
      };
      onAddCustomApp(existing);
    }
    onEditApp(existing);
  };

  const handleQuickBlock = (procName: string) => {
    const cleanName = procName.replace(/\.exe$/i, '');
    const existing = apps.find(a => a.processName.toLowerCase() === procName.toLowerCase());
    if (existing) {
      onToggleBlockApp(existing.id);
    } else {
      onAddCustomApp({
        displayName: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        processName: procName.endsWith('.exe') ? procName : `${procName}.exe`,
        iconType: 'box',
        category: 'games',
        minutesToday: 0,
        dailyLimitMinutes: 0,
        status: 'blocked',
        lastActiveTime: 'Agora mesmo',
        isRestricted: true,
        allowedDays: [],
      });
    }
    if (onKillAll) {
      onKillAll(procName);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0E131F]">
          <span className="text-xs text-slate-400">Processos no Windows</span>
          <p className="font-mono text-xl font-bold text-cyan-400 tabular-nums mt-0.5">
            {runningProcesses.length}
          </p>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0E131F]">
          <span className="text-xs text-slate-400">Aplicações Monitorizadas</span>
          <p className="font-mono text-xl font-bold text-white tabular-nums mt-0.5">
            {apps.length}
          </p>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0E131F]">
          <span className="text-xs text-slate-400">Com Limite Diário</span>
          <p className="font-mono text-xl font-bold text-emerald-400 tabular-nums mt-0.5">
            {withLimitCount}
          </p>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0E131F]">
          <span className="text-xs text-slate-400">Bloqueadas Permanentemente</span>
          <p className="font-mono text-xl font-bold text-rose-400 tabular-nums mt-0.5">
            {blockedCount}
          </p>
        </div>
      </div>

      {/* Main Tab Switcher & Filter Controls */}
      <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('live_procs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'live_procs'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Processos Ativos em Direto ({runningProcesses.length})</span>
            </button>

            <button
              onClick={() => setViewMode('rules')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'rules'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Regras de Limite & Quotas ({apps.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshProcs && (
              <button
                type="button"
                onClick={onRefreshProcs}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
              >
                Atualizar
              </button>
            )}

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer shadow-sm shadow-cyan-950"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Adicionar Regra</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Options */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Procurar programa (ex: roblox, chrome, discord)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          {viewMode === 'live_procs' ? (
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showSmallProcs}
                onChange={(e) => setShowSmallProcs(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500"
              />
              <span>Mostrar processos de fundo (&lt; 40 MB)</span>
            </label>
          ) : (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-200 focus:outline-hidden focus:border-cyan-500 cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* VIEW 1: Live Windows Processes (Matching Python tasklist / processes model) */}
      {viewMode === 'live_procs' && (
        <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400">
            <span>
              A mostrar <strong>{filteredProcs.length}</strong> programas ativos no Windows do filho
            </span>
            <span>Ordenados por consumo de memória</span>
          </div>

          {filteredProcs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum processo correspondente encontrado no momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filteredProcs.map((proc, index) => {
                const cleanName = proc.name.replace(/\.exe$/i, '');
                const isBlockedApp = apps.some(a => a.processName.toLowerCase() === proc.name.toLowerCase() && a.status === 'blocked');
                const hasRule = apps.find(a => a.processName.toLowerCase() === proc.name.toLowerCase());

                return (
                  <div
                    key={`${proc.pid}-${index}`}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {cleanName}
                        </span>
                        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                          {proc.mem_mb} MB
                        </span>
                        {proc.pid > 0 && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            PID: {proc.pid}
                          </span>
                        )}
                        {isBlockedApp && (
                          <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/40">
                            Bloqueado
                          </span>
                        )}
                      </div>

                      {proc.title && (
                        <p className="text-xs text-slate-400 font-mono truncate max-w-lg">
                          Janela: {proc.title}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQuickLimit(proc.name)}
                        className="px-2.5 py-1 text-xs rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                        title="Definir limite diário de minutos"
                      >
                        {hasRule && hasRule.dailyLimitMinutes ? `${hasRule.dailyLimitMinutes}m / Limitar` : 'Limitar'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickBlock(proc.name)}
                        className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer ${
                          isBlockedApp
                            ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                            : 'bg-slate-800 border-slate-700 text-rose-400 hover:border-rose-500/50'
                        }`}
                        title="Bloquear execução sempre que for aberto"
                      >
                        {isBlockedApp ? 'Bloqueado' : 'Bloquear'}
                      </button>

                      {!proc.isProtected && onKillPid && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Fechar o processo ${cleanName} (PID ${proc.pid}) no PC do filho?`)) {
                              onKillPid(proc.pid, proc.name);
                            }
                          }}
                          className="px-2.5 py-1 text-xs rounded border border-rose-900/50 bg-rose-950/40 hover:bg-rose-900/80 text-rose-300 transition-colors cursor-pointer"
                          title="Terminar processo imediatamente"
                        >
                          Fechar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: App Rules & Quotas List */}
      {viewMode === 'rules' && (
        <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400">
            <span>Regras configuradas ({filteredApps.length})</span>
            <span>Avisos emitidos antes do encerramento automático</span>
          </div>

          {filteredApps.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhuma aplicação com regras encontrada. Use o botão "+ Adicionar Regra".
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {app.displayName}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ({app.processName})
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {app.category}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>Tempo hoje: <strong className="text-slate-200 font-mono">{formatMinutesToHuman(app.minutesToday)}</strong></span>
                      {app.dailyLimitMinutes !== null && (
                        <>
                          <span>·</span>
                          <span>Limite: <strong className="text-cyan-400 font-mono">{formatMinutesToHuman(app.dailyLimitMinutes)}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditApp(app)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                    >
                      Editar Limite
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleBlockApp(app.id)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                        app.status === 'blocked'
                          ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {app.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Rule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-[#0E131F] p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Adicionar Regra de Aplicação</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewApp} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Nome de Exibição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fortnite ou Roblox"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Nome do Executável (.exe)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: FortniteClient-Win64-Shipping.exe ou RobloxPlayerBeta.exe"
                  value={newProcess}
                  onChange={(e) => setNewProcess(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-cyan-300 font-mono focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as AppCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value="games">Jogos</option>
                    <option value="social">Redes Sociais</option>
                    <option value="study">Estudo</option>
                    <option value="browsing">Navegador</option>
                    <option value="creative">Multimédia</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Limite Diário (minutos)</label>
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    disabled={newIsUnlimited}
                    value={newLimit}
                    onChange={(e) => setNewLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white disabled:opacity-40 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="unlim"
                  checked={newIsUnlimited}
                  onChange={(e) => setNewIsUnlimited(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                />
                <label htmlFor="unlim" className="text-slate-300 cursor-pointer">
                  Sem limite de tempo (Apenas monitorizar)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-400 text-black font-semibold hover:bg-cyan-300"
                >
                  Guardar Regra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
