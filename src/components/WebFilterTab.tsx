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
  ExternalLink
} from 'lucide-react';
import { BlockedDomain } from '../types';
import { generateHostsBlock } from '../data/mockData';

interface WebFilterTabProps {
  domains: BlockedDomain[];
  onToggleDomain: (domainId: string) => void;
  onDeleteDomain: (domainId: string) => void;
  onAddDomain: (domain: string, category: string) => void;
}

export const WebFilterTab: React.FC<WebFilterTabProps> = ({
  domains,
  onToggleDomain,
  onDeleteDomain,
  onAddDomain,
}) => {
  const [newDomain, setNewDomain] = useState('');
  const [newCategory, setNewCategory] = useState('Redes Sociais');
  const [copied, setCopied] = useState(false);

  const hostsBlock = generateHostsBlock(domains);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    // Clean up domain (remove https://, http://, www.)
    const clean = newDomain
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0];

    onAddDomain(clean, newCategory);
    setNewDomain('');
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
          <span className="text-xs text-slate-400">Bloqueios Ativos no Hosts</span>
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
          <div className="rounded-xl border border-slate-800 bg-[#0E131F] p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Adicionar Domínio à Lista de Bloqueio
            </h4>
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Ex: roblox.com, tiktok.com, discord.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900 text-white placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 font-mono"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-900 text-slate-300 focus:outline-hidden focus:border-cyan-500"
              >
                <option value="Redes Sociais">Redes Sociais</option>
                <option value="Jogos / Servidores">Jogos / Servidores</option>
                <option value="Apostas / Azar">Apostas / Azar</option>
                <option value="Conteúdo Adulto">Conteúdo Adulto</option>
                <option value="Outros">Outros</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Bloquear</span>
              </button>
            </form>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-slate-800 bg-[#0E131F] overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Domínio</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Tentativas</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {domains.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      {d.domain}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {d.category}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-300">
                      {d.hitsToday}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onToggleDomain(d.id)}
                        className={`text-xs px-2.5 py-1 rounded border font-medium transition-colors ${
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
                        className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
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
                Ficheiro Hosts do Windows
              </h4>
              <p className="text-xs text-slate-400">
                Injetado em <code className="text-slate-300">C:\Windows\System32\drivers\etc\hosts</code>
              </p>
            </div>
            <button
              onClick={handleCopyHosts}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
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
            No patch <code className="text-slate-300 font-mono">painel_pc.py</code>, a função <code className="text-slate-300 font-mono">script_hosts(bloco, wild)</code> envia estes registos fragmentados através de <code className="text-slate-300 font-mono">blob("bB", bloco)</code> para contornar limitações de tamanho de linha do PowerShell:
          </p>

          {/* Code preview */}
          <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300/90 overflow-x-auto max-h-72 leading-relaxed">
            {hostsBlock}
          </pre>

          <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Vantagem do Bloqueio por Hosts:</span>
            O redirecionamento para <code className="text-slate-200">0.0.0.0</code> opera a nível de sistema operacional (Kernel/Winsock), bloqueando os domínios em todos os navegadores (Chrome, Edge, Firefox), jogos e aplicações desktop, sem possibilidade de desativação por extensões.
          </div>
        </div>
      </div>
    </div>
  );
};
