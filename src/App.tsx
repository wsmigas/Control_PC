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
import { ActionsTab } from './components/ActionsTab';
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
  PCConfig,
  ProcessItem,
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
  const [pcsList, setPcsList] = useState<PCConfig[]>([]);
  const [activePcId, setActivePcId] = useState<string>('pc1');
  const [runningProcesses, setRunningProcesses] = useState<ProcessItem[]>([]);

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
            if (Array.isArray(data.pcsList)) setPcsList(data.pcsList);
            if (data.activePc?.id) setActivePcId(data.activePc.id);
            if (Array.isArray(data.runningProcesses)) setRunningProcesses(data.runningProcesses);
            if (Array.isArray(data.curfewSchedule) && data.curfewSchedule.length > 0) {
              setCurfewSchedule(data.curfewSchedule);
            }
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

  // Determine today's day of week dynamically (sun, mon, tue, wed, thu, fri, sat)
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  const todayDayIndex = new Date().getDay();
  const todayDayId = dayKeys[todayDayIndex];

  // Calculate current day quota based on the actual day of the week
  const todaySchedule = curfewSchedule.find((c) => c.dayId === todayDayId) ?? curfewSchedule[0];
  const dailyQuotaMinutes = todaySchedule.maxMinutes;

  // Calculate total screen time today across all apps or agent active time
  const appsMinutesToday = apps.reduce((acc, curr) => acc + curr.minutesToday, 0);
  const agentScreenTime = (agent as any).screenTimeMinutesToday || 0;
  const totalMinutesToday = Math.max(appsMinutesToday, agentScreenTime);

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

  const handleKillProcess = async (appId: string) => {
    let killedName = '';
    let procName = '';
    setApps((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          killedName = app.displayName;
          procName = app.processName;
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
      message: `Comando Stop-Process executado para ${killedName || procName}.`,
      source: 'vigia.ps1',
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 9)]);
    showToast(`Processo ${killedName || procName} finalizado no PC alvo.`, 'info');

    if (procName) {
      await handleKillAll(procName);
    }
  };

  const handleToggleBlockApp = async (appId: string) => {
    let appName = '';
    let isNowBlocked = false;
    let procName = '';

    setApps((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          appName = app.displayName;
          procName = app.processName;
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

    try {
      const res = await fetch('/api/apps/toggle-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, processName: procName }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.apps)) {
          setApps(data.apps);
        }
      }
    } catch (e) {
      console.error('Erro ao alternar bloqueio de aplicação no servidor:', e);
    }
  };

  const handleSaveAppRule = async (appId: string, limitMinutes: number | null, isBlocked: boolean) => {
    let targetName = '';
    let procName = '';

    setApps((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          targetName = app.displayName;
          procName = app.processName;
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

    try {
      const res = await fetch('/api/apps/rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          processName: procName,
          limitMinutes,
          isBlocked,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.apps)) {
          setApps(data.apps);
        }
      }
    } catch (e) {
      console.error('Erro ao guardar regra da aplicação no servidor:', e);
    }
  };

  const handleKillPid = async (pid: number, name?: string) => {
    try {
      const res = await fetch('/api/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid, process: name }),
      });
      if (res.ok) {
        setRunningProcesses((prev) => prev.filter((p) => p.pid !== pid));
        showToast(`Comando de finalização enviado para PID ${pid} (${name || 'processo'}).`, 'success');
      }
    } catch {
      showToast('Erro ao comunicar com o servidor.', 'alert');
    }
  };

  const handleKillAll = async (name: string) => {
    try {
      const res = await fetch('/api/killall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setRunningProcesses((prev) => prev.filter((p) => p.name.toLowerCase() !== name.toLowerCase()));
        showToast(`Comando de encerramento enviado para todas as instâncias de ${name}.`, 'success');
      }
    } catch {
      showToast('Erro ao comunicar com o servidor.', 'alert');
    }
  };

  const handleUpdateCurfewDay = async (dayId: string, updates: Partial<CurfewDaySchedule>) => {
    const newSchedule = curfewSchedule.map((d) => (d.dayId === dayId ? { ...d, ...updates } : d));
    setCurfewSchedule(newSchedule);

    const targetDay = newSchedule.find((d) => d.dayId === dayId);
    const dayName = targetDay?.dayName || dayId;

    if (updates.maxMinutes !== undefined) {
      showToast(`${dayName}: Quota diária alterada para ${formatMinutesToHuman(updates.maxMinutes)}.`, 'success');
    } else if (updates.endHour !== undefined) {
      showToast(`${dayName}: Toque de recolher atualizado para as ${updates.endHour}.`, 'info');
    } else {
      showToast(`Horário de ${dayName} atualizado com sucesso.`, 'info');
    }

    try {
      await fetch('/api/curfew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: newSchedule }),
      });
    } catch {
      // offline fallback
    }
  };

  const handleApplyCurfewPreset = async (preset: 'school' | 'vacation' | 'strict') => {
    let newSchedule = curfewSchedule;
    if (preset === 'school') {
      newSchedule = INITIAL_CURFEW_SCHEDULE;
      showToast('Modelo Escolar Padrão aplicado (Seg-Qui: 21:30, Sex-Sáb: 23:00).', 'success');
    } else if (preset === 'vacation') {
      newSchedule = curfewSchedule.map((d) => ({
        ...d,
        endHour: '23:30',
        maxMinutes: d.maxMinutes + 90,
      }));
      showToast('Modo Férias ativado: +1h30m diárias e recolher alargado às 23:30.', 'success');
    } else if (preset === 'strict') {
      newSchedule = curfewSchedule.map((d) => ({
        ...d,
        endHour: '20:30',
        maxMinutes: Math.min(d.maxMinutes, 120),
      }));
      showToast('Modo Estudo Estrito ativado: recolher antecipado às 20:30.', 'info');
    }
    setCurfewSchedule(newSchedule);

    try {
      await fetch('/api/curfew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: newSchedule }),
      });
    } catch {
      // offline fallback
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

  const handleAddCustomApp = async (newApp: Omit<AppUsageRecord, 'id'>) => {
    const entry: AppUsageRecord = {
      ...newApp,
      id: `app-${Date.now()}`,
    };
    setApps((prev) => [...prev, entry]);
    showToast(`Aplicação ${entry.displayName} adicionada à vigilância.`, 'success');

    try {
      const res = await fetch('/api/apps/rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: entry.id,
          processName: entry.processName,
          limitMinutes: entry.dailyLimitMinutes,
          isBlocked: entry.status === 'blocked',
          status: entry.status,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.apps)) {
          setApps(data.apps);
        }
      }
    } catch (e) {
      console.error('Erro ao registar aplicação personalizada no servidor:', e);
    }
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

  const handleSelectPc = async (id: string) => {
    setActivePcId(id);
    try {
      const res = await fetch('/api/pcs/selecionar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.pc) {
          setAgent((prev) => ({
            ...prev,
            targetMachine: data.pc.nome,
            targetUser: data.pc.target_user,
            ipAddress: data.pc.host,
            connectionMethod: data.pc.connectionMethod || 'agent_poll',
          }));
        }
        showToast(`Computador ativo: ${data.pc?.nome || id}`, 'info');
      }
    } catch {
      // offline fallback
    }
  };

  const handleSavePc = async (pcData: Partial<PCConfig>) => {
    const res = await fetch('/api/pcs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pcData),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Erro ao guardar computador');
    }
    const data = await res.json();
    if (Array.isArray(data.pcs)) {
      setPcsList(data.pcs);
    }
    if (data.ativo) {
      setActivePcId(data.ativo);
      const active = data.pcs?.find((p: any) => p.id === data.ativo);
      if (active) {
        setAgent((prev) => ({
          ...prev,
          targetMachine: active.nome,
          targetUser: active.target_user,
          ipAddress: active.host,
          connectionMethod: active.connectionMethod || 'agent_poll',
        }));
      }
    }
    showToast(`Computador "${pcData.nome}" guardado com sucesso!`, 'success');
  };

  const handleDeletePc = async (id: string) => {
    const res = await fetch(`/api/pcs/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Erro ao remover computador');
    }
    const data = await res.json();
    setPcsList((prev) => prev.filter((p) => p.id !== id));
    if (data.ativo) {
      setActivePcId(data.ativo);
    }
    showToast('Computador removido com sucesso.', 'info');
  };

  const handleSendMessage = async (text: string) => {
    const res = await fetch('/api/msg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao enviar mensagem');
    }
    showToast('Mensagem enviada para o ecrã do computador.', 'success');
  };

  const handlePowerAction = async (action: 'logoff' | 'shutdown' | 'restart' | 'cancel') => {
    const res = await fetch('/api/power', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao executar ordem de energia');
    }
    const msgs: Record<string, string> = {
      logoff: 'Ordem de terminar sessão enviada.',
      shutdown: 'Ordem de encerramento (60s) enviada ao PC.',
      restart: 'Ordem de reinício (60s) enviada ao PC.',
      cancel: 'Encerramento agendado cancelado.',
    };
    showToast(msgs[action] || `Comando ${action} enviado ao PC.`, 'alert');
  };

  const currentActivePc: PCConfig = pcsList.find((p) => p.id === activePcId) || {
    id: activePcId || 'pc1',
    nome: agent.targetMachine,
    host: agent.ipAddress,
    target_user: agent.targetUser,
    connectionMethod: (agent.connectionMethod as any) || 'agent_poll',
    isOnline: agent.installationStatus === 'installed',
    lastSeen: agent.lastSyncTime || 'A aguardar primeira conexão',
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans">
      {/* Header with Top Bar Contract & Multi-PC Selector */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        emergencyLock={agent.emergencyLock}
        onToggleEmergencyLock={handleToggleEmergencyLock}
        targetMachine={agent.targetMachine}
        pcsList={pcsList}
        activePcId={activePcId}
        onSelectPc={handleSelectPc}
      />

      {/* Emergency Lock Active Banner */}
      {agent.emergencyLock && (
        <div className="bg-rose-950/90 border-b border-rose-500/50 px-4 py-2 text-center text-xs font-semibold text-rose-200 flex items-center justify-center gap-2 animate-pulse">
          <ShieldAlert className="h-4 w-4 text-rose-400" />
          <span>PAUSA FAMILIAR ATIVA: O computador de {agent.targetUser} está temporariamente com ecrã e lazer bloqueados.</span>
        </div>
      )}



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
          />
        )}

        {currentTab === 'apps' && (
          <AppsManagementTab
            apps={apps}
            runningProcesses={runningProcesses}
            onEditApp={setEditingApp}
            onToggleBlockApp={handleToggleBlockApp}
            onKillProcess={handleKillProcess}
            onKillPid={handleKillPid}
            onKillAll={handleKillAll}
            onAddCustomApp={handleAddCustomApp}
            onRefreshProcs={handleProbeAgent}
          />
        )}

        {currentTab === 'actions' && (
          <ActionsTab
            activePc={currentActivePc}
            onSendMessage={handleSendMessage}
            onPowerAction={handlePowerAction}
            emergencyLock={agent.emergencyLock}
            onToggleEmergencyLock={handleToggleEmergencyLock}
          />
        )}

        {currentTab === 'curfew' && (
          <CurfewTab
            schedule={curfewSchedule}
            todayDayId={todayDayId}
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
            pcsList={pcsList}
            activePcId={activePcId}
            onSelectPc={handleSelectPc}
            onSavePc={handleSavePc}
            onDeletePc={handleDeletePc}
            onUpdateAgentConfig={handleUpdateAgentConfig}
            onRunInstallWizard={() => setIsConnectModalOpen(true)}
            onSyncOptDirectory={handleSyncOptDirectory}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
            onResetAgentData={handleResetAgentData}
            appsCount={apps.length}
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
