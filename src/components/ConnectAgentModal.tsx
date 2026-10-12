import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Copy,
  Check,
  Server,
  Terminal,
  Trash2,
  X,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { AgentIntegrity } from '../types';

interface ConnectAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentIntegrity;
  isRealMode: boolean;
  onProbeAgent: () => Promise<void>;
  onTriggerTestReport: () => Promise<void>;
  onResetAgentData: () => Promise<void>;
}

export const ConnectAgentModal: React.FC<ConnectAgentModalProps> = ({
  isOpen,
  onClose,
  agent,
  isRealMode,
  onProbeAgent,
  onTriggerTestReport,
  onResetAgentData,
}) => {
  const [isProbing, setIsProbing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const serverHost = typeof window !== 'undefined' ? window.location.host : 'IP_DO_PAI:3000';
  const installCmd = `irm http://${serverHost}/api/agent/install.ps1 | iex`;

  const handleProbe = async () => {
    setIsProbing(true);
    setFeedback('A sondar o agente e a verificar relatórios no servidor...');
    try {
      await onProbeAgent();
      setFeedback('Sondagem efetuada com sucesso!');
    } catch {
      setFeedback('Erro ao sondar o servidor.');
    } finally {
      setIsProbing(false);
    }
  };

  const handleTestReport = async () => {
    setIsTesting(true);
    setFeedback('A enviar relatório de telemetria em direto...');
    try {
      await onTriggerTestReport();
      setFeedback('Telemetria recebida! Modo em Tempo Real ativado com sucesso.');
    } catch {
      setFeedback('Falha ao enviar relatório.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    setFeedback('A limpar todos os contadores e dados do agente...');
    try {
      await onResetAgentData();
      setFeedback('Dados limpos com sucesso. O sistema está pronto para receber novas sessões.');
    } catch {
      setFeedback('Erro ao limpar dados.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-xl border border-slate-800 bg-[#0E131F] p-6 shadow-2xl text-slate-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Diagnóstico & Ligação do Agente Real
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Alvo: {agent.targetMachine} ({agent.ipAddress})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Connection Status Box */}
        <div
          className={`p-4 rounded-xl border text-xs space-y-2 ${
            isRealMode
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Estado da Conexão
            </span>
            <span className="font-bold flex items-center gap-1.5 font-mono">
              {isRealMode ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>EM TEMPO REAL (Ligado)</span>
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 text-amber-400 animate-pulse" />
                  <span>A AGUARDAR TELEMETRIA</span>
                </>
              )}
            </span>
          </div>

          <p className="text-slate-300 leading-relaxed text-[11px]">
            {isRealMode ? (
              <>
                O agente no computador de <strong>{agent.targetUser}</strong> está ativo e a reportar em direto. Último contacto: <strong className="font-mono text-emerald-300">{agent.lastSyncTime}</strong>.
              </>
            ) : (
              <>
                O painel ainda não recebeu o primeiro relatório do computador com o IP <strong className="font-mono text-white">{agent.ipAddress}</strong>. Para começar a gravar tempos reais, execute o comando abaixo no PowerShell do computador do filho.
              </>
            )}
          </p>
        </div>

        {/* One-Line PowerShell Command */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-cyan-400" />
              Comando para Iniciar no PC do Filho (PowerShell Admin):
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto select-all">
            {installCmd}
          </pre>
        </div>

        {/* Action Controls Strip */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-semibold text-slate-400 block">
            Ações de Diagnóstico e Controlo:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Sondar */}
            <button
              type="button"
              disabled={isProbing}
              onClick={handleProbe}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`h-3.5 w-3.5 text-cyan-400 ${isProbing ? 'animate-spin' : ''}`} />
              <span>Sondar Agente</span>
            </button>

            {/* 2. Testar Relatório */}
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTestReport}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 transition-colors disabled:opacity-50"
              title="Gera um relatório de teste e ativa o modo real imediatamente"
            >
              <Play className="h-3.5 w-3.5 text-cyan-400" />
              <span>Ativar Modo Real</span>
            </button>

            {/* 3. Limpar Dados */}
            <button
              type="button"
              disabled={isResetting}
              onClick={handleReset}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-500/40 transition-colors disabled:opacity-50"
              title="Limpa contadores e reinicia os dados do agente"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
              <span>Limpar Dados</span>
            </button>
          </div>
        </div>

        {/* Feedback text */}
        {feedback && (
          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-cyan-300 flex items-center gap-2 font-mono">
            <span>ℹ️</span>
            <span>{feedback}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
