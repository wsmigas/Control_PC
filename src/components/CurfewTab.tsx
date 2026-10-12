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
  onUpdateDay: (dayId: string, updates: Partial<CurfewDaySchedule>) => void;
  onApplyPreset: (preset: 'school' | 'vacation' | 'strict') => void;
}

export const CurfewTab: React.FC<CurfewTabProps> = ({
  schedule,
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
            Configure as horas em que o computador pode ser utilizado e o momento em que a sessão é encerrada automaticamente pelo script <code className="text-slate-300">vigia.ps1</code>.
          </p>
        </div>

        {/* Preset quick buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onApplyPreset('school')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900/80 transition-colors"
          >
            Modelo Escolar Padrão
          </button>
          <button
            type="button"
            onClick={() => onApplyPreset('vacation')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-500 transition-colors"
          >
            Modo Férias (+1h30m)
          </button>
          <button
            type="button"
            onClick={() => onApplyPreset('strict')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-500 transition-colors"
          >
            Modo Estudo Estrito
          </button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {schedule.map((day) => {
          return (
            <div
              key={day.dayId}
              className={`rounded-xl border p-4 space-y-4 transition-all ${
                day.enabled
                  ? 'border-slate-800 bg-[#0E131F]'
                  : 'border-slate-800/40 bg-slate-950/40 opacity-60'
              }`}
            >
              {/* Day title & toggle */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h4 className="font-bold text-white text-sm">
                    {day.dayName}
                  </h4>
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
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Quota Máxima Total
                    </label>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-white text-sm font-bold tabular-nums">
                        {formatMinutesToHuman(day.maxMinutes)}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ({day.maxMinutes}m)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="480"
                      step="30"
                      value={day.maxMinutes}
                      onChange={(e) =>
                        onUpdateDay(day.dayId, {
                          maxMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full mt-1.5 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
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
