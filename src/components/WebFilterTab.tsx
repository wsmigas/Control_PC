import React, { useState } from 'react';
import {
  Globe,
  Plus,
  Trash2,
  Check,
  Copy,
  Shield,
  ShieldAlert,
  FileCode,
  ExternalLink,
  Sparkles,
  Layers
} from 'lucide-react';
import { BlockedDomain } from '../types';
import { generateHostsBlock } from '../data/mockData';

interface WebFilterTabProps {
  domains: BlockedDomain[];
  onToggleDomain: (domainId: string) => void;
  onDeleteDomain: (domainId: string) => void;
  onAddDomain: (domain: string, category: string, isWildcard?: boolean) => void;
  onAddDomains?: (items: { domain: string; category: string; isWildcard?: boolean }[]) => void;
}

export const WebFilterTab: React.FC<WebFilterTabProps> = ({
  domains,
  onToggleDomain,
  onDeleteDomain,
  onAddDomain,
  onAddDomains,
}) => {
  const [newDomain, setNewDomain] = useState('');
  const [newCategory, setNewCategory] = useState('Redes Sociais');
  const [includeWildcard, setIncludeWildcard] = useState(false);
  const [copied, setCopied] = useState(false);

  const YT_PRESET = [
    '*.youtube.com',
    'youtube.com',
    'm.youtube.com',
    'music.youtube.com',
    'studio.youtube.com',
    'youtu.be',
    'youtube-nocookie.com',
    'youtubei.googleapis.com',
    '*.ytimg.com',
    '*.googlevideo.com',
  ];

  const TIKTOK_PRESET = [
    'tiktok.com',
    '*.tiktok.com',
    'm.tiktok.com',
    'v16.tiktokcdn.com',
    'byteoversea.com',
  ];

  const ROBLOX_PRESET = [
    'roblox.com',
    '*.roblox.com',
    'web.roblox.com',
    'api.roblox.com',
  ];

  const SOCIAL_PRESET = [
    'instagram.com',
    '*.instagram.com',
    'facebook.com',
    '*.facebook.com',
    'threads.net',
  ];

  const hostsBlock = generateHostsBlock(domains);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    let clean = newDomain
      .trim()
      .replace(/^https?:\/\//i, '')
      .split('/')[0]
      .split('?')[0];

    const isWild = includeWildcard || clean.startsWith('*.');
    if (isWild && !clean.startsWith('*.')) {
      clean = `*.${clean.replace(/^www\./i, '')}`;
    }

    onAddDomain(clean, newCategory, isWild);
    setNewDomain('');
    setIncludeWildcard(false);
  };

  const handleAddPreset = (presetList: string[], category: string) => {
    const toAdd = presetList
      .filter((dom) => !domains.some((d) => d.domain.toLowerCase() === dom.toLowerCase()))
      .map((dom) => ({
        domain: dom,
        category,
        isWildcard: dom.startsWith('*.'),
      }));

    if (toAdd.length === 0) return;

    if (onAddDomains) {
      onAddDomains(toAdd);
    } else {
      toAdd.forEach((item) => {
        onAddDomain(item.domain, item.category, item.isWildcard);
      });
    }
  };

  const handleCopyHosts = () => {
    navigator.clipboard.writeText(hostsBlock);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeCount = domains.filter((d) => d.active).length;
  const totalHits = domains.reduce((acc, curr) => acc + curr.hitsToday, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0E131F]">
          <span className="text-xs text-slate-400">Domínios Registados</span>
          <p className="font-mono text-xl font-bold text-white tabular-nums mt-0.5">
            {domains.length}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0E131F]">
          <span className="text-xs text-slate-400">Bloqueios Ativos no Hosts & DNS</span>
          <p className="font-mono text-xl font-bold text-cyan-400 tabular-nums mt-0.5">
            {activeCount}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0E131F]">
          <span className="text-xs text-slate-400">Tentativas Travadas Hoje</span>
          <p className="font-mono text-xl font-bold text-rose-400 tabular-nums mt-0.5">
            {totalHits}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Domain List & Add Form */}
        <div className="lg:col-span-7 space-y-4">
          {/* Add form */}
          <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Bloquear Sites no Computador
              </h4>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddPreset(YT_PRESET, 'Vídeo & Streaming')}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 transition-colors cursor-pointer"
                  title="Bloquear todos os endereços do YouTube"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>+ YouTube</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPreset(TIKTOK_PRESET, 'Redes Sociais')}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-pink-950/60 hover:bg-pink-900 border border-pink-500/40 text-pink-300 transition-colors cursor-pointer"
                  title="Bloquear TikTok"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>+ TikTok</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPreset(ROBLOX_PRESET, 'Jogos / Servidores')}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-300 transition-colors cursor-pointer"
                  title="Bloquear Roblox"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>+ Roblox</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPreset(SOCIAL_PRESET, 'Redes Sociais')}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-300 transition-colors cursor-pointer"
                  title="Bloquear Instagram e Facebook"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>+ Redes Sociais</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleAdd} className="space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Ex: youtube.com, tiktok.com, roblox.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900 text-white placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 font-mono"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900 text-slate-300 focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                >
                  <option value="Redes Sociais">Redes Sociais</option>
                  <option value="Vídeo & Streaming">Vídeo & Streaming</option>
                  <option value="Jogos / Servidores">Jogos / Servidores</option>
                  <option value="Apostas / Azar">Apostas / Azar</option>
                  <option value="Conteúdo Adulto">Conteúdo Adulto</option>
                  <option value="Outros">Outros</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Bloquear</span>
                </button>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeWildcard}
                  onChange={(e) => setIncludeWildcard(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                />
                <span>Incluir também todos os subdomínios (ex: <code>*.youtube.com</code> via regra NRPT DNS)</span>
              </label>
            </form>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-slate-800 bg-[#0E131F] overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Domínio</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {domains.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-white flex items-center gap-1.5">
                      <span>{d.domain}</span>
                      {d.domain.startsWith('*.') && (
                        <span className="text-[10px] bg-cyan-950 border border-cyan-500/30 text-cyan-400 px-1.5 py-0.5 rounded font-sans">
                          todos os subdomínios
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {d.category}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onToggleDomain(d.id)}
                        className={`text-xs px-2.5 py-1 rounded border font-medium transition-colors cursor-pointer ${
                          d.active
                            ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {d.active ? 'Ativo (Bloqueado)' : 'Pausado'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteDomain(d.id)}
                        className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Remover regra"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (5 cols): Windows Hosts File Preview & Script Sync */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0E131F] p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h4 className="text-base font-semibold text-white flex items-center gap-2">
                <FileCode className="h-4 w-4 text-cyan-400" />
                Ficheiro Hosts & DNS do Windows
              </h4>
              <p className="text-xs text-slate-400">
                Injetado em <code className="text-slate-300">C:\Windows\System32\drivers\etc\hosts</code>
              </p>
            </div>
            <button
              onClick={handleCopyHosts}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copiar Bloco</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            O agente Windows injeta estes registos para <code className="text-slate-300 font-mono">0.0.0.0</code> e, para domínios com subdomínios (<code className="text-slate-300 font-mono">*.</code>), aplica regras NRPT no cliente de DNS nativo do Windows:
          </p>

          <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300/90 overflow-x-auto max-h-72 leading-relaxed select-all">
            {hostsBlock}
          </pre>

          <div className="rounded-lg bg-cyan-950/30 p-3 border border-cyan-800/40 text-[11px] text-cyan-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-cyan-400" />
                Sincronização Automática em Tempo Real:
              </span>
              <button
                type="button"
                onClick={() => {
                  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:3000';
                  navigator.clipboard.writeText(`irm ${origin}/api/agent/limpar-hosts.ps1 | iex`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-300 border border-cyan-700/50 cursor-pointer flex items-center gap-1"
                title="Copiar comando para sincronizar imediatamente no Windows"
              >
                <Copy className="h-2.5 w-2.5" />
                <span>Copiar Comando PowerShell</span>
              </button>
            </div>
            <p className="text-slate-400 leading-relaxed">
              O agente <code>vigia.ps1</code> sincroniza e limpa automaticamente o ficheiro hosts a cada 3 segundos. Se acabou de apagar um site e quer purgar a cache do Windows de imediato no PowerShell Alvo:
            </p>
            <div className="p-2 rounded bg-black/60 font-mono text-[11px] text-amber-300 border border-slate-800 break-all select-all">
              irm {typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:3000'}/api/agent/limpar-hosts.ps1 | iex
            </div>
          </div>

          <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Como funciona o bloqueio:</span>
            O redirecionamento para 0.0.0.0 funciona em todos os browsers (Chrome, Edge, Firefox) e aplicações desktop. Quando remove um site dos filtros, o agente retira a regra do ficheiro hosts e executa <code>ipconfig /flushdns</code> para restaurar o acesso de imediato.
          </div>
        </div>
      </div>
    </div>
  );
};
