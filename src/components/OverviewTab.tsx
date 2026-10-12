import React, { useState } from 'react';
import {
  Clock,
  Gamepad2,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  Play,
  Pause,
  PlusCircle,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Laptop
} from 'lucide-react';
import {
  AppUsageRecord,
  HourlyActivity,
  AgentIntegrity,
  SystemLogEntry,
  formatMinutesToHuman,
} from '../types';

interface OverviewTabProps {
  apps: AppUsageRecord[];
  hourlyActivity: HourlyActivity[];
  agent: AgentIntegrity;
  logs: SystemLogEntry[];
  totalMinutesToday: number;
  dailyQuotaMinutes: number;
  onEditApp: (app: AppUsageRecord) => void;
  onToggleBlockApp: (appId: string) => void;
  onAddBonusMinutes: (mins: number) => void;
  onSimulateAppUsage: (appId: string, minutes: number) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  apps,
  hourlyActivity,
  agent,
  logs,
  totalMinutesToday,
  dailyQuotaMinutes,
  onEditApp,
  onToggleBlockApp,
  onAddBonusMinutes,
  onSimulateAppUsage,
}) => {
  const [selectedHour, setSelectedHour] = useState<number | null>(19);

  // Category totals
  const gamesMinutes = apps
    .filter((a) => a.category === 'games')
    .reduce((acc, curr) => acc + curr.minutesToday, 0);

  const studyMinutes = apps
    .filter((a) => a.category === 'study')
    .reduce((acc, curr) => acc + curr.minutesToday, 0);

  const socialMinutes = apps
    .filter((a) => a.category === 'social')
    .reduce((acc, curr) => acc + curr.minutesToday, 0);

  // Quota progress calculation
  const quotaPercent = Math.min(100, Math.round((totalMinutesToday / (dailyQuotaMinutes + agent.bonusMinutes)) * 100));
  const remainingMinutes = Math.max(0, dailyQuotaMinutes + agent.bonusMinutes - totalMinutesToday);

  // Top apps sorted by usage
  const sortedApps = [...apps].sort((a, b) => b.minutesToday - a.minutesToday);

  const selectedHourData = hourlyActivity.find((h) => h.hour === selectedHour);

  return (
    <div className="space-y-6">
      {/* Target Computer Header & Simulation Bar */}
      <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 border border-slate-700 text-cyan-400">
            <Laptop className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                Computador de {agent.targetUser}
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                ({agent.targetMachine})
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{agent.osVersion}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{agent.ipAddress}</span>
              <span aria-hidden="true">·</span>
              <span className={`flex items-center gap-1 font-medium ${agent.processesCount > 0 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                <CheckCircle2 className="h-3 w-3" />
                {agent.processesCount > 0 ? `Agente Ativo (${agent.processesCount} processos)` : 'Agente em Espera'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-end">
          <button
            onClick={() => onAddBonusMinutes(30)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/80 transition-colors"
            title="Concede +30 minutos de tempo extra no dia de hoje"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>+30m Bónus</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Screen Time & Daily Quota */}
        <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-4 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-cyan-400" />
              Tempo Total Hoje
            </span>
            <span className="font-mono tabular-nums">{quotaPercent}% da quota</span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {formatMinutesToHuman(totalMinutesToday)}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {formatMinutesToHuman(dailyQuotaMinutes + agent.bonusMinutes)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                quotaPercent >= 100
                  ? 'bg-rose-500'
                  : quotaPercent >= 80
                  ? 'bg-amber-400'
                  : 'bg-cyan-400'
              }`}
              style={{ width: `${quotaPercent}%` }}
            />
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-0.5">
            <span>
              {remainingMinutes > 0 ? (
                <>Restam <strong className="text-slate-200 font-mono">{formatMinutesToHuman(remainingMinutes)}</strong></>
              ) : (
                <span className="text-rose-400 font-medium">Quota esgotada</span>
              )}
            </span>
            {agent.bonusMinutes > 0 && (
              <span className="text-emerald-400 font-mono">+{agent.bonusMinutes}m extra</span>
            )}
          </div>
        </div>

        {/* Card 2: Games Time */}
        <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-4 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Gamepad2 className="h-4 w-4 text-purple-400" />
              Jogos & Lazer
            </span>
            <span className="text-purple-400 text-xs font-medium">Limite: 1h 30m</span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {formatMinutesToHuman(gamesMinutes)}
            </span>
            <span className="text-xs text-slate-400">Roblox, Minecraft</span>
          </div>

          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((gamesMinutes / 90) * 100))}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400">
            {gamesMinutes >= 90 ? (
              <span className="text-rose-400 font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Limite diário de jogos atingido
              </span>
            ) : (
              <span>Restam <strong className="text-slate-200 font-mono">{formatMinutesToHuman(90 - gamesMinutes)}</strong> para jogos</span>
            )}
          </p>
        </div>

        {/* Card 3: Study & Creation */}
        <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-4 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-emerald-400" />
              Estudo & Escrita
            </span>
            <span className="text-emerald-400 text-xs font-medium">Sem Limite</span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {formatMinutesToHuman(studyMinutes)}
            </span>
            <span className="text-xs text-slate-400">VS Code, Word</span>
          </div>

          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-500"
              style={{ width: '100%' }}
            />
          </div>

          <p className="text-[11px] text-emerald-300/80">
            Tempo produtivo incentivado e livre de bloqueio automático.
          </p>
        </div>

        {/* Card 4: Social & Messaging */}
        <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-4 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-amber-400" />
              Redes & Conversa
            </span>
            <span className="text-amber-400 text-xs font-medium">Limite: 1h 00m</span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {formatMinutesToHuman(socialMinutes)}
            </span>
            <span className="text-xs text-slate-400">Discord</span>
          </div>

          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((socialMinutes / 60) * 100))}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400">
            {socialMinutes >= 60 ? (
              <span className="text-rose-400 font-medium">Limite de conversação atingido</span>
            ) : (
              <span>Restam <strong className="text-slate-200 font-mono">{formatMinutesToHuman(60 - socialMinutes)}</strong></span>
            )}
          </p>
        </div>
      </div>

      {/* Hourly Timeline Chart (08:00 - 22:00) */}
      <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-semibold text-white">
              Linha Temporal de Atividade de Hoje
            </h3>
            <p className="text-xs text-slate-400">
              Distribuição minuto-a-minuto por categoria entre as 08:00 e as 22:00. Clique numa hora para inspecionar.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-purple-500" /> Jogos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Redes
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Estudo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-cyan-400" /> Navegador
            </span>
          </div>
        </div>

        {/* Bar chart grid */}
        <div className="grid grid-cols-15 gap-1.5 sm:gap-2 pt-4 items-end h-48 border-b border-slate-800 pb-2">
          {hourlyActivity.map((slot) => {
            const totalSlotMinutes = slot.games + slot.social + slot.study + slot.browsing + slot.other;
            const maxMinutesInHour = 60;
            const heightPercent = Math.min(100, Math.round((totalSlotMinutes / maxMinutesInHour) * 100));
            const isSelected = selectedHour === slot.hour;

            return (
              <button
                key={slot.hour}
                type="button"
                onClick={() => setSelectedHour(slot.hour)}
                className={`group flex flex-col items-center h-full justify-end relative rounded transition-all p-0.5 ${
                  isSelected ? 'bg-slate-800/80 ring-1 ring-cyan-400' : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Stacked bar container */}
                <div
                  className="w-full rounded-sm overflow-hidden flex flex-col-reverse transition-all"
                  style={{ height: `${Math.max(4, heightPercent)}%` }}
                >
                  {/* Stack segments */}
                  {slot.games > 0 && (
                    <div
                      className="bg-purple-500 w-full"
                      style={{ height: `${(slot.games / (totalSlotMinutes || 1)) * 100}%` }}
                    />
                  )}
                  {slot.social > 0 && (
                    <div
                      className="bg-amber-400 w-full"
                      style={{ height: `${(slot.social / (totalSlotMinutes || 1)) * 100}%` }}
                    />
                  )}
                  {slot.study > 0 && (
                    <div
                      className="bg-emerald-400 w-full"
                      style={{ height: `${(slot.study / (totalSlotMinutes || 1)) * 100}%` }}
                    />
                  )}
                  {slot.browsing > 0 && (
                    <div
                      className="bg-cyan-400 w-full"
                      style={{ height: `${(slot.browsing / (totalSlotMinutes || 1)) * 100}%` }}
                    />
                  )}
                  {slot.other > 0 && (
                    <div
                      className="bg-slate-600 w-full"
                      style={{ height: `${(slot.other / (totalSlotMinutes || 1)) * 100}%` }}
                    />
                  )}
                </div>

                {/* Hour label */}
                <span className="mt-2 text-[10px] font-mono text-slate-400 group-hover:text-white tabular-nums">
                  {slot.hour.toString().padStart(2, '0')}h
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Hour Details Banner */}
        {selectedHourData && (
          <div className="flex flex-wrap items-center justify-between text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-300">
              Detalhes das <strong className="text-cyan-400 font-mono">{selectedHourData.hour}:00 - {selectedHourData.hour}:59</strong>:
            </span>
            <div className="flex flex-wrap items-center gap-4 text-slate-400">
              <span>Jogos: <strong className="text-purple-400 font-mono tabular-nums">{selectedHourData.games}m</strong></span>
              <span aria-hidden="true">·</span>
              <span>Redes: <strong className="text-amber-400 font-mono tabular-nums">{selectedHourData.social}m</strong></span>
              <span aria-hidden="true">·</span>
              <span>Estudo: <strong className="text-emerald-400 font-mono tabular-nums">{selectedHourData.study}m</strong></span>
              <span aria-hidden="true">·</span>
              <span>Navegador: <strong className="text-cyan-400 font-mono tabular-nums">{selectedHourData.browsing}m</strong></span>
              <span aria-hidden="true">·</span>
              <span>Total no período: <strong className="text-white font-mono tabular-nums">{selectedHourData.games + selectedHourData.social + selectedHourData.study + selectedHourData.browsing + selectedHourData.other}m</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Section: Top Applications & Live Agent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Top Applications Today */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0E131F] p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-white">
                Aplicações em Foco Hoje
              </h3>
              <p className="text-xs text-slate-400">
                Programas com maior tempo de execução ou com restrições ativas.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {sortedApps.length === 0 ? (
              <div className="py-10 text-center space-y-2 border border-dashed border-slate-800 rounded-lg p-6">
                <Laptop className="h-8 w-8 text-slate-600 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-300">
                  Modo de Produção: A aguardar atividade do PC
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Ainda não há aplicações registadas hoje no computador de {agent.targetUser} ({agent.ipAddress}). Assim que uma aplicação for aberta no Windows, o agente <code className="text-slate-400">vigia.ps1</code> registará o processo e os minutos em direto.
                </p>
              </div>
            ) : (
              sortedApps.slice(0, 5).map((app) => {
                const hasLimit = app.dailyLimitMinutes !== null;
                const isOverLimit = hasLimit && app.minutesToday >= (app.dailyLimitMinutes ?? 0);
                const percent = hasLimit
                  ? Math.min(100, Math.round((app.minutesToday / (app.dailyLimitMinutes ?? 1)) * 100))
                  : 100;

                return (
                  <div
                    key={app.id}
                    className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3.5 hover:bg-slate-900/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">
                        {app.displayName}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {app.processName}
                      </span>
                      {app.status === 'running' && (
                        <span className="text-[11px] text-emerald-400 font-medium">
                          · A correr agora
                        </span>
                      )}
                      {app.status === 'blocked' && (
                        <span className="text-[11px] text-rose-400 font-medium">
                          · Bloqueado
                        </span>
                      )}
                    </div>
                    {app.windowTitle && (
                      <p className="text-xs text-slate-400 truncate max-w-md">
                        {app.windowTitle}
                      </p>
                    )}
                  </div>

                  {/* Time stats & actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-white tabular-nums">
                        {formatMinutesToHuman(app.minutesToday)}
                        {hasLimit && (
                          <span className="text-xs text-slate-400 font-normal ml-1">
                            / {formatMinutesToHuman(app.dailyLimitMinutes ?? 0)}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isOverLimit ? (
                          <span className="text-rose-400 font-medium">Corte iminente</span>
                        ) : hasLimit ? (
                          <span>{percent}% do limite</span>
                        ) : (
                          <span className="text-emerald-400">Ilimitado</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditApp(app)}
                        className="px-2.5 py-1 text-xs rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      >
                        Regras
                      </button>
                      <button
                        onClick={() => onToggleBlockApp(app.id)}
                        className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                          app.status === 'blocked'
                            ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {app.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (1 span): Live Agent Telemetry & Logs */}
        <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-white">
                Telemetria do Agente
              </h3>
              <p className="text-xs text-slate-400">
                Respostas dos scripts vigia.ps1 e agente.ps1.
              </p>
            </div>
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
          </div>

          <div className="space-y-3 font-mono text-xs">
            {logs.map((log) => {
              const typeColor =
                log.type === 'alert'
                  ? 'text-rose-400 border-rose-900/40 bg-rose-950/20'
                  : log.type === 'warning'
                  ? 'text-amber-300 border-amber-900/40 bg-amber-950/20'
                  : 'text-slate-300 border-slate-800 bg-slate-900/30';

              return (
                <div
                  key={log.id}
                  className={`p-2.5 rounded border ${typeColor} space-y-1`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{log.source}</span>
                    <span className="tabular-nums">{log.timestamp}</span>
                  </div>
                  <p className="leading-relaxed text-[11px] font-sans text-slate-300">
                    {log.message}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="text-cyan-400 font-bold">INFO vigia.ps1 ({agent.ipAddress})</div>
            <div>tarefa={agent.taskStatus}</div>
            <div>processos={agent.processesCount} em monitorização contínua</div>
            <div className={agent.hashVerified ? 'text-emerald-400' : 'text-amber-400'}>
              hash={agent.hashVerified ? 'ok (SHA256 validado)' : 'a aguardar verificação'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
