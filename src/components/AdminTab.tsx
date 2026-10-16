import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw,
  Plus,
  Edit2,
  CheckCircle,
  HelpCircle,
  Radio
} from 'lucide-react';
import { AgentIntegrity, PCConfig } from '../types';

interface AdminTabProps {
  agent: AgentIntegrity;
  pcsList?: PCConfig[];
  activePcId?: string;
  onSelectPc?: (id: string) => void;
  onSavePc?: (pc: Partial<PCConfig>) => Promise<void>;
  onDeletePc?: (id: string) => Promise<void>;
  onUpdateAgentConfig: (updates: Partial<AgentIntegrity>) => void;
  onRunInstallWizard: () => void;
  onSyncOptDirectory: () => void;
  onOpenConnectModal?: () => void;
  onResetAgentData?: () => void;
}

export const AdminTab: React.FC<AdminTabProps> = ({
  agent,
  pcsList = [],
  activePcId = 'pc1',
  onSelectPc,
  onSavePc,
  onDeletePc,
  onUpdateAgentConfig,
  onRunInstallWizard,
  onSyncOptDirectory,
  onOpenConnectModal,
  onResetAgentData,
}) => {
  // Active PC form fields
  const [ip, setIp] = useState(agent.ipAddress);
  const [targetName, setTargetName] = useState(agent.targetMachine);
  const [username, setUsername] = useState(agent.targetUser);
  const [port, setPort] = useState(agent.port || 5985);
  const [connMethod, setConnMethod] = useState<'agent_poll' | 'ssh' | 'winrm'>((agent.connectionMethod as any) || 'agent_poll');
  const [pollingInterval, setPollingInterval] = useState(agent.pollingIntervalSeconds || 10);

  // Multi-PC modal / edit form state
  const [isPcModalOpen, setIsPcModalOpen] = useState(false);
  const [editingPcId, setEditingPcId] = useState<string | null>(null);
  const [formPcName, setFormPcName] = useState('');
  const [formPcHost, setFormPcHost] = useState('');
  const [formPcUser, setFormPcUser] = useState('');
  const [formPcMethod, setFormPcMethod] = useState<'agent_poll' | 'ssh'>('agent_poll');
  const [formSshUser, setFormSshUser] = useState('');
  const [formSshPwd, setFormSshPwd] = useState('');
  const [formSshKey, setFormSshKey] = useState('');
  const [pcFormError, setPcFormError] = useState<string | null>(null);
  const [isSubmittingPc, setIsSubmittingPc] = useState(false);

  // Ping test state
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pingError, setPingError] = useState<string | null>(null);

  // Install modal state
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isCheckingAgentStatus, setIsCheckingAgentStatus] = useState(false);
  const [agentStatusFeedback, setAgentStatusFeedback] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [syncOptSuccess, setSyncOptSuccess] = useState(false);

  // GitHub update state
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [githubStep, setGithubStep] = useState<number>(0);
  const [isUpdatingGithub, setIsUpdatingGithub] = useState(false);
  const [lastGithubUpdate, setLastGithubUpdate] = useState<string>('Sincronizado');
  const [githubLogs, setGithubLogs] = useState<string[]>([]);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubStatus, setGithubStatus] = useState<{
    localCommit?: string;
    remoteCommit?: string;
    isUpToDate?: boolean;
    lastUpdated?: string | null;
  }>({});
  const [autoReloadCountdown, setAutoReloadCountdown] = useState<number | null>(null);
  const terminalLogEndRef = useRef<HTMLDivElement>(null);

  const serverProto = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const serverHost = typeof window !== 'undefined' && window.location.host ? window.location.host : `${window.location.hostname || '192.168.1.100'}:3000`;
  const installCmdUrl = `${serverProto}//${serverHost}/api/agent/install.ps1`;
  const manualPsCommand = `# Comando de Linha Única para PowerShell (Executar como Administrador no PC do Filho):
irm ${installCmdUrl} | iex`;

  const githubCliCommand = `bash /opt/control_pc/update_from_github.sh || (cd /opt/control_pc && git fetch origin main && git reset --hard origin/main && npm install --legacy-peer-deps && npm run build && systemctl restart control_pc)`;

  // Sincronizar campos quando o agente ou o PC ativo muda
  useEffect(() => {
    setIp(agent.ipAddress);
    setTargetName(agent.targetMachine);
    setUsername(agent.targetUser);
    setPort(agent.port || 5985);
    setConnMethod((agent.connectionMethod as any) || 'agent_poll');
  }, [agent]);

  // Carregar estado real do repositório
  useEffect(() => {
    fetch('/api/admin/github-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setGithubStatus(data);
          if (data.lastUpdated) {
            const date = new Date(data.lastUpdated);
            const formatted = `${date.toLocaleDateString('pt-PT')} às ${date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
            const commitTag = data.localCommit ? ` (${data.localCommit})` : '';
            setLastGithubUpdate(`${formatted}${commitTag}`);
          } else if (data.localCommit && data.localCommit !== 'unknown') {
            setLastGithubUpdate(`Commit ${data.localCommit}`);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Contagem decrescente para recarregar a página automaticamente após atualização bem sucedida
  useEffect(() => {
    if (autoReloadCountdown === null) return;
    if (autoReloadCountdown <= 0) {
      window.location.href = window.location.origin + window.location.pathname + '?updated=' + Date.now();
      return;
    }
    const timer = setTimeout(() => {
      setAutoReloadCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [autoReloadCountdown]);

  // Scroll automático no log do terminal
  useEffect(() => {
    if (terminalLogEndRef.current) {
      terminalLogEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [githubLogs]);

  const startGithubUpdate = async () => {
    setIsGithubModalOpen(true);
    setIsUpdatingGithub(true);
    setGithubStep(1);
    setGithubError(null);
    setAutoReloadCountdown(null);
    setGithubLogs([
      '$ bash /opt/control_pc/update_from_github.sh',
      '[1/5] A verificar diretório e repositório...',
    ]);

    const stepTimer1 = setTimeout(() => {
      setGithubStep(2);
      setGithubLogs((prev) => [...prev, '[2/5] A ligar a https://github.com/wsmigas/Control_PC.git (git fetch)...']);
    }, 1500);

    const stepTimer2 = setTimeout(() => {
      setGithubStep(3);
      setGithubLogs((prev) => [...prev, '[3/5] A sincronizar dependências (npm install --legacy-peer-deps)...']);
    }, 4500);

    const stepTimer3 = setTimeout(() => {
      setGithubStep(4);
      setGithubLogs((prev) => [...prev, '[4/5] A compilar nova versão (npm run build)...']);
    }, 9000);

    try {
      const response = await fetch('/api/admin/github-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      const data = await response.json();

      if (response.ok && data.success) {
        setGithubStep(5);
        setIsUpdatingGithub(false);
        const finalLogs = data.logs && data.logs.length > 0 ? data.logs : ['[✓] Atualização concluída com sucesso!'];
        setGithubLogs(finalLogs);

        const now = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
        const commitInfo = data.commit ? ` (${data.commit})` : '';
        setLastGithubUpdate(`Hoje às ${now}${commitInfo}`);
        setGithubStatus((prev) => ({
          ...prev,
          localCommit: data.commit,
          isUpToDate: true,
        }));
        onSyncOptDirectory();
        setAutoReloadCountdown(5);
      } else {
        setIsUpdatingGithub(false);
        const errMsg = data.error || 'Falha durante o processo de atualização via GitHub';
        setGithubError(errMsg);
        if (data.logs && data.logs.length > 0) {
          setGithubLogs(data.logs);
        } else {
          setGithubLogs((prev) => [...prev, `[ERRO] ${errMsg}`]);
        }
      }
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsUpdatingGithub(false);
      const errMsg = err.message || 'Erro de comunicação com o servidor';
      setGithubError(errMsg);
      setGithubLogs((prev) => [...prev, `[ERRO DE LIGAÇÃO] ${errMsg}`]);
    }
  };

  // Teste de Ping
  const handleTestPing = async () => {
    setPingStatus('testing');
    setPingError(null);
    setPingLatency(null);

    try {
      const res = await fetch('/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, port: Number(port) }),
      });
      const data = await res.json();
      if (res.ok && data.online) {
        setPingStatus('success');
        setPingLatency(data.latency ?? 1);
        setPingError(null);
      } else {
        setPingStatus('failed');
        setPingLatency(null);
        setPingError(data.error || `Host ${ip} inalcançável (Sem resposta ICMP Echo ou na porta ${port})`);
      }
    } catch (err: any) {
      setPingStatus('failed');
      setPingLatency(null);
      setPingError(`Erro de comunicação com o servidor: ${err.message}`);
    }
  };

  // Guardar configuração do PC atual
  const handleSaveNetworkConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAgentConfig({
      ipAddress: ip,
      targetMachine: targetName,
      targetUser: username,
      port: Number(port),
      connectionMethod: connMethod,
      pollingIntervalSeconds: Number(pollingInterval),
    });

    if (onSavePc) {
      await onSavePc({
        id: activePcId,
        nome: targetName,
        host: ip,
        target_user: username,
        connectionMethod: connMethod === 'ssh' ? 'ssh' : 'agent_poll',
        port: Number(port),
      }).catch(() => {});
    }
    setPingStatus('idle');
  };

  // Abrir modal para novo PC
  const handleOpenNewPcModal = () => {
    setEditingPcId(null);
    setFormPcName('');
    setFormPcHost('');
    setFormPcUser('');
    setFormPcMethod('agent_poll');
    setFormSshUser('admin');
    setFormSshPwd('');
    setFormSshKey('');
    setPcFormError(null);
    setIsPcModalOpen(true);
  };

  // Abrir modal para editar PC
  const handleOpenEditPcModal = (pc: PCConfig) => {
    setEditingPcId(pc.id);
    setFormPcName(pc.nome);
    setFormPcHost(pc.host);
    setFormPcUser(pc.target_user);
    setFormPcMethod(pc.connectionMethod || 'agent_poll');
    setFormSshUser(pc.ssh_user || 'admin');
    setFormSshPwd('');
    setFormSshKey(pc.ssh_key || '');
    setPcFormError(null);
    setIsPcModalOpen(true);
  };

  // Submeter formulário de PC
  const handleSubmitPc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPcName.trim() || !formPcHost.trim() || !formPcUser.trim()) {
      setPcFormError('Nome, IP/Host e Utilizador do Windows são obrigatórios.');
      return;
    }

    setIsSubmittingPc(true);
    setPcFormError(null);

    const pcPayload: Partial<PCConfig> = {
      id: editingPcId || undefined,
      nome: formPcName.trim(),
      host: formPcHost.trim(),
      target_user: formPcUser.trim(),
      connectionMethod: formPcMethod,
      ssh_user: formSshUser.trim(),
      ssh_password: formSshPwd || undefined,
      ssh_key: formSshKey.trim(),
    };

    try {
      if (onSavePc) {
        await onSavePc(pcPayload);
      } else {
        // Fallback direto à API caso o prop não tenha sido passado
        const res = await fetch('/api/pcs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pcPayload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Erro ao guardar computador no servidor');
        }
      }
      setIsPcModalOpen(false);
      setEditingPcId(null);
    } catch (err: any) {
      setPcFormError(err.message || 'Erro ao guardar computador');
    } finally {
      setIsSubmittingPc(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              Administração de Computadores & Sistema
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gira os computadores monitorizados, configure o protocolo de comunicação mais fiável (Agente HTTP) e mantenha o sistema atualizado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenNewPcModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Computador</span>
          </button>

          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-lg shadow-cyan-950 cursor-pointer"
          >
            <DownloadCloud className="h-4 w-4" />
            <span>Instalar Agente no PC</span>
          </button>
        </div>
      </div>

      {/* Protocol Architecture Insight Banner (Análise Pedida pelo Utilizador) */}
      <div className="rounded-xl border border-cyan-900/40 bg-gradient-to-r from-cyan-950/30 to-slate-900/60 p-5 space-y-3">
        <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm">
          <Zap className="h-4 w-4" />
          <span>Qual a melhor forma de controlar o PC? (Agente Cliente HTTP vs SSH)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <span className="font-semibold text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Porque o controlo por SSH falha tanto no Windows:
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              1. A <strong>Firewall do Windows</strong> bloqueia portas de entrada (22) por omissão.<br/>
              2. Com <strong>Wi-Fi e DHCP</strong>, o IP do PC do filho muda constantemente.<br/>
              3. O SSH corre na <strong>Sessão 0 (Serviço)</strong> isolada, não conseguindo ver a janela em primeiro plano nem abrir popups de aviso no ecrã do filho.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 space-y-1.5">
            <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> A Solução Mais Fiável: Agente Cliente Nativo (HTTP REST)
            </span>
            <p className="text-emerald-200/80 leading-relaxed text-[11px]">
              1. <strong>Conexão Inversa:</strong> É o PC do filho que contacta o servidor a cada 10s (a Firewall nunca bloqueia ligações de saída).<br/>
              2. <strong>Resistente a IPs Dinâmicos:</strong> O agente reporta sempre mesmo que o IP mude.<br/>
              3. <strong>Sessão Gráfica Real:</strong> Monitoriza janelas ativas, inatividade do rato e envia avisos no ecrã instantaneamente.
            </p>
          </div>
        </div>
      </div>

      {/* Multi-PC List Card */}
      <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Laptop className="h-5 w-5 text-cyan-400" />
            <h4 className="text-base font-bold text-white">Computadores Geridos (Multi-PC)</h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {pcsList.length} computador{pcsList.length !== 1 ? 'es' : ''} registado{pcsList.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {pcsList.map((pc) => {
            const isCurrent = pc.id === activePcId;
            return (
              <div
                key={pc.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-cyan-950/30 border-cyan-500/50 ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-950/20'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${isCurrent ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">{pc.nome}</h5>
                      <span className="text-[11px] text-slate-400 font-mono">{pc.host}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                    pc.isOnline
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {pc.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400 font-mono">
                  <div>Utilizador: <strong className="text-slate-200">{pc.target_user}</strong></div>
                  <div>Protocolo: <span className="text-cyan-300">{pc.connectionMethod === 'ssh' ? 'SSH Direto' : 'Agente Cliente HTTP (Recomendado)'}</span></div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  {onSelectPc && (
                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => onSelectPc(pc.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-default'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isCurrent ? 'PC Ativo' : 'Selecionar'}
                    </button>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditPcModal(pc)}
                      className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      title="Editar configurações deste PC"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    {pcsList.length > 1 && onDeletePc && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Remover o computador "${pc.nome}"?`)) {
                            onDeletePc(pc.id);
                          }
                        }}
                        className="p-1.5 rounded-md hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remover computador"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add PC dashed card button */}
          <button
            type="button"
            onClick={handleOpenNewPcModal}
            className="p-4 rounded-xl border border-dashed border-slate-700/80 hover:border-cyan-500/60 bg-slate-900/30 hover:bg-cyan-950/20 text-slate-400 hover:text-cyan-300 transition-all flex flex-col items-center justify-center gap-2 min-h-[140px] cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-cyan-500/20 text-cyan-400 transition-colors">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold">+ Adicionar Máquina</span>
            <span className="text-[10px] text-slate-500 text-center">Adicione um novo PC Windows à consola</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Network Form & Ping Probe */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Network className="h-4 w-4 text-cyan-400" />
                Configurações do PC Ativo ({targetName})
              </h4>
              <span className="text-xs font-mono text-slate-400">
                Alvo: {targetName}
              </span>
            </div>

            <form onSubmit={handleSaveNetworkConfig} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    IP local no router de casa.
                  </span>
                </div>

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
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900 text-white font-mono focus:outline-hidden focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Conta exata do Windows a monitorizar.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Método de Comunicação
                  </label>
                  <select
                    value={connMethod}
                    onChange={(e) => setConnMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900 text-white focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value="agent_poll">Agente Cliente HTTP (Recomendado / 100% Fiável)</option>
                    <option value="ssh">SSH Direto (OpenSSH Windows)</option>
                    <option value="winrm">PowerShell Remoting / WinRM</option>
                  </select>
                </div>
              </div>

              {/* Ping Connectivity Box */}
              <div className="rounded-lg bg-slate-950 p-3.5 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-300 font-medium">
                        Conectividade de Rede ({ip}):
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
                          Offline / Inalcançável
                        </span>
                      )}
                      {pingStatus === 'testing' && (
                        <span className="text-xs text-cyan-400 animate-pulse font-mono flex items-center gap-1.5">
                          <Activity className="h-3 w-3 animate-spin" />
                          A testar ICMP Echo & porta {port}...
                        </span>
                      )}
                      {pingStatus === 'idle' && (
                        <span className="text-xs text-slate-500">Não testado</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Sonda a rede real através do servidor Linux para testar se o computador está ligado.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestPing}
                    disabled={pingStatus === 'testing'}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    Testar Ping
                  </button>
                </div>

                {pingError && (
                  <div className="p-2 rounded bg-rose-950/40 border border-rose-500/40 text-[11px] text-rose-300 font-mono flex items-start gap-1.5 animate-in fade-in">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{pingError}</span>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  Guardar Configuração
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (5 cols): GitHub Live Updater & Clean Data */}
        <div className="lg:col-span-5 space-y-6">
          {/* GitHub Live Updater Card */}
          <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-cyan-400" />
                <h4 className="text-sm font-semibold text-white">
                  Atualização via GitHub
                </h4>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-medium ${
                githubStatus.isUpToDate
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                  : 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
              }`}>
                {githubStatus.localCommit ? `v:${githubStatus.localCommit}` : 'main branch'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Sincroniza o servidor diretamente com o repositório oficial <strong className="text-slate-200 font-mono">wsmigas/Control_PC</strong>.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={startGithubUpdate}
                disabled={isUpdatingGithub}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors shadow-lg shadow-cyan-950 cursor-pointer"
              >
                {isUpdatingGithub ? (
                  <>
                    <Activity className="h-4 w-4 animate-spin" />
                    <span>A sincronizar e a compilar...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Atualizar Site Agora</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(githubCliCommand, 'git-cli')}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
              >
                {copiedCmd === 'git-cli' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Comando CLI Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                    <span>Copiar Comando de Atualização Manual (Terminal)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Clean Agent Data Card */}
          {onResetAgentData && (
            <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-4 flex items-center justify-between gap-3">
              <div>
                <h5 className="text-xs font-semibold text-white">Repor Contadores a Zero</h5>
                <p className="text-[11px] text-slate-400">Limpa dados acumulados deste computador.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Limpar todos os contadores e dados deste PC?')) {
                    onResetAgentData();
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 transition-colors cursor-pointer"
              >
                Limpar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit PC Modal */}
      {isPcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-[#0E131F] p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Laptop className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  {editingPcId ? 'Editar Computador' : 'Adicionar Novo Computador'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPcModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPc} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Nome de Identificação</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: PC do Miguel ou Portátil da Maria"
                  value={formPcName}
                  onChange={(e) => setFormPcName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">IP Local / Hostname</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 192.168.1.120"
                    value={formPcHost}
                    onChange={(e) => setFormPcHost(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-cyan-300 font-mono focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Utilizador Windows</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: tomas ou PC\\filho"
                    value={formPcUser}
                    onChange={(e) => setFormPcUser(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white font-mono focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Método de Ligação</label>
                <select
                  value={formPcMethod}
                  onChange={(e) => setFormPcMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white focus:outline-hidden focus:border-cyan-500"
                >
                  <option value="agent_poll">Agente Cliente HTTP (Recomendado - 100% Fiável)</option>
                  <option value="ssh">SSH Remoto (Requer OpenSSH ativo no Windows)</option>
                </select>
              </div>

              {formPcMethod === 'ssh' && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-[11px]">
                  <span className="text-cyan-400 font-semibold block">Configurações de Acesso SSH:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400">Utilizador SSH:</span>
                      <input
                        type="text"
                        placeholder="admin"
                        value={formSshUser}
                        onChange={(e) => setFormSshUser(e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded border border-slate-800 bg-slate-900 text-white"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400">Palavra-passe:</span>
                      <input
                        type="password"
                        placeholder="opcional se usar chave"
                        value={formSshPwd}
                        onChange={(e) => setFormSshPwd(e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded border border-slate-800 bg-slate-900 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {pcFormError && (
                <div className="p-2 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                  {pcFormError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPcModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPc}
                  className="px-4 py-2 rounded-lg bg-cyan-400 text-black font-semibold hover:bg-cyan-300 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingPc ? (
                    <>
                      <Activity className="h-3.5 w-3.5 animate-spin text-black" />
                      <span>A guardar...</span>
                    </>
                  ) : (
                    <span>Guardar Computador</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real Windows Agent Installation Modal */}
      {isInstallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-xl border border-slate-800 bg-[#0E131F] p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <DownloadCloud className="h-5 w-5 text-cyan-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Instalação do Agente no PC Windows
                  </h3>
                  <p className="text-xs text-slate-400">
                    Computador Alvo: <strong className="text-white font-mono">{targetName}</strong> ({ip})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInstallModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Para ligar o computador de <strong>{username}</strong> sem falhas de rede, execute o comando de linha única abaixo no PowerShell do Windows com permissões de administrador:
              </p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Terminal className="h-4 w-4 text-cyan-400" />
                    Comando PowerShell de Administrador:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`irm ${installCmdUrl} | iex`, 'modal-ps')}
                    className="hover:text-cyan-300 text-slate-400 text-xs cursor-pointer"
                  >
                    {copiedCmd === 'modal-ps' ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 select-all overflow-x-auto">
                  irm {installCmdUrl} | iex
                </pre>
              </div>

              <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800 text-xs space-y-2 text-slate-300">
                <div className="font-semibold text-white">Vantagens deste método cliente:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Não precisa de abrir portas nem configurar OpenSSH no Windows</li>
                  <li>Resistente a alterações de IP causadas pelo router/DHCP ou Wi-Fi</li>
                  <li>Monitoriza com precisão o tempo ativo e permite enviar mensagens instantâneas</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsInstallModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Update Live Modal with Terminal Output */}
      {isGithubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-800 bg-[#0E131F] p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <GitBranch className="h-5 w-5 text-cyan-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Atualização via GitHub
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    https://github.com/wsmigas/Control_PC.git (branch main)
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isUpdatingGithub}
                onClick={() => setIsGithubModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Stepper Indicator */}
              <div className="grid grid-cols-5 gap-2">
                {[
                  { s: 1, label: 'Diretório' },
                  { s: 2, label: 'Git Sync' },
                  { s: 3, label: 'Deps' },
                  { s: 4, label: 'Build' },
                  { s: 5, label: 'Ativo' },
                ].map((step) => {
                  const isDone = githubStep > step.s || (githubStep === 5 && !githubError);
                  const isCurr = githubStep === step.s && isUpdatingGithub;
                  return (
                    <div
                      key={step.s}
                      className={`text-center py-1.5 px-1 rounded border text-[11px] font-mono transition-colors ${
                        isDone
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                          : isCurr
                          ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 ring-1 ring-cyan-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {step.s}. {step.label}
                    </div>
                  );
                })}
              </div>

              {/* Terminal Log Output */}
              <div className="rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-hidden shadow-inner">
                <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/80 border-b border-slate-800 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                    Consola de Atualização
                  </span>
                  <span>{isUpdatingGithub ? 'A executar...' : 'Concluído'}</span>
                </div>
                <div className="p-3.5 max-h-56 overflow-y-auto space-y-1 select-text scrollbar-thin">
                  {githubLogs.map((log, i) => (
                    <div
                      key={i}
                      className={
                        log.startsWith('[✓]') || log.includes('Sucesso')
                          ? 'text-emerald-400 font-semibold'
                          : log.startsWith('[ERRO]') || log.startsWith('[FALHA]') || log.startsWith('[STDERR]')
                          ? 'text-rose-400'
                          : log.startsWith('$')
                          ? 'text-cyan-400 font-bold'
                          : 'text-slate-300'
                      }
                    >
                      {log}
                    </div>
                  ))}
                  <div ref={terminalLogEndRef} />
                </div>
              </div>

              {/* Success Banner */}
              {githubStep === 5 && !githubError && (
                <div className="p-4 bg-emerald-950/50 border border-emerald-500/50 rounded-lg text-xs text-emerald-200 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                    <div>
                      <strong className="text-white text-sm">Painel atualizado com sucesso!</strong>
                      <p className="text-[11px] text-emerald-300/90 mt-0.5">
                        Ficheiros sincronizados e nova versão compilada a partir de <code className="text-white font-mono">wsmigas/Control_PC (main)</code>.
                      </p>
                    </div>
                  </div>
                  {autoReloadCountdown !== null && (
                    <div className="flex items-center justify-between pt-2 border-t border-emerald-500/30 text-[11px] text-emerald-300">
                      <span>
                        A recarregar página em <strong>{autoReloadCountdown}s</strong> para refletir todas as mudanças...
                      </span>
                      <button
                        type="button"
                        onClick={() => { window.location.href = window.location.origin + window.location.pathname + '?updated=' + Date.now(); }}
                        className="px-2.5 py-1 bg-emerald-400 text-black font-bold rounded text-xs hover:bg-emerald-300 transition-colors cursor-pointer"
                      >
                        Recarregar Agora (F5)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsGithubModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
              >
                Fechar
              </button>

              <div className="flex items-center gap-2">
                {githubError ? (
                  <button
                    type="button"
                    onClick={startGithubUpdate}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Tentar Novamente</span>
                  </button>
                ) : githubStep === 5 ? (
                  <button
                    type="button"
                    onClick={() => { window.location.href = window.location.origin + window.location.pathname + '?updated=' + Date.now(); }}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Recarregar Página (F5)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isUpdatingGithub}
                    onClick={startGithubUpdate}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    {isUpdatingGithub ? (
                      <>
                        <Activity className="h-4 w-4 animate-spin" />
                        <span>A Processar...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>Iniciar Atualização</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
