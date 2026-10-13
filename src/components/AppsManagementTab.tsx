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
  FolderPlus
} from 'lucide-react';
import { AppUsageRecord, AppCategory, formatMinutesToHuman } from '../types';

interface AppsManagementTabProps {
  apps: AppUsageRecord[];
  onEditApp: (app: AppUsageRecord) => void;
  onToggleBlockApp: (appId: string) => void;
  onKillProcess: (appId: string) => void;
  onSimulateAppUsage: (appId: string, minutes: number) => void;
  onAddCustomApp: (newApp: Omit<AppUsageRecord, 'id'>) => void;
}

export const AppsManagementTab: React.FC<AppsManagementTabProps> = ({
  apps,
  onEditApp,
  onToggleBlockApp,
  onKillProcess,
  onSimulateAppUsage,
  onAddCustomApp,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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

  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.processName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
    });

    setNewName('');
    setNewProcess('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0E131F]">
          <span className="text-xs text-slate-400">Total Monitorizadas</span>
          <p className="font-mono text-xl font-bold text-white tabular-nums mt-0.5">
            {apps.length}
          </p>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0E131F]">
          <span className="text-xs text-slate-400">A Correr Agora</span>
          <p className="font-mono text-xl font-bold text-emerald-400 tabular-nums mt-0.5">
            {runningCount}
          </p>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0E131F]">
          <span className="text-xs text-slate-400">Com Limite Diário</span>
          <p className="font-mono text-xl font-bold text-cyan-400 tabular-nums mt-0.5">
            {withLimitCount}
          </p>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0E131F]">
          <span className="text-xs text-slate-400">Bloqueadas</span>
          <p className="font-mono text-xl font-bold text-rose-400 tabular-nums mt-0.5">
            {blockedCount}
          </p>
        </div>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome ou executável (ex: roblox, chrome)..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900/80 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500/60"
          />
        </div>

        {/* Categories segmented buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/80 rounded-lg border border-slate-800/80 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Add custom app rule button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Regra de App</span>
        </button>
      </div>

      {/* Main Apps Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0E131F] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Aplicação & Executável</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Estado Atual</th>
                <th className="py-3 px-4">Uso Hoje / Limite</th>
                <th className="py-3 px-4">Quota Utilizada</th>
                <th className="py-3 px-4 text-right">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-300">Modo de Produção: Nenhuma aplicação registada</p>
                      <p className="text-xs text-slate-400">O agente vigia.ps1 no Windows detetará e registará os processos reais assim que forem abertos.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const hasLimit = app.dailyLimitMinutes !== null;
                  const limitMins = app.dailyLimitMinutes ?? 0;
                  const isOverLimit = hasLimit && app.minutesToday >= limitMins;
                  const percent = hasLimit
                    ? Math.min(100, Math.round((app.minutesToday / limitMins) * 100))
                    : 100;

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-900/40 transition-colors group"
                    >
                    {/* App info */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white text-sm">
                          {app.displayName}
                        </span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {app.processName}
                        </span>
                        {app.windowTitle && (
                          <span className="text-slate-400 text-[11px] truncate max-w-xs mt-0.5">
                            {app.windowTitle}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-300 font-medium">
                        {app.category === 'games' && 'Jogos'}
                        {app.category === 'social' && 'Redes Sociais'}
                        {app.category === 'study' && 'Estudo'}
                        {app.category === 'browsing' && 'Navegação'}
                        {app.category === 'creative' && 'Multimédia'}
                        {app.category === 'system' && 'Sistema'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {app.status === 'blocked' ? (
                        <span className="text-rose-400 font-medium flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          Bloqueado
                        </span>
                      ) : app.status === 'running' ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Em execução
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                          Inativo
                        </span>
                      )}
                    </td>

                    {/* Usage vs Limit */}
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      <div className="font-bold text-white text-sm">
                        {formatMinutesToHuman(app.minutesToday)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {hasLimit ? (
                          `limite ${formatMinutesToHuman(limitMins)}`
                        ) : (
                          <span className="text-emerald-400">Ilimitado</span>
                        )}
                      </div>
                    </td>

                    {/* Progress */}
                    <td className="py-3.5 px-4 w-44">
                      {hasLimit ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                            <span>{percent}%</span>
                            {isOverLimit && <span className="text-rose-400 font-bold">Esgotado</span>}
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                isOverLimit ? 'bg-rose-500' : percent > 80 ? 'bg-amber-400' : 'bg-cyan-400'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Sem restrições</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">

                        {/* Kill process if running */}
                        {app.status === 'running' && (
                          <button
                            type="button"
                            onClick={() => onKillProcess(app.id)}
                            title="Encerrar processo no PC alvo imediatamente"
                            className="p-1.5 rounded border border-slate-800 bg-slate-900 text-amber-400 hover:bg-amber-950/40 hover:border-amber-500/50 transition-colors"
                          >
                            <Square className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Edit rule */}
                        <button
                          type="button"
                          onClick={() => onEditApp(app)}
                          className="px-2.5 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                        >
                          Ajustar
                        </button>

                        {/* Block/Unblock toggle */}
                        <button
                          type="button"
                          onClick={() => onToggleBlockApp(app.id)}
                          className={`px-2.5 py-1 rounded border transition-colors ${
                            app.status === 'blocked'
                              ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 hover:bg-rose-900/60'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900'
                          }`}
                        >
                          {app.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Custom App Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-[#0E131F] p-6 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white mb-4">
              Adicionar Nova Regra de Aplicação
            </h3>
            <form onSubmit={handleAddNewApp} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Nome da Aplicação
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fortnite, Spotify, Valorant"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900 text-white placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Nome do Ficheiro Executável Windows
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: FortniteClient-Win64-Shipping.exe"
                  value={newProcess}
                  onChange={(e) => setNewProcess(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900 text-white placeholder:text-slate-600 font-mono focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Categoria
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as AppCategory)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900 text-white focus:outline-hidden focus:border-cyan-500"
                >
                  <option value="games">Jogos</option>
                  <option value="social">Redes Sociais</option>
                  <option value="study">Estudo & Produtividade</option>
                  <option value="browsing">Navegador</option>
                  <option value="creative">Multimédia / Outro</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-400">
                    Limite Diário (Minutos)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewIsUnlimited(!newIsUnlimited)}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    {newIsUnlimited ? 'Definir Limite' : 'Sem Limite'}
                  </button>
                </div>

                {!newIsUnlimited && (
                  <input
                    type="number"
                    min="15"
                    max="360"
                    step="15"
                    value={newLimit}
                    onChange={(e) => setNewLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900 text-white font-mono focus:outline-hidden focus:border-cyan-500"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg"
                >
                  Adicionar à Vigilância
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
