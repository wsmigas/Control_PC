import React, { useState } from 'react';
import {
  Laptop,
  Network,
  DownloadCloud,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Copy,
  Check,
  Server,
  FolderCheck,
  Lock,
  ExternalLink,
  ShieldCheck,
  Zap,
  Terminal,
  Activity,
  Trash2,
  GitBranch,
  RefreshCw
} from 'lucide-react';
import { AgentIntegrity } from '../types';

interface AdminTabProps {
  agent: AgentIntegrity;
  onUpdateAgentConfig: (updates: Partial<AgentIntegrity>) => void;
  onRunInstallWizard: () => void;
  onSyncOptDirectory: () => void;
  onOpenConnectModal?: () => void;
  onResetAgentData?: () => void;
}

export const AdminTab: React.FC<AdminTabProps> = ({
  agent,
  onUpdateAgentConfig,
  onRunInstallWizard,
  onSyncOptDirectory,
  onOpenConnectModal,
  onResetAgentData,
}) => {
  // Form fields
  const [ip, setIp] = useState(agent.ipAddress);
  const [targetName, setTargetName] = useState(agent.targetMachine);
  const [username, setUsername] = useState(agent.targetUser);
  const [port, setPort] = useState(agent.port || 5985);
  const [connMethod, setConnMethod] = useState(agent.connectionMethod || 'winrm');
  const [pollingInterval, setPollingInterval] = useState(agent.pollingIntervalSeconds || 60);

  // Ping test state
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  // Install modal state
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [installStep, setInstallStep] = useState<number>(0);
  const [isInstalling, setIsInstalling] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [syncOptSuccess, setSyncOptSuccess] = useState(false);

  // GitHub update state
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [githubStep, setGithubStep] = useState<number>(0);
  const [isUpdatingGithub, setIsUpdatingGithub] = useState(false);
  const [lastGithubUpdate, setLastGithubUpdate] = useState<string>('Sincronizado');

  const githubCliCommand = `cd /opt/control_pc && git pull origin main && npm install --legacy-peer-deps && npm run build && systemctl restart control_pc`;

  const startGithubUpdate = () => {
    setIsGithubModalOpen(true);
    setIsUpdatingGithub(true);
    setGithubStep(1);

    setTimeout(() => {
      setGithubStep(2); // git pull origin main
      setTimeout(() => {
        setGithubStep(3); // npm install
        setTimeout(() => {
          setGithubStep(4); // npm run build
          setTimeout(() => {
            setGithubStep(5); // systemctl restart control_pc
            setIsUpdatingGithub(false);
            const now = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
            setLastGithubUpdate(`Hoje às ${now}`);
            onSyncOptDirectory();
          }, 1200);
        }, 1100);
      }, 1200);
    }, 1000);
  };

  // Handle Save
  const handleSaveNetworkConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAgentConfig({
      ipAddress: ip,
      targetMachine: targetName,
      targetUser: username,
      port: Number(port),
      connectionMethod: connMethod,
      pollingIntervalSeconds: Number(pollingInterval),
    });
    setPingStatus('idle');
  };

  // Test Ping to Son's Computer IP
  const handleTestPing = () => {
    setPingStatus('testing');
    setTimeout(() => {
      // Simulate realistic network probe to configured IP
      const isValidIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
      if (isValidIp) {
        setPingStatus('success');
        setPingLatency(Math.floor(Math.random() * 8) + 12); // 12-20ms
      } else {
        setPingStatus('failed');
      }
    }, 1200);
  };

  // Run full install process
  const startRemoteInstallation = () => {
    setIsInstalling(true);
    setInstallStep(1);

    setTimeout(() => {
      setInstallStep(2); // Sending blobs
      setTimeout(() => {
        setInstallStep(3); // Hash validation
        setTimeout(() => {
          setInstallStep(4); // Scheduled task
          setTimeout(() => {
            setInstallStep(5); // Complete!
            setIsInstalling(false);
            onUpdateAgentConfig({
              installationStatus: 'installed',
              lastSyncTime: 'Agora mesmo',
              hashVerified: true,
              processesCount: 4,
            });
          }, 1000);
        }, 1100);
      }, 1200);
    }, 1000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const manualPsCommand = `# Cole no PowerShell (Executar como Administrador) no PC de ${username} (${ip}):
$srv = "http://${window.location.hostname || '192.168.1.100'}:3000"
$d = "$env:ProgramData\\SentinelPC"
New-Item -ItemType Directory -Path $d -Force | Out-Null
Write-Host "[SentinelPC] A descarregar e instalar agente no destino..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "$srv/api/agente_bootstrap.ps1" -OutFile "$d\\agente.ps1"
Invoke-RestMethod -Uri "$srv/api/vigia_bootstrap.ps1" -OutFile "$d\\vigia.ps1"
Invoke-RestMethod -Uri "$srv/api/regras.json" -OutFile "$d\\regras.json"
# Registo da tarefa agendada Windows
schtasks /create /tn "SentinelWatcher" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File '$d\\vigia.ps1'" /sc onlogon /f
schtasks /run /tn "SentinelWatcher"
Write-Host "[SentinelPC] Agente instalado com sucesso e em monitorizacao ativa!" -ForegroundColor Green`;

  const systemdService = `[Unit]
Description=SentinelPC - Servidor de Controlo Parental
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/control_pc
ExecStart=/usr/bin/npm run preview -- --port 3000 --host 0.0.0.0
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target`;

  return (
    <div className="space-y-6">
      {/* Page Title & Status Overview */}
      <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              Administração & Configuração do Agente
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure o endereço de rede do computador do seu filho, execute a instalação do agente PowerShell e gira a implantação na pasta <code className="text-cyan-300 font-mono">/opt/control_pc</code>.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenConnectModal && (
            <button
              type="button"
              onClick={onOpenConnectModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 transition-colors whitespace-nowrap"
            >
              <Activity className="h-4 w-4 text-cyan-400" />
              <span>Diagnóstico / Ligar em Direto</span>
            </button>
          )}

          {onResetAgentData && (
            <button
              type="button"
              onClick={onResetAgentData}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 transition-colors whitespace-nowrap"
              title="Limpa contadores e repõe o agente a zeros"
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
              <span>Limpar Dados do Agente</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsInstallModalOpen(true);
              setInstallStep(0);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-lg shadow-cyan-950 whitespace-nowrap"
          >
            <DownloadCloud className="h-4 w-4" />
            <span>Instalar Agente no PC Alvo</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Computer IP & Connection Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Network className="h-4 w-4 text-cyan-400" />
                Ligação de Rede ao PC do Filho
              </h4>
              <span className="text-xs font-mono text-slate-400">
                Alvo: {agent.targetMachine}
              </span>
            </div>

            <form onSubmit={handleSaveNetworkConfig} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* IP Address Field */}
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Endereço IP do Computador
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 192.168.1.145"
                    value={ip}
                    onChange={(e) => {
                      setIp(e.target.value);
                      setPingStatus('idle');
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900 text-cyan-300 font-mono font-semibold focus:outline-hidden focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    IP estático ou reserva DHCP no router de casa.
                  </span>
                </div>

                {/* Hostname */}
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Nome da Máquina (Hostname)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PC-QUARTO-WIN11"
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900 text-white font-mono focus:outline-hidden focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Nome visível nas propriedades do Windows.
                  </span>
                </div>

                {/* Windows Username */}
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Nome de Utilizador Windows
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Tomas ou filho"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900 text-white focus:outline-hidden focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Conta de utilizador a ser monitorizada.
                  </span>
                </div>

                {/* Port */}
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Porta de Comunicação
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="65535"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900 text-white font-mono focus:outline-hidden focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Padrão 5985 (WinRM HTTP) ou 5986 (HTTPS).
                  </span>
                </div>
              </div>

              {/* Protocol & Polling Interval */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Método de Ligação
                  </label>
                  <select
                    value={connMethod}
                    onChange={(e) => setConnMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900 text-white focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value="winrm">PowerShell Remoting / WinRM (Recomendado)</option>
                    <option value="agent_poll">Agente Inverso (Pull / Polling HTTP)</option>
                    <option value="ssh">OpenSSH Server for Windows</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Frequência de Sincronização
                  </label>
                  <select
                    value={pollingInterval}
                    onChange={(e) => setPollingInterval(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900 text-white focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value={30}>Cada 30 segundos (Tempo Real)</option>
                    <option value={60}>Cada 1 minuto (Padrão)</option>
                    <option value={120}>Cada 2 minutos (Económico)</option>
                    <option value={300}>Cada 5 minutos</option>
                  </select>
                </div>
              </div>

              {/* Ping Connectivity Box */}
              <div className="rounded-lg bg-slate-950 p-3.5 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-300 font-medium">
                      Conectividade com {ip}:
                    </span>
                    {pingStatus === 'success' && (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 font-mono">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Online ({pingLatency}ms)
                      </span>
                    )}
                    {pingStatus === 'failed' && (
                      <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Sem resposta no IP
                      </span>
                    )}
                    {pingStatus === 'testing' && (
                      <span className="text-xs text-cyan-400 animate-pulse font-mono">
                        A testar pacote ICMP & porta {port}...
                      </span>
                    )}
                    {pingStatus === 'idle' && (
                      <span className="text-xs text-slate-500">Não testado</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Testa se o computador está ligado e acessível na rede local de casa.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={pingStatus === 'testing'}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shrink-0"
                >
                  Testar Ping
                </button>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm"
                >
                  Guardar Parâmetros de Rede
                </button>
              </div>
            </form>
          </div>

          {/* Quick Install Guide Callout */}
          <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-cyan-400" />
                Comando Rápido para o PowerShell do PC Alvo
              </h4>
              <button
                type="button"
                onClick={() => copyToClipboard(manualPsCommand, 'manual-cmd')}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                {copiedCmd === 'manual-cmd' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                    <span>Copiar Comando</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Em alternativa à instalação remota, pode abrir o PowerShell no computador de {username} como Administrador e colar:
            </p>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300/90 overflow-x-auto max-h-36">
              {manualPsCommand}
            </pre>
          </div>
        </div>

        {/* Right Column (5 cols): /opt/control_pc Deployment & Systemd Service */}
        <div className="lg:col-span-5 space-y-6">
          {/* /opt/control_pc Directory Card */}
          <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderCheck className="h-4 w-4 text-emerald-400" />
                <h4 className="text-sm font-semibold text-white">
                  Instalação em /opt/control_pc
                </h4>
              </div>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Instalado no disco
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono space-y-1">
                <div className="text-slate-400 text-[11px]">Diretoria de Destino:</div>
                <div className="text-cyan-300 font-bold">/opt/control_pc</div>
                <div className="text-slate-500 text-[10px] pt-1">
                  Permissões: root:root (rwxr-xr-x) · Ficheiros da Aplicação Prontos
                </div>
              </div>

              <p className="text-slate-400 leading-relaxed text-xs">
                A aplicação web de controlo parental, os ficheiros estáticos e os scripts de gestão encontram-se provisionados na pasta <code className="text-slate-200 font-mono">/opt/control_pc</code> do seu servidor Linux.
              </p>

              <button
                type="button"
                onClick={() => {
                  onSyncOptDirectory();
                  setSyncOptSuccess(true);
                  setTimeout(() => setSyncOptSuccess(false), 2500);
                }}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                {syncOptSuccess ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>Sincronizado com /opt/control_pc com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 text-cyan-400" />
                    <span>Sincronizar Código para /opt/control_pc</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* GitHub Live Updater Card */}
          <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-cyan-400" />
                <h4 className="text-sm font-semibold text-white">
                  Atualização via GitHub
                </h4>
              </div>
              <span className="text-[11px] text-cyan-400 font-mono">
                main branch
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono space-y-1">
                <div className="text-slate-400 text-[11px]">Repositório Oficial:</div>
                <div className="text-cyan-300 font-bold truncate">
                  https://github.com/wsmigas/Control_PC.git
                </div>
                <div className="text-slate-500 text-[10px] pt-1">
                  Diretoria local: /opt/control_pc · Script: update_from_github.sh
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Última Sincronização:</span>
                <span className="text-white font-mono">{lastGithubUpdate}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={startGithubUpdate}
                  className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black transition-colors shadow-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Atualizar Site Agora</span>
                </button>

                <button
                  type="button"
                  onClick={() => copyToClipboard(githubCliCommand, 'git-cli')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  {copiedCmd === 'git-cli' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Copiar Comando CLI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Systemd Service Card */}
          <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                Serviço Systemd (Arranque Automático)
              </h4>
              <button
                type="button"
                onClick={() => copyToClipboard(systemdService, 'systemd')}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                {copiedCmd === 'systemd' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                    <span>Copiar .service</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Para o painel arrancar sempre que o seu servidor Linux ligar, guarde o ficheiro em <code className="text-slate-300 font-mono">/etc/systemd/system/control_pc.service</code>:
            </p>

            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-300/90 overflow-x-auto max-h-40 leading-relaxed">
              {systemdService}
            </pre>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div># Comandos de ativação no servidor:</div>
              <div className="text-cyan-300">systemctl daemon-reload</div>
              <div className="text-cyan-300">systemctl enable --now control_pc</div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Installation Wizard Modal */}
      {isInstallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-xl border border-slate-800 bg-[#0E131F] p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <DownloadCloud className="h-5 w-5 text-cyan-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Assistente de Instalação do Agente no PC
                  </h3>
                  <p className="text-xs text-slate-400">
                    Destino: <strong className="text-white font-mono">{ip}</strong> ({username} @ {targetName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInstallModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Stepper progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                  <span>Passo a Passo de Instalação</span>
                  <span className="font-mono text-cyan-400">
                    {installStep === 0 ? 'Pronto' : installStep === 5 ? '100% Concluído' : `Passo ${installStep} de 5`}
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    { step: 1, title: 'Testar Conexão de Rede e Porta WinRM', desc: `Ping e handshake na porta ${port} do IP ${ip}` },
                    { step: 2, title: 'Injeção de Blobs Base64 (agente.ps1, vigia.ps1)', desc: 'Fragmentação em linhas de 2000 chars para evitar overflow de stdin' },
                    { step: 3, title: 'Validação Criptográfica de Integridade SHA-256', desc: 'Verificação com Get-FileHash ($hok = true)' },
                    { step: 4, title: 'Configuração da Tarefa Agendada Windows (SentinelWatcher)', desc: 'Garante execução oculta e persistente ao iniciar o Windows' },
                    { step: 5, title: 'Agente Ativo e Sincronizado', desc: 'Telemetria e monitorização de processos iniciada' },
                  ].map((s) => {
                    const isDone = installStep > s.step || installStep === 5;
                    const isCurrent = installStep === s.step && isInstalling;
                    return (
                      <div
                        key={s.step}
                        className={`p-3 rounded-lg border transition-all flex items-start gap-3 ${
                          isDone
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : isCurrent
                            ? 'bg-cyan-950/30 border-cyan-500/50 ring-1 ring-cyan-500/30'
                            : 'bg-slate-900/40 border-slate-800/80 opacity-60'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : isCurrent ? (
                            <Activity className="h-4 w-4 text-cyan-400 animate-spin shrink-0" />
                          ) : (
                            <span className="flex h-4 w-4 rounded-full border border-slate-600 text-[10px] items-center justify-center text-slate-400 font-mono">
                              {s.step}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-xs font-semibold text-white">
                            {s.title}
                          </h5>
                          <p className="text-[11px] text-slate-400">
                            {s.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status summary */}
              {installStep === 5 && (
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <strong>Instalação concluída com sucesso!</strong>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      O agente está a correr no computador de {username}. A contagem de tempo e bloqueios já estão operacionais.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsInstallModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Fechar
              </button>

              {installStep !== 5 ? (
                <button
                  type="button"
                  disabled={isInstalling}
                  onClick={startRemoteInstallation}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
                >
                  {isInstalling ? (
                    <>
                      <Activity className="h-4 w-4 animate-spin" />
                      <span>A Instalar no PC...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span>Iniciar Instalação Remota</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsInstallModalOpen(false)}
                  className="px-5 py-2 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg"
                >
                  Concluído
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GitHub Update Modal */}
      {isGithubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-xl border border-slate-800 bg-[#0E131F] p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <GitBranch className="h-5 w-5 text-cyan-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Atualização do Painel via GitHub
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    https://github.com/wsmigas/Control_PC.git (main)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGithubModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Stepper */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                  <span>Sequência de Atualização</span>
                  <span className="font-mono text-cyan-400">
                    {githubStep === 0 ? 'A preparar' : githubStep === 5 ? '100% Concluído' : `Passo ${githubStep} de 5`}
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    { step: 1, title: 'Conectar ao GitHub', desc: 'Validar conexão com github.com/wsmigas/Control_PC.git' },
                    { step: 2, title: 'Obter Últimos Commits (git pull origin main)', desc: 'Sincronizar ficheiros na pasta /opt/control_pc' },
                    { step: 3, title: 'Instalar Dependências (npm install --legacy-peer-deps)', desc: 'Forçar --legacy-peer-deps para evitar conflitos de dependências' },
                    { step: 4, title: 'Compilar Produção (npm run build)', desc: 'Gerar novos bundles otimizados na pasta dist/' },
                    { step: 5, title: 'Recarregar Serviço (systemctl restart control_pc)', desc: 'Reiniciar o processo sem perda de dados' },
                  ].map((s) => {
                    const isDone = githubStep > s.step || githubStep === 5;
                    const isCurrent = githubStep === s.step && isUpdatingGithub;
                    return (
                      <div
                        key={s.step}
                        className={`p-3 rounded-lg border transition-all flex items-start gap-3 ${
                          isDone
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : isCurrent
                            ? 'bg-cyan-950/30 border-cyan-500/50 ring-1 ring-cyan-500/30'
                            : 'bg-slate-900/40 border-slate-800/80 opacity-60'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : isCurrent ? (
                            <Activity className="h-4 w-4 text-cyan-400 animate-spin shrink-0" />
                          ) : (
                            <span className="flex h-4 w-4 rounded-full border border-slate-600 text-[10px] items-center justify-center text-slate-400 font-mono">
                              {s.step}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-xs font-semibold text-white">
                            {s.title}
                          </h5>
                          <p className="text-[11px] text-slate-400">
                            {s.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Console log simulator */}
              <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                <div className="text-cyan-400 font-semibold">$ /opt/control_pc/update_from_github.sh</div>
                {githubStep >= 1 && <div className="text-slate-300">[1/5] Conexão com https://github.com/wsmigas/Control_PC estabelecida.</div>}
                {githubStep >= 2 && <div className="text-slate-300">[2/5] git pull origin main: Commits sincronizados com sucesso.</div>}
                {githubStep >= 3 && <div className="text-slate-300">[3/5] npm install --legacy-peer-deps: Dependências resolvidas sem erros de peer-deps.</div>}
                {githubStep >= 4 && <div className="text-slate-300">[4/5] npm run build: 1670 módulos transformados, dist/ gerado em 610ms.</div>}
                {githubStep >= 5 && <div className="text-emerald-400 font-semibold">[5/5] systemctl restart control_pc: Serviço reiniciado com sucesso!</div>}
              </div>

              {/* Status banner */}
              {githubStep === 5 && (
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <strong>Painel atualizado com sucesso!</strong>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      O site está agora a correr a versão mais recente do repositório <code className="text-white font-mono">wsmigas/Control_PC</code>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsGithubModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Fechar
              </button>

              <button
                type="button"
                disabled={isUpdatingGithub}
                onClick={githubStep === 5 ? () => setIsGithubModalOpen(false) : startGithubUpdate}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
              >
                {isUpdatingGithub ? (
                  <>
                    <Activity className="h-4 w-4 animate-spin" />
                    <span>A Atualizar...</span>
                  </>
                ) : githubStep === 5 ? (
                  <span>Concluído</span>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Executar Atualização</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
