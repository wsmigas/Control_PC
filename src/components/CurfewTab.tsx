import React from 'react';
import {
  Clock,
  Moon,
  Sun,
  Shield,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CurfewDaySchedule, formatMinutesToHuman } from '../types';

interface CurfewTabProps {
  schedule: CurfewDaySchedule[];
  todayDayId?: string;
  onUpdateDay: (dayId: string, updates: Partial<CurfewDaySchedule>) => void;
  onApplyPreset: (preset: 'school' | 'vacation' | 'strict') => void;
}

export const CurfewTab: React.FC<CurfewTabProps> = ({
  schedule,
  todayDayId,
  onUpdateDay,
  onApplyPreset,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Presets */}
      <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Moon className="h-5 w-5 text-cyan-400" />
            Horários & Curfew Semanal (Toque de Recolher)
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure as horas em que o computador pode ser utilizado e o momento em que a sessão é encerrada automaticamente pelo agente <code className="text-slate-300">vigia.ps1</code>.
          </p>
        </div>

        {/* Preset quick buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onApplyPreset('school')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900/80 transition-colors cursor-pointer"
          >
            Modelo Escolar Padrão
          </button>
          <button
            type="button"
            onClick={() => onApplyPreset('vacation')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer"
          >
            Modo Férias (+1h30m)
          </button>
          <button
            type="button"
            onClick={() => onApplyPreset('strict')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer"
          >
            Modo Estudo Estrito
          </button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {schedule.map((day) => {
          const isToday = day.dayId === todayDayId;

          return (
            <div
              key={day.dayId}
              className={`rounded-xl border p-4 space-y-4 transition-all relative ${
                isToday
                  ? 'border-cyan-500/70 bg-gradient-to-b from-cyan-950/25 via-[#0E131F] to-[#0E131F] shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                  : day.enabled
                  ? 'border-slate-800 bg-[#0E131F]'
                  : 'border-slate-800/40 bg-slate-950/40 opacity-60'
              }`}
            >
              {/* Day title & toggle */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className={`font-bold text-sm ${isToday ? 'text-cyan-300' : 'text-white'}`}>
                      {day.dayName}
                    </h4>
                    {isToday && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        Hoje
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {day.isSchoolDay ? 'Dia de Aulas' : 'Fim de Semana'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(e) =>
                    onUpdateDay(day.dayId, { enabled: e.target.checked })
                  }
                  className="h-4 w-4 rounded accent-cyan-400 cursor-pointer"
                  title="Ativar/Desativar dia"
                />
              </div>

              {/* Time inputs */}
              {day.enabled ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Hora de Início
                    </label>
                    <input
                      type="time"
                      value={day.startHour}
                      onChange={(e) =>
                        onUpdateDay(day.dayId, { startHour: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-white font-mono tabular-nums text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Toque de Recolher (Curfew)
                    </label>
                    <input
                      type="time"
                      value={day.endHour}
                      onChange={(e) =>
                        onUpdateDay(day.dayId, { endHour: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-cyan-300 font-mono tabular-nums text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-slate-400">
                        Quota Máxima Total
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onUpdateDay(day.dayId, { maxMinutes: Math.max(30, day.maxMinutes - 30) })}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                          title="Diminuir 30m"
                        >
                          -30m
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateDay(day.dayId, { maxMinutes: Math.min(600, day.maxMinutes + 30) })}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                          title="Aumentar 30m"
                        >
                          +30m
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-sm font-bold tabular-nums ${isToday ? 'text-cyan-300' : 'text-white'}`}>
                        {formatMinutesToHuman(day.maxMinutes)}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ({day.maxMinutes}m)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="600"
                      step="15"
                      value={day.maxMinutes}
                      onChange={(e) =>
                        onUpdateDay(day.dayId, {
                          maxMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full mt-1.5 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />

                    {/* Quick minute buttons */}
                    <div className="grid grid-cols-4 gap-1 pt-1.5">
                      {[90, 120, 180, 240].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => onUpdateDay(day.dayId, { maxMinutes: mins })}
                          className={`py-1 text-[10px] font-semibold rounded border transition-colors cursor-pointer ${
                            day.maxMinutes === mins
                              ? 'bg-cyan-500/30 text-cyan-200 border-cyan-500/60'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          {formatMinutesToHuman(mins)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  Uso do computador desativado neste dia.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Enforcement & Windows Agent Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-4 space-y-2">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Mecanismo de Execução no Windows
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            O script <code className="text-slate-300 font-mono">vigia.ps1</code> corre continuamente em segundo plano através do Agendador de Tarefas do Windows (Task Scheduler). A cada minuto, compara o relógio local e os contadores de tempo acumulados com o ficheiro <code className="text-slate-300 font-mono">regras.json</code>.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-4 space-y-2">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-cyan-400" />
            Notificações Suaves Antes do Corte
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            15 minutos antes do recolher ou fim de quota, o filho recebe um alerta no canto inferior do ecrã para salvar os trabalhos escolares ou jogos. Um segundo aviso surge a 5 minutos do encerramento definitivo da sessão.
          </p>
        </div>
      </div>
    </div>
  );
};
