import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Power,
  RotateCcw,
  LogOut,
  XCircle,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { PCConfig } from '../types';

interface ActionsTabProps {
  activePc: PCConfig;
  onSendMessage: (text: string) => Promise<void>;
  onPowerAction: (action: 'logoff' | 'shutdown' | 'restart' | 'cancel') => Promise<void>;
  emergencyLock: boolean;
  onToggleEmergencyLock: () => void;
}

export const ActionsTab: React.FC<ActionsTabProps> = ({
  activePc,
  onSendMessage,
  onPowerAction,
  emergencyLock,
  onToggleEmergencyLock,
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [powerPending, setPowerPending] = useState<string | null>(null);

  const messagePresets = [
    'Está na hora de parar.',
    'Vem jantar, a mesa está posta!',
    'Faz uma pausa de 5 minutos.',
    'Tempo de ecrã quase a terminar.',
    'Por favor desliga o computador.',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || customMessage;
    if (!text.trim()) return;

    setSendingMsg(true);
    try {
      await onSendMessage(text);
      if (!textToSend) setCustomMessage('');
    } finally {
      setSendingMsg(false);
    }
  };

  const handlePower = async (action: 'logoff' | 'shutdown' | 'restart' | 'cancel', confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;

    setPowerPending(action);
    try {
      await onPowerAction(action);
    } finally {
      setPowerPending(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Active PC */}
      <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Laptop className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                Ações no {activePc.nome}
              </h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                activePc.isOnline
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {activePc.isOnline ? 'Online (Em direto)' : 'À espera de sinal'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Utilizador: <strong className="text-slate-200">{activePc.target_user}</strong> · IP: <strong className="text-slate-200">{activePc.host}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={onToggleEmergencyLock}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors border ${
            emergencyLock
              ? 'bg-rose-950/80 text-rose-300 border-rose-500/60 hover:bg-rose-900'
              : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-slate-500'
          }`}
        >
          <ShieldAlert className={`h-4 w-4 ${emergencyLock ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
          <span>{emergencyLock ? 'Desativar Pausa Imediata' : 'Pausa Familiar (Bloquear Ecrã)'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Send Message on Screen */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Mensagem no Ecrã do Filho
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Aparece em destaque na sessão Windows
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Envia uma janela instantânea para o ambiente de trabalho de <strong>{activePc.target_user}</strong>, visível por cima de jogos e navegadores.
            </p>

            {/* Custom Input */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={200}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                  placeholder="Escreve uma mensagem para aparecer no ecrã..."
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-hidden focus:border-cyan-500"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={sendingMsg || !customMessage.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <Send className="h-4 w-4" />
                  <span>Enviar</span>
                </button>
              </div>
            </div>

            {/* Quick Presets Strip */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                Mensagens Rápidas de 1 Clique:
              </span>
              <div className="flex flex-wrap gap-2">
                {messagePresets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleSend(preset)}
                    disabled={sendingMsg}
                    className="px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 text-slate-200 transition-colors cursor-pointer text-left"
                  >
                    "{preset}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Power & Session Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Power className="h-5 w-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">
                  Sessão & Energia
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Desligar e reiniciar incluem 60 segundos de contagem decrescente no ecrã para salvar trabalhos.
            </p>

            <div className="space-y-2.5">
              {/* Logoff */}
              <button
                type="button"
                disabled={powerPending !== null}
                onClick={() => handlePower('logoff', `Terminar a sessão de ${activePc.target_user} agora? Perderá o trabalho não guardado.`)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800/90 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-amber-950/60 border border-amber-500/30 text-amber-400">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                      Terminar Sessão (Logoff)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Fecha todos os programas e regressa ao ecrã de início
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 group-hover:text-slate-300 font-mono">Imediato</span>
              </button>

              {/* Restart */}
              <button
                type="button"
                disabled={powerPending !== null}
                onClick={() => handlePower('restart', `Reiniciar o computador de ${activePc.target_user}? (Com aviso prévio de 60s no ecrã)`)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800/90 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                    <RotateCcw className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      Reiniciar Computador
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Aviso de 60 segundos no ecrã antes de reiniciar
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 group-hover:text-slate-300 font-mono">60s</span>
              </button>

              {/* Shutdown */}
              <button
                type="button"
                disabled={powerPending !== null}
                onClick={() => handlePower('shutdown', `Desligar o computador de ${activePc.target_user}? (Com aviso prévio de 60s no ecrã)`)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-rose-900/40 bg-rose-950/20 hover:bg-rose-950/40 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-rose-950/80 border border-rose-500/40 text-rose-400">
                    <Power className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-rose-200 group-hover:text-rose-100 transition-colors">
                      Desligar Computador
                    </h4>
                    <p className="text-[11px] text-rose-300/80">
                      Aviso de 60 segundos no ecrã antes de desligar
                    </p>
                  </div>
                </div>
                <span className="text-xs text-rose-400 font-mono">60s</span>
              </button>

              {/* Cancel Shutdown */}
              <button
                type="button"
                disabled={powerPending !== null}
                onClick={() => handlePower('cancel')}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                <XCircle className="h-4 w-4 text-emerald-400" />
                <span>Cancelar Desligamento / Reinício Agendado</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
