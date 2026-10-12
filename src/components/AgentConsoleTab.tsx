import React, { useState } from 'react';
import {
  Terminal,
  ShieldCheck,
  FileCode,
  Copy,
  Check,
  Download,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  RefreshCw,
  Hash,
  Layers
} from 'lucide-react';
import { AppUsageRecord, CurfewDaySchedule, BlockedDomain, AgentIntegrity } from '../types';
import {
  generateRegrasJson,
  generatePowerShellBlobString,
  generateHostsBlock,
} from '../data/mockData';

interface AgentConsoleTabProps {
  apps: AppUsageRecord[];
  curfew: CurfewDaySchedule[];
  blockedDomains: BlockedDomain[];
  agent: AgentIntegrity;
  onRefreshTelemetry: () => void;
}

export const AgentConsoleTab: React.FC<AgentConsoleTabProps> = ({
  apps,
  curfew,
  blockedDomains,
  agent,
  onRefreshTelemetry,
}) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'regras' | 'blobs' | 'patch' | 'instalar'>('regras');
  const [copied, setCopied] = useState<string | null>(null);
  const [sampleText, setSampleText] = useState<string>(
    '# Exemplo de código do agente.ps1 para teste de fragmentação\n$ErrorActionPreference = "SilentlyContinue"\nWrite-Host "SentinelPC Watcher Online"\nGet-Process | Where-Object { $_.MainWindowTitle } | Select-Object ProcessName, MainWindowTitle'
  );

  const regrasJson = generateRegrasJson(apps, curfew, blockedDomains);
  const sampleBlobs = generatePowerShellBlobString('bAg', sampleText, 2000);

  const pythonPatchCode = `# Patch aplicado com sucesso a /root/painel_pc.py
# 1. Adicionado hashlib aos imports
# 2. Implementada função blob() para fragmentar Base64 em linhas de 2000 caracteres
# 3. Validação SHA-256 no destino:
#    $hok = ((Get-FileHash "$d\\agente.ps1" -Algorithm SHA256).Hash.ToLower() -eq '__H__')
#    if ($hok) { 'OK' } else { 'FALHA_HASH' }

def blob(var, texto, bom=False, tam=2000):
    """Envia dados grandes em várias linhas curtas (o PowerShell a ler do stdin falha com linhas muito longas)."""
    b = b64(texto, bom)
    return "\\n".join(["$%s = ''" % var] + ["$%s += '%s'" % (var, b[i:i + tam]) for i in range(0, len(b), tam)])

def script_instalar():
    blobs = "\\n".join([
        blob("bAg", AGENTE, True),
        blob("bVg", VIGIA.replace("__USER__", TARGET), True),
        blob("bRg", json.dumps(DEFAULT_RULES))
    ])
    h = hashlib.sha256(base64.b64decode(b64(AGENTE, True))).hexdigest()
    return INSTALAR.replace("__T__", TARGET).replace("__BLOBS__", blobs).replace("__H__", h)

def script_hosts(bloco, wild):
    return HOSTS_SET.replace("__BLOBS__", blob("bB", bloco) + "\\n" + blob("bW", wild))`;

  const installScriptPreview = `# PowerShell Bootstrap Gerado (Exemplo de Injeção no PC Alvo)
$d = "$env:ProgramData\\SentinelPC"
if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }

# Blocos Base64 fragmentados para segurança de buffer stdin
${sampleBlobs.slice(0, 400)}...

[IO.File]::WriteAllBytes("$d\\agente.ps1", [Convert]::FromBase64String($bAg))
$hok = ((Get-FileHash "$d\\agente.ps1" -Algorithm SHA256).Hash.ToLower() -eq '${agent.sha256Hash}')
if ($hok) { 'OK' } else { 'FALHA_HASH' }
"INFO ficheiro=v${agent.version} hash=$(if ($hok) { 'ok' } else { 'DIFERENTE' }) processos=${agent.processesCount} tarefa=Pronta"`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadJson = () => {
    const blob = new Blob([regrasJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'regras.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Integrity & Diagnostics Hero */}
      <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                Estado de Integridade & Validação Criptográfica SHA-256
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Resultados da verificação de integridade do agente PowerShell instalado no Windows.
            </p>
          </div>

          <button
            onClick={onRefreshTelemetry}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors self-start md:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
            <span>Sondar Agente Agora</span>
          </button>
        </div>

        {/* Verification Status Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-400">Verificação Hash</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span>OK ($hok = true)</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              SHA256 coincide com servidor
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-400">Processos Vigia Ativos</span>
            <div className="font-mono text-base font-bold text-cyan-400 tabular-nums">
              {agent.processesCount} processos
            </div>
            <span className="text-[10px] text-slate-500">
              vigia.ps1 + watcher loop
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-400">Tarefa Agendada Windows</span>
            <div className="text-white font-semibold truncate">
              SentinelWatcher
            </div>
            <span className="text-[10px] text-emerald-400">
              Pronta / Em Execução
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-400">Última Sincronização</span>
            <div className="text-slate-200 font-mono tabular-nums">
              {agent.lastSyncTime}
            </div>
            <span className="text-[10px] text-slate-500">
              IP: {agent.ipAddress}
            </span>
          </div>
        </div>

        {/* Hash details bar */}
        <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80 text-xs font-mono space-y-1 overflow-x-auto">
          <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 text-cyan-400" />
            <span>SHA-256 Esperado pelo Servidor:</span>
          </div>
          <div className="text-cyan-300 font-bold tabular-nums">
            {agent.sha256Hash}
          </div>
        </div>
      </div>

      {/* Code & Configuration Center */}
      <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-5 space-y-4">
        {/* Sub-navigation tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveCodeTab('regras')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeCodeTab === 'regras'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              regras.json Atual
            </button>
            <button
              onClick={() => setActiveCodeTab('blobs')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeCodeTab === 'blobs'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Simulador def blob()
            </button>
            <button
              onClick={() => setActiveCodeTab('patch')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeCodeTab === 'patch'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Patch painel_pc.py
            </button>
            <button
              onClick={() => setActiveCodeTab('instalar')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeCodeTab === 'instalar'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Script Instalação PS1
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {activeCodeTab === 'regras' && (
              <button
                onClick={downloadJson}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Descarregar JSON</span>
              </button>
            )}

            <button
              onClick={() => {
                const text =
                  activeCodeTab === 'regras'
                    ? regrasJson
                    : activeCodeTab === 'blobs'
                    ? sampleBlobs
                    : activeCodeTab === 'patch'
                    ? pythonPatchCode
                    : installScriptPreview;
                copyToClipboard(text, activeCodeTab);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black transition-colors"
            >
              {copied === activeCodeTab ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar Código</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content based on tab */}
        {activeCodeTab === 'regras' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 leading-relaxed">
              Este ficheiro <code className="text-slate-300 font-mono">regras.json</code> é atualizado dinamicamente com base nas quotas, limites de programas e horários configurados nesta consola. O script <code className="text-slate-300 font-mono">vigia.ps1</code> lê este ficheiro no PC do filho:
            </p>
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300/90 overflow-x-auto max-h-96 leading-relaxed">
              {regrasJson}
            </pre>
          </div>
        )}

        {activeCodeTab === 'blobs' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 block">
                Texto para Fragmentar em Base64 (Demonstração da função <code className="text-slate-300 font-mono">blob(var, texto, tam=2000)</code>):
              </label>
              <textarea
                rows={3}
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-800 bg-slate-950 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400">
                Resultado em Linhas Curtas de PowerShell (evita estouro de buffer no stdin):
              </span>
              <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-purple-300 overflow-x-auto max-h-80 leading-relaxed">
                {sampleBlobs}
              </pre>
            </div>
          </div>
        )}

        {activeCodeTab === 'patch' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 leading-relaxed">
              Código correspondente ao patch que aplicou no ficheiro <code className="text-slate-300 font-mono">/root/painel_pc.py</code>:
            </p>
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-96 leading-relaxed">
              {pythonPatchCode}
            </pre>
          </div>
        )}

        {activeCodeTab === 'instalar' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 leading-relaxed">
              Esboço da sequência de instalação enviada por stdin para o PowerShell no Windows:
            </p>
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300/90 overflow-x-auto max-h-96 leading-relaxed">
              {installScriptPreview}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
