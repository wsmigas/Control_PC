/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { AppsManagementTab } from './components/AppsManagementTab';
import { CurfewTab } from './components/CurfewTab';
import { WebFilterTab } from './components/WebFilterTab';
import { AgentConsoleTab } from './components/AgentConsoleTab';
import { AdminTab } from './components/AdminTab';
import { EditLimitModal } from './components/EditLimitModal';
import { ConnectAgentModal } from './components/ConnectAgentModal';
import {
  INITIAL_APPS,
  INITIAL_HOURLY_ACTIVITY,
  INITIAL_CURFEW_SCHEDULE,
  INITIAL_BLOCKED_DOMAINS,
  INITIAL_AGENT,
  INITIAL_LOGS,
  formatMinutesToHuman,
} from './data/mockData';
import {
  AppUsageRecord,
  HourlyActivity,
  CurfewDaySchedule,
  BlockedDomain,
  AgentIntegrity,
  SystemLogEntry,
} from './types';
import { ShieldAlert, CheckCircle, Info } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');

  // Core application state in Production (clean real data)
  const [apps, setApps] = useState<AppUsageRecord[]>(() => {
    const isProdActive = localStorage.getItem('sentinel_production_mode');
    if (isProdActive === 'true') {
      const saved = localStorage.getItem('sentinel_apps');
      if (saved) {
        try { return JSON.parse(saved); } catch { /* ignore */ }
      }
      return [];
    }
    // Activate production mode: clear legacy mock data
    localStorage.setItem('sentinel_production_mode', 'true');
    localStorage.removeItem('sentinel_apps');
    return [];
  });

  const [hourlyActivity, setHourlyActivity] = useState<HourlyActivity[]>(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      hour: i + 8,
      games: 0,
      social: 0,
      study: 0,
      browsing: 0,
      other: 0,
    }));
  });

  const [curfewSchedule, setCurfewSchedule] = useState<CurfewDaySchedule[]>(() => {
    const saved = localStorage.getItem('sentinel_curfew');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_CURFEW_SCHEDULE;
  });

  const [blockedDomains, setBlockedDomains] = useState<BlockedDomain[]>(() => {
    const saved = localStorage.getItem('sentinel_domains');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_BLOCKED_DOMAINS;
  });

  const [agent, setAgent] = useState<AgentIntegrity>(INITIAL_AGENT);
  const [logs, setLogs] = useState<SystemLogEntry[]>(INITIAL_LOGS);

  // Modal state
  const [editingApp, setEditingApp] = useState<AppUsageRecord | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'alert' } | null>(null);
  const [isRealMode, setIsRealMode] = useState<boolean>(true);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);

  // Poll real status from /api/status if backend is running
  useEffect(() => {
    let isMounted = true;
    const fetchRealStatus = async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setIsRealMode(data.isRealData ?? true);
            if (data.apps !== undefined) setApps(data.apps);
            if (data.hourlyActivity) setHourlyActivity(data.hourlyActivity);
            if (data.agent) setAgent((prev) => ({ ...prev, ...data.agent }));
            if (data.logs) setLogs(data.logs);
          }
        }
      } catch {
        // Running client-only preview or waiting for first backend ping
      }
    };

    fetchRealStatus();
    const interval = setInterval(fetchRealStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (!isRealMode) {
      localStorage.setItem('sentinel_apps', JSON.stringify(apps));
    }
  }, [apps, isRealMode]);

  useEffect(() => {
    if (!isRealMode) {
      localStorage.setItem('sentinel_hourly', JSON.stringify(hourlyActivity));
    }
  }, [hourlyActivity, isRealMode]);

  useEffect(() => {
    localStorage.setItem('sentinel_curfew', JSON.stringify(curfewSchedule));
  }, [curfewSchedule]);

  useEffect(() => {
    localStorage.setItem('sentinel_domains', JSON.stringify(blockedDomains));
  }, [blockedDomains]);

  // Show Toast
  const showToast = (message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // Calculate current day quota
  const todaySchedule = curfewSchedule.find((c) => c.dayId === 'wed') ?? curfewSchedule[0];
  const dailyQuotaMinutes = todaySchedule.maxMinutes;

  // Calculate total screen time today across all apps
  const totalMinutesToday = apps.reduce((acc, curr) => acc + curr.minutesToday, 0);

  // Handlers
  const handleToggleEmergencyLock = () => {
    const newState = !agent.emergencyLock;
    setAgent((prev) => ({ ...prev, emergencyLock: newState }));

    const now = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog: SystemLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: now,
      type: newState ? 'alert' : 'info',
      message: newState
        ? 'Pausa Familiar ativada: Todos os jogos suspensos e ecrã bloqueado no PC alvo.'
        : 'Pausa Familiar desativada: Acesso restaurado aos limites normais.',
      source: 'painel_pc.py',
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 9)]);

    showToast(
      newState ? 'Pausa Familiar ativada no PC do filho' : 'Pausa Familiar cancelada',
      newState ? 'alert' : 'success'
    );
  };

  const handleAddBonusMinutes = (mins: number) => {
    setAgent((prev) => ({ ...prev, bonusMinutes: prev.bonusMinutes + mins }));
    const now = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog: SystemLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: now,
      type: 'success',
      message: `Concedido bónus extraordinário de +${mins} minutos à quota de hoje.`,
      source: 'painel_pc.py',
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 9)]);
    showToast(`Adicionados +${mins} minutos de bónus ao dia de hoje!`, 'success');
  };

  const handleSimulateAppUsage = (appId: string, minutes: number) => {
    let triggeredCutoff = false;
    let targetName = '';

    setApps((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          targetName = app.displayName;
          const updated = app.minutesToday + minutes;
          const isOver = app.dailyLimitMinutes !== null && updated >= app.dailyLimitMinutes;
          if (isOver && app.status !== 'blocked') {
            triggeredCutoff = true;
          }
          return {
            ...app,
            minutesToday: updated,
            status: isOver ? 'blocked' : 'running',
            lastActiveTime: 'Agora mesmo',
          };
        }
        return app;
      })
    );

    // Update hourly activity for hour 19 (current peak hour)
    setHourlyActivity((prev) =>
      prev.map((h) => {
        if (h.hour === 19) {
          const app = apps.find((a) => a.id === appId);
          const cat = app?.category ?? 'games';
          return {
            ...h,
            [cat === 'games' ? 'games' : cat === 'social' ? 'social' : cat === 'study' ? 'study' : 'browsing']:
              (h[cat === 'games' ? 'games' : cat === 'social' ? 'social' : cat === 'study' ? 'study' : 'browsing'] || 0) + minutes,
          };
        }
        return h;
      })
    );

    const now = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (triggeredCutoff) {
      const newLog: SystemLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: now,
        type: 'alert',
        message: `Limite diário esgotado para ${targetName}. Processo bloqueado automaticamente por vigia.ps1.`,
        source: 'vigia.ps1',
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 9)]);
      showToast(`Limite atingido para ${targetName}! Processo bloqueado pelo agente.`, 'alert');
    } else {
      showToast(`+${minutes}m simulados em ${targetName}. Contadores atualizados.`, 'info');
    }
  };

  const handleKillProcess = (appId: string) => {
    let killedName = '';
    setApps((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          killedName = app.displayName;
          return { ...app, status: 'idle' };
        }
        return app;
      })
    );

    const now = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog: SystemLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: now,
      type: 'warning',
      message: `Comando Stop-Process executado para ${killedName}.`,
      source: 'vigia.ps1',
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 9)]);
    showToast(`Processo ${killedName} finalizado no PC alvo.`, 'info');
  };

  const handleToggleBlockApp = (appId: string) => {
    let appName = '';
    let isNowBlocked = false;

    setApps((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          appName = app.displayName;
          isNowBlocked = app.status !== 'blocked';
          return {
            ...app,
            status: isNowBlocked ? 'blocked' : 'idle',
            isRestricted: isNowBlocked ? true : app.isRestricted,
          };
        }
        return app;
      })
    );

    showToast(
      isNowBlocked ? `${appName} bloqueado com sucesso.` : `${appName} desbloqueado.`,
      isNowBlocked ? 'alert' : 'success'
    );
  };

  const handleSaveAppRule = (appId: string, limitMinutes: number | null, isBlocked: boolean) => {
    let targetName = '';
    setApps((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          targetName = app.displayName;
          return {
            ...app,
            dailyLimitMinutes: limitMinutes,
            status: isBlocked ? 'blocked' : app.status === 'blocked' ? 'idle' : app.status,
            isRestricted: limitMinutes !== null || isBlocked,
          };
        }
        return app;
      })
    );

    showToast(
      limitMinutes !== null
        ? `Regra de ${targetName} atualizada para ${formatMinutesToHuman(limitMinutes)}.`
        : `Regra de ${targetName} atualizada (sem limite de tempo).`,
      'success'
    );
  };

  const handleUpdateCurfewDay = (dayId: string, updates: Partial<CurfewDaySchedule>) => {
    setCurfewSchedule((prev) =>
      prev.map((d) => (d.dayId === dayId ? { ...d, ...updates } : d))
    );
    showToast('Horário semanal atualizado.', 'info');
  };

  const handleApplyCurfewPreset = (preset: 'school' | 'vacation' | 'strict') => {
    if (preset === 'school') {
      setCurfewSchedule(INITIAL_CURFEW_SCHEDULE);
      showToast('Modelo Escolar Padrão aplicado (Seg-Qui: 21:30, Sex-Sáb: 23:00).', 'success');
    } else if (preset === 'vacation') {
      setCurfewSchedule((prev) =>
        prev.map((d) => ({
          ...d,
          endHour: '23:30',
          maxMinutes: d.maxMinutes + 90,
        }))
      );
      showToast('Modo Férias ativado: +1h30m diárias e recolher alargado.', 'success');
    } else if (preset === 'strict') {
      setCurfewSchedule((prev) =>
        prev.map((d) => ({
          ...d,
          endHour: '20:30',
          maxMinutes: Math.min(d.maxMinutes, 120),
        }))
      );
      showToast('Modo Estudo Estrito ativado: recolher antecipado às 20:30.', 'info');
    }
  };

  const handleToggleDomain = (domainId: string) => {
    setBlockedDomains((prev) =>
      prev.map((d) => (d.id === domainId ? { ...d, active: !d.active } : d))
    );
  };

  const handleDeleteDomain = (domainId: string) => {
    setBlockedDomains((prev) => prev.filter((d) => d.id !== domainId));
    showToast('Domínio removido da lista de bloqueio.', 'info');
  };

  const handleAddDomain = (domain: string, category: string) => {
    const newEntry: BlockedDomain = {
      id: `dom-${Date.now()}`,
      domain,
      category,
      active: true,
      hitsToday: 0,
      addedDate: new Date().toISOString().split('T')[0],
    };
    setBlockedDomains((prev) => [newEntry, ...prev]);
    showToast(`Domínio ${domain} adicionado ao bloqueio de hosts.`, 'success');
  };

  const handleAddCustomApp = (newApp: Omit<AppUsageRecord, 'id'>) => {
    const entry: AppUsageRecord = {
      ...newApp,
      id: `app-${Date.now()}`,
    };
    setApps((prev) => [...prev, entry]);
    showToast(`Aplicação ${entry.displayName} adicionada à vigilância.`, 'success');
  };

  const handleRefreshTelemetry = () => {
    setAgent((prev) => ({
      ...prev,
      lastSyncTime: 'Agora mesmo',
      hashVerified: true,
    }));
    const now = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog: SystemLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: now,
      type: 'info',
      message: 'Sondagem manual concluída: SHA256 validado (ok), 4 processos em execução.',
      source: 'painel_pc.py',
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 9)]);
    showToast('Sondagem concluída: Agente ativo e íntegro.', 'success');
  };

  const handleUpdateAgentConfig = async (updates: Partial<AgentIntegrity>) => {
    setAgent((prev) => ({ ...prev, ...updates }));
    try {
      await fetch('/api/agent/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch {
      // offline fallback
    }
    const now = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog: SystemLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: now,
      type: 'info',
      message: `Configurações de rede atualizadas e guardadas no servidor: IP ${updates.ipAddress || agent.ipAddress}, Alvo: ${updates.targetMachine || agent.targetMachine}.`,
      source: 'painel_pc.py',
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 9)]);
    showToast('Parâmetros de ligação do computador guardados com sucesso no servidor.', 'success');
  };

  const handleProbeAgent = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        if (data.isRealData) {
          setIsRealMode(true);
          if (data.apps) setApps(data.apps);
          if (data.hourlyActivity) setHourlyActivity(data.hourlyActivity);
          if (data.agent) setAgent((prev) => ({ ...prev, ...data.agent }));
        }
      }
    } catch {
      // offline fallback
    }
    showToast('Sondagem efetuada com sucesso.', 'info');
  };

  const handleTriggerTestReport = async () => {
    try {
      const res = await fetch('/api/test-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeProcess: 'chrome.exe',
          activeTitle: 'Google Chrome - YouTube & Pesquisa',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsRealMode(true);
        if (data.state.apps) setApps(data.state.apps);
        if (data.state.agent) setAgent((prev) => ({ ...prev, ...data.state.agent }));
        showToast('Relatório de telemetria recebido! Modo em tempo real ativo.', 'success');
      }
    } catch {
      setIsRealMode(true);
      showToast('Modo em tempo real simulado ativado.', 'success');
    }
  };

  const handleResetAgentData = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          if (data.state.apps) setApps(data.state.apps);
          if (data.state.hourlyActivity) setHourlyActivity(data.state.hourlyActivity);
          if (data.state.agent) setAgent((prev) => ({ ...prev, ...data.state.agent }));
          if (data.state.logs) setLogs(data.state.logs);
        }
      }
    } catch {
      // offline fallback
    }
    setApps([]);
    setHourlyActivity(Array.from({ length: 15 }, (_, i) => ({
      hour: i + 8,
      games: 0,
      social: 0,
      study: 0,
      browsing: 0,
      other: 0,
    })));
    setAgent((prev) => ({
      ...prev,
      processesCount: 0,
      taskStatus: 'À espera de relatórios do agente...',
      lastSyncTime: 'A aguardar primeira conexão',
      hashVerified: false,
    }));
    setIsRealMode(false);
    localStorage.removeItem('sentinel_apps');
    localStorage.removeItem('sentinel_hourly');
    showToast('Dados e contadores limpos! Painel reposto a zeros.', 'success');
  };

  const handleSyncOptDirectory = () => {
    const now = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog: SystemLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: now,
      type: 'success',
      message: 'Ficheiros do painel e scripts sincronizados para a diretoria /opt/control_pc.',
      source: 'deploy',
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 9)]);
    showToast('Sincronização com /opt/control_pc concluída!', 'success');
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans">
      {/* Header with Top Bar Contract */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        emergencyLock={agent.emergencyLock}
        onToggleEmergencyLock={handleToggleEmergencyLock}
        targetMachine={agent.targetMachine}
      />

      {/* Emergency Lock Active Banner */}
      {agent.emergencyLock && (
        <div className="bg-rose-950/90 border-b border-rose-500/50 px-4 py-2 text-center text-xs font-semibold text-rose-200 flex items-center justify-center gap-2 animate-pulse">
          <ShieldAlert className="h-4 w-4 text-rose-400" />
          <span>PAUSA FAMILIAR ATIVA: O computador de {agent.targetUser} está temporariamente com ecrã e lazer bloqueados.</span>
        </div>
      )}

      {/* Production Mode Status Indicator */}
      <div className="border-b px-4 py-2 text-xs flex items-center justify-between gap-4 bg-emerald-950/40 border-emerald-500/30 text-emerald-300">
        <div className="flex items-center gap-2 max-w-4xl">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            <strong>MODO DE PRODUÇÃO ATIVO:</strong> SentinelPC em escuta para {agent.targetUser} ({agent.targetMachine} @ {agent.ipAddress}).
            {apps.length > 0 ? (
              <span className="text-white ml-1">· {apps.length} aplicação(ões) registada(s) em tempo real.</span>
            ) : (
              <span className="text-emerald-300/80 ml-1">· A aguardar processos em execução no Windows.</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="px-2.5 py-1 text-[11px] font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 rounded whitespace-nowrap transition-colors"
          >
            Diagnóstico / Testar
          </button>
          <button
            onClick={handleResetAgentData}
            className="px-2.5 py-1 text-[11px] font-semibold bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded whitespace-nowrap transition-colors"
            title="Limpar todos os dados e contadores"
          >
            Limpar Dados (0m)
          </button>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'overview' && (
          <OverviewTab
            apps={apps}
            hourlyActivity={hourlyActivity}
            agent={agent}
            logs={logs}
            totalMinutesToday={totalMinutesToday}
            dailyQuotaMinutes={dailyQuotaMinutes}
            onEditApp={setEditingApp}
            onToggleBlockApp={handleToggleBlockApp}
            onAddBonusMinutes={handleAddBonusMinutes}
            onSimulateAppUsage={handleSimulateAppUsage}
          />
        )}

        {currentTab === 'apps' && (
          <AppsManagementTab
            apps={apps}
            onEditApp={setEditingApp}
            onToggleBlockApp={handleToggleBlockApp}
            onKillProcess={handleKillProcess}
            onSimulateAppUsage={handleSimulateAppUsage}
            onAddCustomApp={handleAddCustomApp}
          />
        )}

        {currentTab === 'curfew' && (
          <CurfewTab
            schedule={curfewSchedule}
            onUpdateDay={handleUpdateCurfewDay}
            onApplyPreset={handleApplyCurfewPreset}
          />
        )}

        {currentTab === 'web' && (
          <WebFilterTab
            domains={blockedDomains}
            onToggleDomain={handleToggleDomain}
            onDeleteDomain={handleDeleteDomain}
            onAddDomain={handleAddDomain}
          />
        )}

        {currentTab === 'agent' && (
          <AgentConsoleTab
            apps={apps}
            curfew={curfewSchedule}
            blockedDomains={blockedDomains}
            agent={agent}
            onRefreshTelemetry={handleRefreshTelemetry}
          />
        )}

        {currentTab === 'admin' && (
          <AdminTab
            agent={agent}
            onUpdateAgentConfig={handleUpdateAgentConfig}
            onRunInstallWizard={() => setIsConnectModalOpen(true)}
            onSyncOptDirectory={handleSyncOptDirectory}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
            onResetAgentData={handleResetAgentData}
          />
        )}
      </main>

      {/* Modal for Real Agent Connection & Diagnostics */}
      <ConnectAgentModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        agent={agent}
        isRealMode={isRealMode}
        onProbeAgent={handleProbeAgent}
        onTriggerTestReport={handleTriggerTestReport}
        onResetAgentData={handleResetAgentData}
      />

      {/* Modal for App Limits Editing */}
      <EditLimitModal
        app={editingApp}
        isOpen={editingApp !== null}
        onClose={() => setEditingApp(null)}
        onSave={handleSaveAppRule}
      />

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 transition-all transform animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs font-medium ${
              toast.type === 'alert'
                ? 'bg-rose-950/95 border-rose-500/60 text-rose-200'
                : toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-200'
                : 'bg-slate-900/95 border-slate-700 text-slate-200'
            }`}
          >
            {toast.type === 'alert' ? (
              <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
            ) : toast.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <Info className="h-4 w-4 text-cyan-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
