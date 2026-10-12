import React, { useState, useEffect } from 'react';
import { X, Clock, Shield, AlertTriangle } from 'lucide-react';
import { AppUsageRecord, formatMinutesToHuman } from '../types';

interface EditLimitModalProps {
  app: AppUsageRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (appId: string, limitMinutes: number | null, isBlocked: boolean) => void;
}

export const EditLimitModal: React.FC<EditLimitModalProps> = ({
  app,
  isOpen,
  onClose,
  onSave,
}) => {
  const [limit, setLimit] = useState<number>(60);
  const [isUnlimited, setIsUnlimited] = useState<boolean>(false);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);

  useEffect(() => {
    if (app) {
      if (app.dailyLimitMinutes === null) {
        setIsUnlimited(true);
        setLimit(60);
      } else {
        setIsUnlimited(false);
        setLimit(app.dailyLimitMinutes);
      }
      setIsBlocked(app.status === 'blocked');
    }
  }, [app]);

  if (!isOpen || !app) return null;

  const presets = [30, 45, 60, 90, 120, 180];

  const handleSave = () => {
    onSave(app.id, isUnlimited ? null : limit, isBlocked);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-[#0E131F] p-6 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Regras para {app.displayName}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Processo: {app.processName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-6">
          {/* Current usage banner */}
          <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-slate-300">Tempo consumido hoje</span>
            </div>
            <span className="font-mono text-base font-bold text-white tabular-nums">
              {formatMinutesToHuman(app.minutesToday)}
            </span>
          </div>

          {/* Block Status Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Estado de Acesso
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsBlocked(false)}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                  !isBlocked
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>Permitido com Limite</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBlocked(true)}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                  isBlocked
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>Bloquear Totalmente</span>
              </button>
            </div>
          </div>

          {/* Daily Limit Controls */}
          {!isBlocked && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Quota Diária Máxima
                </label>
                <button
                  type="button"
                  onClick={() => setIsUnlimited(!isUnlimited)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                    isUnlimited
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isUnlimited ? 'Sem Limite (Ativo)' : 'Tornar Ilimitado'}
                </button>
              </div>

              {!isUnlimited ? (
                <div className="space-y-4 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Limite selecionado:</span>
                    <span className="font-mono text-xl font-bold text-cyan-400 tabular-nums">
                      {formatMinutesToHuman(limit)}
                      <span className="text-xs text-slate-400 font-normal ml-1">({limit} min)</span>
                    </span>
                  </div>

                  <input
                    type="range"
                    min="15"
                    max="300"
                    step="15"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {presets.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setLimit(mins)}
                        className={`text-xs px-2.5 py-1 rounded border font-mono transition-colors tabular-nums ${
                          limit === mins
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {formatMinutesToHuman(mins)}
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                    Quando a quota for atingida, o agente <code className="text-slate-300">vigia.ps1</code> emitirá um aviso no ambiente de trabalho do Windows e encerrará o processo automaticamente.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-lg text-xs text-cyan-300">
                  Esta aplicação não possui restrições de tempo diário. O tempo de utilização continuará a ser registado para auditoria e relatórios.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm"
          >
            Guardar Regra
          </button>
        </div>
      </div>
    </div>
  );
};
