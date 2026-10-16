import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import net from 'net';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Persistent state directory
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'state.json');

const PROTECTED_PROCESSES = new Set([
  'sshd.exe', 'winlogon.exe', 'csrss.exe', 'wininit.exe', 'services.exe',
  'lsass.exe', 'svchost.exe', 'dwm.exe', 'system', 'explorer.exe', 'smss.exe',
  'powershell.exe', 'conhost.exe'
]);

// Default initial state for Production
const defaultState = {
  isRealData: true,
  ativo: 'pc1',
  pcs: {
    pc1: {
      id: 'pc1',
      nome: 'PC do Filho (Windows)',
      host: '192.168.1.145',
      port: 5985,
      connectionMethod: 'agent_poll', // 'agent_poll' (HTTP Client Agent - Recommended) or 'ssh'
      ssh_user: 'admin',
      ssh_password: '',
      ssh_key: '',
      target_user: 'Tomas',
      isOnline: false,
      lastSeen: 'A aguardar primeira conexão',
    },
  },
  agent: {
    targetUser: 'Tomas',
    targetMachine: 'PC-QUARTO-WIN11',
    ipAddress: '192.168.1.145',
    port: 5985,
    connectionMethod: 'agent_poll',
    pollingIntervalSeconds: 10,
    osVersion: 'Windows 11',
    version: '3.0.0-agente-http',
    processesCount: 0,
    taskStatus: 'À espera de relatórios do agente...',
    sha256Hash: '9a7e3b18c6e245a498263158f9104b901a82e75306e00b65cf5480e6113b2c1f',
    hashVerified: true,
    lastSyncTime: 'A aguardar primeira conexão',
    emergencyLock: false,
    bonusMinutes: 0,
    installationStatus: 'not_installed',
    optInstallPath: '/opt/control_pc',
  },
  apps: [],
  hourlyActivity: Array.from({ length: 15 }, (_, i) => ({
    hour: i + 8,
    games: 0,
    social: 0,
    study: 0,
    browsing: 0,
    other: 0,
  })),
  curfewSchedule: [
    { dayId: 'mon', dayName: 'Segunda-feira', shortName: 'Seg', isSchoolDay: true, enabled: true, startHour: '08:00', endHour: '21:30', maxMinutes: 210 },
    { dayId: 'tue', dayName: 'Terça-feira', shortName: 'Ter', isSchoolDay: true, enabled: true, startHour: '08:00', endHour: '21:30', maxMinutes: 210 },
    { dayId: 'wed', dayName: 'Quarta-feira', shortName: 'Qua', isSchoolDay: true, enabled: true, startHour: '08:00', endHour: '21:30', maxMinutes: 210 },
    { dayId: 'thu', dayName: 'Quinta-feira', shortName: 'Qui', isSchoolDay: true, enabled: true, startHour: '08:00', endHour: '21:30', maxMinutes: 210 },
    { dayId: 'fri', dayName: 'Sexta-feira', shortName: 'Sex', isSchoolDay: true, enabled: true, startHour: '08:00', endHour: '23:00', maxMinutes: 300 },
    { dayId: 'sat', dayName: 'Sábado', shortName: 'Sáb', isSchoolDay: false, enabled: true, startHour: '09:00', endHour: '23:30', maxMinutes: 360 },
    { dayId: 'sun', dayName: 'Domingo', shortName: 'Dom', isSchoolDay: false, enabled: true, startHour: '09:00', endHour: '21:30', maxMinutes: 240 },
  ],
  blockedDomains: [
    { id: 'dom-1', domain: 'tiktok.com', category: 'Redes Sociais', active: true, hitsToday: 0, addedDate: new Date().toISOString().split('T')[0], isWildcard: false },
    { id: 'dom-2', domain: 'instagram.com', category: 'Redes Sociais', active: true, hitsToday: 0, addedDate: new Date().toISOString().split('T')[0], isWildcard: false },
    { id: 'dom-3', domain: 'betclic.pt', category: 'Apostas', active: true, hitsToday: 0, addedDate: new Date().toISOString().split('T')[0], isWildcard: false },
  ],
  pendingActions: {} as Record<string, any[]>,
  runningProcesses: {} as Record<string, any[]>,
  hardware: {} as Record<string, any>,
  logs: [
    {
      id: 'log-init',
      timestamp: new Date().toLocaleTimeString('pt-PT'),
      type: 'info',
      message: 'Servidor SentinelPC inicializado. Protocolo de Agente HTTP ativo (Porta 3000).',
      source: 'servidor',
    },
  ],
};

function loadState() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(data);
      if (!loaded.pcs || Object.keys(loaded.pcs).length === 0) {
        loaded.pcs = defaultState.pcs;
        loaded.ativo = 'pc1';
      }
      if (!loaded.pendingActions) loaded.pendingActions = {};
      if (!loaded.runningProcesses) loaded.runningProcesses = {};
      if (!loaded.hardware) loaded.hardware = {};
      return loaded;
    } catch {
      return defaultState;
    }
  }
  return defaultState;
}

let currentState = loadState();

function saveState() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(currentState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving state:', err);
  }
}

// Helper to get active PC
function getActivePc() {
  const pid = currentState.ativo || Object.keys(currentState.pcs || {})[0] || 'pc1';
  if (!currentState.pcs[pid]) {
    currentState.pcs[pid] = {
      id: pid,
      nome: 'PC Principal',
      host: currentState.agent?.ipAddress || '192.168.1.145',
      port: 5985,
      connectionMethod: 'agent_poll',
      target_user: currentState.agent?.targetUser || 'Tomas',
      isOnline: false,
      lastSeen: 'A aguardar primeira conexão',
    };
  }
  return currentState.pcs[pid];
}

// Category helper
function categorizeProcess(processName: string): 'games' | 'social' | 'study' | 'browsing' | 'creative' | 'system' {
  const p = processName.toLowerCase();
  if (p.includes('roblox') || p.includes('minecraft') || p.includes('steam') || p.includes('fortnite') || p.includes('epic') || p.includes('valorant') || p.includes('javaw') || p.includes('league') || p.includes('gta')) {
    return 'games';
  }
  if (p.includes('discord') || p.includes('whatsapp') || p.includes('telegram') || p.includes('tiktok') || p.includes('messenger') || p.includes('instagram')) {
    return 'social';
  }
  if (p.includes('code') || p.includes('word') || p.includes('excel') || p.includes('powerpnt') || p.includes('notepad') || p.includes('pycharm') || p.includes('acrobat')) {
    return 'study';
  }
  if (p.includes('chrome') || p.includes('msedge') || p.includes('firefox') || p.includes('opera') || p.includes('brave')) {
    return 'browsing';
  }
  if (p.includes('spotify') || p.includes('vlc') || p.includes('obs') || p.includes('photoshop') || p.includes('blender') || p.includes('gimp')) {
    return 'creative';
  }
  return 'system';
}

// Format rules matching Python / agent schema - always dynamic for today's day
function getFormattedRules() {
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayDayIndex = new Date().getDay();
  const todayDayId = dayKeys[todayDayIndex];

  const today = currentState.curfewSchedule.find((c: any) => c.dayId === todayDayId)
    || currentState.curfewSchedule[0]
    || { startHour: '08:00', endHour: '21:30', maxMinutes: 210 };

  const weekday = currentState.curfewSchedule.find((c: any) => c.isSchoolDay) || today;
  const weekend = currentState.curfewSchedule.find((c: any) => !c.isSchoolDay) || today;

  const appsRules: Record<string, any> = {};
  for (const a of currentState.apps) {
    const clean = a.processName.replace(/\.exe$/i, '').toLowerCase();
    if (a.status === 'blocked') {
      appsRules[clean] = { min: 0, dias: [], bloquear: true };
    } else if (a.dailyLimitMinutes !== null && a.dailyLimitMinutes > 0) {
      appsRules[clean] = {
        min: a.dailyLimitMinutes,
        dias: a.allowedDays && a.allowedDays.length > 0 ? a.allowedDays : [0, 1, 2, 3, 4, 5, 6],
      };
    }
  }

  return {
    diario_min: today.maxMinutes || 180, // Quota do dia atual dinamicamente respeitada
    hoje_dia: todayDayId,
    aviso_min: 5,
    toque_recolher: today.endHour || '21:30',
    inicio_permitido: today.startHour || '08:00',
    dia_ativo: today.enabled !== false,
    horario: {
      semana: [weekday.startHour || '08:00', weekday.endHour || '21:30'],
      fimsemana: [weekend.startHour || '09:00', weekend.endHour || '23:30'],
      hoje: [today.startHour || '08:00', today.endHour || '21:30'],
    },
    schedule: currentState.curfewSchedule,
    apps: appsRules,
  };
}

// -----------------------------------------------------------------------------
// API ROUTES
// -----------------------------------------------------------------------------

// 1. Status geral para o frontend com detecção real-time online
app.get('/api/status', (req, res) => {
  const activePc = getActivePc();
  const pid = activePc.id;

  // Cálculo real-time de estado Online (o agente envia heartbeat a cada 10s; tolerância de 35s)
  const now = Date.now();
  const isActuallyOnline = !!(activePc.lastSeenTs && (now - activePc.lastSeenTs < 35000));
  activePc.isOnline = isActuallyOnline;

  // Sync active PC info with agent object
  currentState.agent.ipAddress = activePc.host;
  currentState.agent.targetMachine = activePc.nome;
  currentState.agent.targetUser = activePc.target_user;
  currentState.agent.connectionMethod = activePc.connectionMethod || 'agent_poll';
  currentState.agent.installationStatus = isActuallyOnline ? 'installed' : (activePc.lastSeenTs ? 'installed' : 'not_installed');
  currentState.agent.taskStatus = isActuallyOnline
    ? (currentState.runningProcesses[pid]?.length > 0
        ? `Ativo (${currentState.runningProcesses[pid].length} aplicações em execução)`
        : 'Online (Ambiente de Trabalho)')
    : 'Offline (Desconectado / À espera do agente)';

  const hw = currentState.hardware[pid] || currentState.hardware['default'] || null;
  if (hw) {
    currentState.agent.hardware = hw;
  }

  res.json({
    ...currentState,
    activePc: {
      ...activePc,
      isOnline: isActuallyOnline,
    },
    pcsList: Object.values(currentState.pcs || {}).map((p: any) => ({
      ...p,
      isOnline: !!(p.lastSeenTs && (now - p.lastSeenTs < 35000)),
    })),
    runningProcesses: currentState.runningProcesses[pid] || [],
    hardware: hw,
  });
});

// 2. Multi-PC Management: Listar computadores
app.get('/api/pcs', (req, res) => {
  const pcsList = Object.values(currentState.pcs || {}).map((p: any) => ({
    id: p.id,
    nome: p.nome,
    host: p.host,
    connectionMethod: p.connectionMethod || 'agent_poll',
    target_user: p.target_user,
    ssh_user: p.ssh_user || '',
    isOnline: p.isOnline || false,
    lastSeen: p.lastSeen || 'Desconhecido',
  }));
  res.json({
    pcs: pcsList,
    ativo: currentState.ativo || 'pc1',
  });
});

// 3. Multi-PC Management: Criar ou atualizar computador
app.post('/api/pcs', (req, res) => {
  const { id, nome, host, connectionMethod, target_user, ssh_user, ssh_password, ssh_key, port } = req.body;
  if (!nome || !host || !target_user) {
    return res.status(400).json({ error: 'Campos nome, host e target_user são obrigatórios.' });
  }

  const pid = id && currentState.pcs[id] ? id : (id || `pc_${Date.now().toString(36)}`);
  const existing = currentState.pcs[pid] || {};

  currentState.pcs[pid] = {
    id: pid,
    nome: nome.trim(),
    host: host.trim(),
    connectionMethod: connectionMethod || 'agent_poll',
    target_user: target_user.trim(),
    ssh_user: (ssh_user || '').trim(),
    ssh_password: ssh_password !== undefined && ssh_password !== '' ? ssh_password : (existing.ssh_password || ''),
    ssh_key: (ssh_key || '').trim(),
    port: port ? parseInt(port, 10) : 5985,
    isOnline: existing.isOnline || false,
    lastSeen: existing.lastSeen || 'A aguardar primeira conexão',
  };

  if (!currentState.ativo || currentState.ativo === pid) {
    currentState.ativo = pid;
    currentState.agent.targetMachine = currentState.pcs[pid].nome;
    currentState.agent.targetUser = currentState.pcs[pid].target_user;
    currentState.agent.ipAddress = currentState.pcs[pid].host;
    currentState.agent.connectionMethod = currentState.pcs[pid].connectionMethod;
  }

  currentState.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('pt-PT'),
    type: 'info',
    message: `Configurações do computador "${nome}" guardadas com sucesso.`,
    source: 'admin',
  });

  saveState();
  res.json({ ok: true, id: pid, pcs: Object.values(currentState.pcs), ativo: currentState.ativo });
});

// 4. Multi-PC Management: Selecionar computador ativo
app.post('/api/pcs/selecionar', (req, res) => {
  const { id } = req.body;
  if (!id || !currentState.pcs[id]) {
    return res.status(404).json({ error: 'Computador não encontrado' });
  }

  currentState.ativo = id;
  const pc = currentState.pcs[id];
  currentState.agent.targetMachine = pc.nome;
  currentState.agent.targetUser = pc.target_user;
  currentState.agent.ipAddress = pc.host;
  currentState.agent.connectionMethod = pc.connectionMethod || 'agent_poll';

  currentState.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('pt-PT'),
    type: 'info',
    message: `Computador ativo alterado para: ${pc.nome} (${pc.host}).`,
    source: 'admin',
  });

  saveState();
  res.json({ ok: true, ativo: id, pc });
});

// 5. Multi-PC Management: Remover computador
app.delete('/api/pcs/:id', (req, res) => {
  const { id } = req.params;
  if (!currentState.pcs[id]) {
    return res.status(404).json({ error: 'Computador não encontrado' });
  }

  delete currentState.pcs[id];
  delete currentState.pendingActions[id];
  delete currentState.runningProcesses[id];
  delete currentState.hardware[id];

  const remaining = Object.keys(currentState.pcs);
  if (currentState.ativo === id) {
    currentState.ativo = remaining[0] || null;
  }

  saveState();
  res.json({ ok: true, ativo: currentState.ativo });
});

// 6. Ingestão de Telemetria do Agente Windows (Heartbeat HTTP do vigia.ps1)
app.post('/api/report', (req, res) => {
  const {
    pcId,
    targetMachine,
    targetUser,
    activeProcess,
    activeTitle,
    runningProcesses,
    hardware,
    osVersion,
    idleMs,
  } = req.body;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-PT');
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Determine client IP
  const rawIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '127.0.0.1';
  const cleanClientIp = rawIp.split(',')[0].trim().replace(/^::ffff:/, '');

  // Find or determine PC
  let activePc: any = getActivePc();
  let pid: string = (pcId && currentState.pcs[pcId]) ? pcId : activePc.id;

  if (pcId && currentState.pcs[pcId]) {
    pid = pcId;
    activePc = currentState.pcs[pcId];
  } else {
    // Match existing PC by hostname, targetUser or host IP
    const entries = Object.entries(currentState.pcs || {});
    const found = entries.find(([_, p]: any) => {
      if (targetMachine && p.nome && p.nome.toLowerCase() === targetMachine.toLowerCase()) return true;
      if (targetUser && p.target_user && p.target_user.toLowerCase() === targetUser.toLowerCase()) return true;
      if (p.host && (p.host === cleanClientIp || (cleanClientIp !== '127.0.0.1' && p.host === req.ip))) return true;
      return false;
    });

    if (found) {
      pid = found[0];
      activePc = found[1];
    } else {
      // If default placeholder 'pc1' has never connected, adopt it for the first reporting machine
      const defaultPc = currentState.pcs['pc1'];
      if (defaultPc && defaultPc.lastSeen === 'A aguardar primeira conexão' && !defaultPc.isOnline && Object.keys(currentState.pcs).length === 1) {
        pid = 'pc1';
        activePc = defaultPc;
        activePc.nome = targetMachine || 'PC Principal';
        activePc.target_user = targetUser || defaultPc.target_user;
        if (cleanClientIp && cleanClientIp !== '127.0.0.1') {
          activePc.host = cleanClientIp;
        }
      } else {
        // Auto-register brand new PC!
        pid = `pc_${Date.now().toString(36)}`;
        activePc = {
          id: pid,
          nome: targetMachine || `PC de ${targetUser || 'Testes'}`,
          host: cleanClientIp !== '127.0.0.1' ? cleanClientIp : '192.168.1.150',
          connectionMethod: 'agent_poll',
          target_user: targetUser || 'Utilizador',
          ssh_user: '',
          ssh_password: '',
          ssh_key: '',
          port: 5985,
          isOnline: true,
          lastSeen: 'Agora mesmo',
          lastSeenTs: Date.now(),
        };
        currentState.pcs[pid] = activePc;

        currentState.logs.unshift({
          id: `log-${Date.now()}`,
          timestamp: timeStr,
          type: 'success',
          message: `Novo computador auto-detetado e registado: "${activePc.nome}" (${activePc.target_user} @ ${activePc.host})!`,
          source: 'vigia.ps1',
        });
      }
    }
  }

  // Update PC status
  activePc.isOnline = true;
  activePc.lastSeen = 'Agora mesmo';
  activePc.lastSeenTs = Date.now();
  if (targetMachine) activePc.nome = activePc.nome || targetMachine;
  if (targetUser) activePc.target_user = targetUser;
  if (cleanClientIp && cleanClientIp !== '127.0.0.1' && (!activePc.host || activePc.host === '192.168.1.145')) {
    activePc.host = cleanClientIp;
  }

  // If this is the active PC or none is set, sync agent state
  if (currentState.ativo === pid || !currentState.ativo) {
    currentState.ativo = pid;
    currentState.agent.targetMachine = activePc.nome;
    currentState.agent.targetUser = activePc.target_user;
    currentState.agent.ipAddress = activePc.host;
    currentState.agent.connectionMethod = activePc.connectionMethod || 'agent_poll';
  }

  currentState.isRealData = true;
  currentState.agent.lastSyncTime = 'Agora mesmo';
  currentState.agent.hashVerified = true;
  currentState.agent.installationStatus = 'installed';

  if (targetMachine) currentState.agent.targetMachine = targetMachine;
  if (targetUser) currentState.agent.targetUser = targetUser;
  if (osVersion) currentState.agent.osVersion = osVersion;

  // Store detailed running processes
  if (Array.isArray(runningProcesses)) {
    const formatted = runningProcesses.map((p: any) => {
      if (typeof p === 'string') {
        return {
          name: p,
          pid: 0,
          mem_mb: 50,
          title: '',
          isProtected: PROTECTED_PROCESSES.has(p.toLowerCase()),
        };
      }
      return {
        name: p.name || p.ProcessName || '',
        pid: p.pid || p.Id || 0,
        mem_mb: Math.round(p.mem_mb || (p.WorkingSet64 ? p.WorkingSet64 / 1024 / 1024 : 0) || 50),
        cpu: p.cpu || 0,
        title: p.title || p.MainWindowTitle || '',
        isProtected: PROTECTED_PROCESSES.has((p.name || '').toLowerCase()),
      };
    });

    currentState.runningProcesses[pid] = formatted;
    currentState.agent.processesCount = formatted.length;
    currentState.agent.taskStatus = formatted.length > 0
      ? `Ativo (${formatted.length} aplicações em execução)`
      : 'Online (Ambiente de Trabalho)';

    // Sincronizar aplicações abertas com a lista currentState.apps
    const runningMap = new Map<string, any>();
    formatted.forEach((proc: any) => {
      const lower = proc.name.toLowerCase();
      if (!runningMap.has(lower)) {
        runningMap.set(lower, proc);
      }
    });

    // 1. Atualizar estado das apps já monitorizadas
    for (const app of currentState.apps) {
      const lower = app.processName.toLowerCase();
      if (runningMap.has(lower)) {
        app.status = app.status === 'blocked' ? 'blocked' : 'running';
        const match = runningMap.get(lower);
        if (match?.title && match.title !== match.name) {
          app.windowTitle = match.title;
        }
        app.lastActiveTime = 'Agora mesmo';
      } else if (app.status === 'running') {
        app.status = 'idle';
      }
    }

    // 2. Auto-descoberta de novas apps em execução (Calculadora, Navegadores, Jogos, etc.)
    for (const proc of formatted) {
      const lower = proc.name.toLowerCase();
      const cleanName = proc.name.replace(/\.exe$/i, '');
      const alreadyTracked = currentState.apps.some((a: any) => a.processName.toLowerCase() === lower);

      if (!alreadyTracked && cleanName.length > 1) {
        const category = categorizeProcess(cleanName);
        let displayName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        if (cleanName.toLowerCase() === 'calculatorapp' || cleanName.toLowerCase() === 'calc') {
          displayName = 'Calculadora';
        } else if (proc.title && proc.title !== proc.name && proc.title.length < 35) {
          displayName = proc.title;
        }

        currentState.apps.push({
          id: `app-${cleanName.toLowerCase()}`,
          processName: proc.name,
          displayName,
          iconType: 'box',
          category,
          minutesToday: 0,
          dailyLimitMinutes: category === 'games' ? 90 : category === 'social' ? 60 : null,
          status: 'running',
          windowTitle: proc.title || '',
          lastActiveTime: 'Agora mesmo',
          isRestricted: category === 'games' || category === 'social',
          allowedDays: [0, 1, 2, 3, 4, 5, 6],
        });
      }
    }
  }

  // Store hardware metrics if provided
  if (hardware) {
    currentState.hardware[pid] = {
      cpuPercent: hardware.cpuPercent ?? hardware.cpu ?? 10,
      totalRamMb: hardware.totalRamMb ?? hardware.total_mb ?? 16384,
      freeRamMb: hardware.freeRamMb ?? hardware.livre_mb ?? 8192,
      diskTotalGb: hardware.diskTotalGb ?? hardware.disco_total_gb ?? 500,
      diskFreeGb: hardware.diskFreeGb ?? hardware.disco_livre_gb ?? 250,
      uptimeSeconds: hardware.uptimeSeconds ?? hardware.uptime_s ?? 3600,
      tempMedia: hardware.tempMedia ?? hardware.temp_media ?? null,
      lastUpdateTs: Date.now(),
    };
  }

  // Contabilização de Tempo de Utilização Real do Computador
  const isIdle = idleMs && idleMs > 300000;
  if (req.body.activeSecondsToday !== undefined && req.body.activeSecondsToday > 0) {
    currentState.agent.screenTimeMinutesToday = Math.floor(req.body.activeSecondsToday / 60);
  } else if (!isIdle) {
    if (!currentState.screenTimeTodaySeconds) currentState.screenTimeTodaySeconds = {};
    currentState.screenTimeTodaySeconds[pid] = (currentState.screenTimeTodaySeconds[pid] || 0) + 10;
    currentState.agent.screenTimeMinutesToday = Math.floor(currentState.screenTimeTodaySeconds[pid] / 60);
  }

  // Sincronizar tempos acumulados por aplicação se reportados pelo agente
  if (req.body.appTimes && typeof req.body.appTimes === 'object') {
    for (const [rawAppName, secs] of Object.entries(req.body.appTimes)) {
      const lower = rawAppName.toLowerCase();
      const app = currentState.apps.find((a: any) => a.processName.toLowerCase() === lower);
      if (app) {
        app.minutesToday = Math.max(app.minutesToday, Math.floor(Number(secs) / 60));
      }
    }
  }

  // Process foreground active app
  let immediateAction: { type: string; process?: string; message?: string } | null = null;

  if (activeProcess && typeof activeProcess === 'string' && activeProcess !== 'idle' && !isIdle) {
    const cleanName = activeProcess.replace(/\.exe$/i, '');
    const exeName = `${cleanName}.exe`;
    const category = categorizeProcess(cleanName);

    let app = currentState.apps.find((a: any) => a.processName.toLowerCase() === exeName.toLowerCase());

    if (!app) {
      let displayName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      if (cleanName.toLowerCase() === 'calculatorapp' || cleanName.toLowerCase() === 'calc') {
        displayName = 'Calculadora';
      } else if (activeTitle && activeTitle.length < 35) {
        displayName = activeTitle;
      }

      app = {
        id: `app-${cleanName.toLowerCase()}`,
        processName: exeName,
        displayName,
        iconType: 'box',
        category,
        minutesToday: 1,
        dailyLimitMinutes: category === 'games' ? 90 : category === 'social' ? 60 : null,
        status: 'running',
        windowTitle: activeTitle || '',
        lastActiveTime: 'Agora mesmo',
        isRestricted: category === 'games' || category === 'social',
        allowedDays: [0, 1, 2, 3, 4, 5, 6],
      };
      currentState.apps.push(app);
    } else {
      // Incrementa 10 segundos ao contador interno da app
      if (!(app as any)._activeSecs) (app as any)._activeSecs = (app.minutesToday || 0) * 60;
      (app as any)._activeSecs += 10;
      app.minutesToday = Math.floor((app as any)._activeSecs / 60);
      if (app.minutesToday === 0) app.minutesToday = 1; // Dá visibilidade de 1m na interface
      app.windowTitle = activeTitle || app.windowTitle;
      app.status = 'running';
      app.lastActiveTime = 'Agora mesmo';

      // Check daily limit or blocked
      if (app.status === 'blocked' || (app.dailyLimitMinutes !== null && app.minutesToday >= app.dailyLimitMinutes)) {
        immediateAction = {
          type: 'kill',
          process: exeName,
          message: `Limite diário esgotado para ${app.displayName}.`,
        };
        app.status = 'blocked';
      }
    }

    // Update hourly slot
    const hourSlot = currentState.hourlyActivity.find((h: any) => h.hour === currentHour);
    if (hourSlot) {
      if (category === 'games') hourSlot.games += 1;
      else if (category === 'social') hourSlot.social += 1;
      else if (category === 'study') hourSlot.study += 1;
      else if (category === 'browsing') hourSlot.browsing += 1;
      else hourSlot.other += 1;
    }
  }

  // Verificação de Toque de Recolher (Curfew) e Quota Diária Total de Hoje
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayDayIndex = now.getDay();
  const todayDayId = dayKeys[todayDayIndex];
  const todayCurfew = currentState.curfewSchedule.find((c: any) => c.dayId === todayDayId) || currentState.curfewSchedule[0];

  const totalMinToday = currentState.agent.screenTimeMinutesToday || 0;
  const maxAllowedToday = (todayCurfew?.maxMinutes || 210) + (currentState.agent.bonusMinutes || 0);

  if (!immediateAction) {
    // 1. Se o dia estiver desativado por completo
    if (todayCurfew && todayCurfew.enabled === false) {
      immediateAction = {
        type: 'lock_screen',
        message: 'O computador está bloqueado hoje por regra parental.',
      };
    }
    // 2. Se a quota máxima do dia foi atingida
    else if (todayCurfew && totalMinToday >= maxAllowedToday) {
      immediateAction = {
        type: 'lock_screen',
        message: `Limite de tempo diário esgotado (${maxAllowedToday}m). O computador foi bloqueado.`,
      };
    }
    // 3. Se estiver fora do horário permitido (toque de recolher)
    else if (todayCurfew && todayCurfew.endHour) {
      const [curfH, curfM] = todayCurfew.endHour.split(':').map(Number);
      const [startH, startM] = (todayCurfew.startHour || '08:00').split(':').map(Number);
      const nowMinutes = currentHour * 60 + currentMinute;
      const curfMinutes = curfH * 60 + curfM;
      const startMinutes = startH * 60 + startM;

      if (nowMinutes >= curfMinutes || nowMinutes < startMinutes) {
        immediateAction = {
          type: 'lock_screen',
          message: `Toque de recolher ativo (${todayCurfew.endHour}). O ecrã foi bloqueado.`,
        };
      }
    }
  }

  // Emergency lock check (Pausa Familiar prioritária)
  if (currentState.agent.emergencyLock) {
    immediateAction = {
      type: 'lock_screen',
      message: 'Pausa Familiar ativada.',
    };
  }

  // Retrieve pending actions for this PC and dequeue them
  const pending = currentState.pendingActions[pid] || [];
  currentState.pendingActions[pid] = [];

  // Add system log on first connect
  if (currentState.logs.length === 0 || currentState.logs[0].message.includes('A aguardar')) {
    currentState.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: timeStr,
      type: 'success',
      message: `Relatório recebido com sucesso de ${activePc.nome}! Agente operacional e conectado via HTTP.`,
      source: 'vigia.ps1',
    });
  }

  saveState();

  // Return rules, pending commands, and domains to the client agent
  res.json({
    status: 'ok',
    serverTime: now.toISOString(),
    action: immediateAction,
    pendingActions: pending,
    regras: getFormattedRules(),
    dominios: currentState.blockedDomains.filter((d: any) => d.active).map((d: any) => d.domain),
    emergencyLock: currentState.agent.emergencyLock,
  });
});

// 7. Obter lista de processos ativos (para o separador Aplicações)
app.get('/api/processes', (req, res) => {
  const activePc = getActivePc();
  const procs = currentState.runningProcesses[activePc.id] || [];
  res.json({
    processes: procs,
    offline: !activePc.isOnline,
    target: activePc.target_user,
    pc: activePc.nome,
  });
});

// 8. Fechar processo por PID
app.post('/api/kill', (req, res) => {
  const { pid, name } = req.body;
  const activePc = getActivePc();

  if (!pid && !name) {
    return res.status(400).json({ error: 'PID ou nome do processo não fornecido' });
  }

  if (name && PROTECTED_PROCESSES.has(name.toLowerCase())) {
    return res.status(403).json({ error: `O processo ${name} é do sistema e está protegido.` });
  }

  // Queue action for the HTTP agent
  if (!currentState.pendingActions[activePc.id]) {
    currentState.pendingActions[activePc.id] = [];
  }

  currentState.pendingActions[activePc.id].push({
    id: `act_${Date.now()}`,
    type: 'kill',
    pid: Number(pid),
    name: name || '',
    timestamp: Date.now(),
  });

  currentState.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('pt-PT'),
    type: 'warning',
    message: `Ordem enviada para terminar processo PID ${pid || name} em ${activePc.nome}.`,
    source: 'painel',
  });

  saveState();
  res.json({ ok: true, msg: `Ordem de encerramento enviada para ${activePc.nome}` });
});

// 9. Fechar todos os processos de uma aplicação (KillAll)
app.post('/api/killall', (req, res) => {
  const { name } = req.body;
  const activePc = getActivePc();

  if (!name) {
    return res.status(400).json({ error: 'Nome do programa não fornecido' });
  }

  const clean = name.trim().toLowerCase();
  if (PROTECTED_PROCESSES.has(clean) || PROTECTED_PROCESSES.has(`${clean}.exe`)) {
    return res.status(403).json({ error: `O programa ${name} é protegido pelo sistema.` });
  }

  if (!currentState.pendingActions[activePc.id]) {
    currentState.pendingActions[activePc.id] = [];
  }

  currentState.pendingActions[activePc.id].push({
    id: `act_${Date.now()}`,
    type: 'killall',
    name: clean.replace(/\.exe$/i, ''),
    timestamp: Date.now(),
  });

  currentState.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('pt-PT'),
    type: 'alert',
    message: `Ordem para fechar todos os processos de "${name}" enviada para ${activePc.nome}.`,
    source: 'painel',
  });

  saveState();
  res.json({ ok: true, msg: `Todos os processos de ${name} serão fechados no PC.` });
});

// 10. Enviar mensagem de ecrã para o utilizador
app.post('/api/msg', (req, res) => {
  const { text } = req.body;
  const activePc = getActivePc();

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Mensagem vazia' });
  }

  const cleanText = text.trim().slice(0, 200);

  if (!currentState.pendingActions[activePc.id]) {
    currentState.pendingActions[activePc.id] = [];
  }

  currentState.pendingActions[activePc.id].push({
    id: `act_${Date.now()}`,
    type: 'msg',
    text: cleanText,
    timestamp: Date.now(),
  });

  currentState.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('pt-PT'),
    type: 'info',
    message: `Mensagem enviada para o ecrã de ${activePc.target_user}: "${cleanText}"`,
    source: 'painel',
  });

  saveState();
  res.json({ ok: true, msg: 'Mensagem enviada para o ecrã com sucesso.' });
});

// 11. Controlo de Energia e Sessão (logoff, shutdown, restart, cancel)
app.post('/api/power', (req, res) => {
  const { action } = req.body;
  const activePc = getActivePc();

  if (!['logoff', 'shutdown', 'restart', 'cancel'].includes(action)) {
    return res.status(400).json({ error: 'Ação de energia inválida' });
  }

  if (!currentState.pendingActions[activePc.id]) {
    currentState.pendingActions[activePc.id] = [];
  }

  currentState.pendingActions[activePc.id].push({
    id: `act_${Date.now()}`,
    type: 'power',
    action,
    timestamp: Date.now(),
  });

  const actionLabels: Record<string, string> = {
    logoff: 'Terminar sessão',
    shutdown: 'Desligar o PC (aviso de 60s)',
    restart: 'Reiniciar o PC (aviso de 60s)',
    cancel: 'Cancelar encerramento agendado',
  };

  currentState.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('pt-PT'),
    type: 'alert',
    message: `Comando de energia executado: ${actionLabels[action]} em ${activePc.nome}.`,
    source: 'painel',
  });

  saveState();
  res.json({ ok: true, msg: `Comando ${actionLabels[action]} enviado ao computador.` });
});

// 12. Regras e Horários
app.get('/api/regras', (req, res) => {
  res.json(getFormattedRules());
});

app.post('/api/regras', (req, res) => {
  const { diario_min, horario, apps } = req.body;

  if (diario_min !== undefined) {
    currentState.curfewSchedule.forEach((c: any) => {
      c.maxMinutes = Number(diario_min);
    });
  }

  if (horario) {
    if (horario.semana) {
      currentState.curfewSchedule.filter((c: any) => c.isSchoolDay).forEach((c: any) => {
        c.startHour = horario.semana[0];
        c.endHour = horario.semana[1];
      });
    }
    if (horario.fimsemana) {
      currentState.curfewSchedule.filter((c: any) => !c.isSchoolDay).forEach((c: any) => {
        c.startHour = horario.fimsemana[0];
        c.endHour = horario.fimsemana[1];
      });
    }
  }

  if (apps && typeof apps === 'object') {
    for (const [proc, cfg] of Object.entries(apps)) {
      const exeName = `${proc.toLowerCase().replace(/\.exe$/i, '')}.exe`;
      let app = currentState.apps.find((a: any) => a.processName.toLowerCase() === exeName);
      const isBlocked = typeof cfg === 'object' && (cfg as any).bloquear;
      const min = typeof cfg === 'object' ? (cfg as any).min : Number(cfg);
      const dias = typeof cfg === 'object' && Array.isArray((cfg as any).dias) ? (cfg as any).dias : [0, 1, 2, 3, 4, 5, 6];

      if (!app) {
        app = {
          id: `app-${proc.toLowerCase()}`,
          processName: exeName,
          displayName: proc.charAt(0).toUpperCase() + proc.slice(1),
          iconType: 'box',
          category: categorizeProcess(proc),
          minutesToday: 0,
          dailyLimitMinutes: isBlocked ? 0 : min || null,
          status: isBlocked ? 'blocked' : 'idle',
          lastActiveTime: 'Nunca',
          isRestricted: isBlocked || (min !== null && min > 0),
          allowedDays: dias,
        };
        currentState.apps.push(app);
      } else {
        app.status = isBlocked ? 'blocked' : (app.status === 'blocked' ? 'idle' : app.status);
        app.dailyLimitMinutes = isBlocked ? 0 : (min || null);
        app.allowedDays = dias;
      }
    }
  }

  saveState();
  res.json({ ok: true, regras: getFormattedRules() });
});

// 12b. Gestão de Horários & Toque de Recolher (Curfew)
app.get('/api/curfew', (req, res) => {
  res.json({
    schedule: currentState.curfewSchedule,
  });
});

app.post('/api/curfew', (req, res) => {
  const { schedule, dayId, updates } = req.body;
  if (Array.isArray(schedule)) {
    currentState.curfewSchedule = schedule;
    saveState();
    return res.json({ ok: true, schedule: currentState.curfewSchedule });
  }
  if (dayId && updates) {
    currentState.curfewSchedule = currentState.curfewSchedule.map((d: any) =>
      d.dayId === dayId ? { ...d, ...updates } : d
    );
    saveState();
    return res.json({ ok: true, schedule: currentState.curfewSchedule });
  }
  res.status(400).json({ ok: false, error: 'Formato de horário inválido' });
});

// 13. Domínios e Bloqueio Web
app.get('/api/dominios', (req, res) => {
  const doms = currentState.blockedDomains.map((d: any) => d.domain);
  res.json({ dominios: doms });
});

app.post('/api/dominios', (req, res) => {
  const { dominios } = req.body;
  if (!Array.isArray(dominios)) {
    return res.status(400).json({ error: 'Lista de domínios inválida' });
  }

  const unique = Array.from(new Set(dominios.map((d: string) => d.trim().toLowerCase()).filter(Boolean)));
  currentState.blockedDomains = unique.map((dom: string, i: number) => ({
    id: `dom-${i + 1}`,
    domain: dom,
    category: dom.includes('youtube') ? 'Vídeo / Streaming' : dom.includes('tiktok') ? 'Redes Sociais' : 'Filtro Web',
    active: true,
    hitsToday: 0,
    addedDate: new Date().toISOString().split('T')[0],
    isWildcard: dom.startsWith('*.'),
  }));

  saveState();
  res.json({ ok: true, dominios: unique });
});

// 14. Estado de Hardware
app.get('/api/estado', (req, res) => {
  const activePc = getActivePc();
  const hw = currentState.hardware[activePc.id] || {
    cpuPercent: 12,
    totalRamMb: 16384,
    freeRamMb: 8420,
    diskTotalGb: 476,
    diskFreeGb: 194,
    uptimeSeconds: 7200,
    tempMedia: 44,
  };
  res.json(hw);
});

// 15. Servir o Agente PowerShell Avançado (vigia.ps1)
app.get('/api/agent/vigia.ps1', (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.get('host') || '127.0.0.1:3000';
  const rawProto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const protocol = rawProto.split(',')[0].trim();
  const serverUrl = `${protocol}://${host}`;

  const script = `# ================================================================
# SentinelPC - Agente Cliente Windows Nativo (vigia.ps1)
# Servidor Central: ${serverUrl}
# ================================================================
$ErrorActionPreference = "SilentlyContinue"
$ServerUrl = "${serverUrl}"

# 1. Gestao de Instancias e Sessao Interativa
$myId = $PID
$myProc = Get-Process -Id $myId -ErrorAction SilentlyContinue
$mySession = if ($myProc) { $myProc.SessionId } else { 1 }

# Se estiver na Sessao 0 (servico de fundo) e ja existir o desktop interativo do utilizador (explorer.exe),
# sai imediatamente para dar controlo total ao agente da sessao de utilizador.
$exp = Get-Process explorer -ErrorAction SilentlyContinue | Select-Object -First 1
if ($mySession -eq 0 -and $exp -and $exp.SessionId -gt 0) {
    exit 0
}

# Se for a instancia interativa do utilizador, termina quaisquer zombies antigos
$others = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { 
    $_.ProcessId -ne $myId -and ($_.CommandLine -like '*vigia.ps1*' -or $_.CommandLine -like '*SentinelWatcher*') 
}
foreach ($o in $others) {
    try { Stop-Process -Id $o.ProcessId -Force -ErrorAction SilentlyContinue } catch {}
}

# 2. Inicializacao segura da API nativa Win32 (GetForegroundWindow + GetLastInputInfo)
if (-not ([System.Management.Automation.PSTypeName]'SentinelNativeW').Type) {
    try {
        Add-Type @"
using System;
using System.Runtime.InteropServices;
public class SentinelNativeW {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
  [StructLayout(LayoutKind.Sequential)] public struct LII { public uint cb; public uint t; }
  [DllImport("user32.dll")] public static extern bool GetLastInputInfo(ref LII i);
  public static uint IdleMs() {
    try {
      LII i = new LII();
      i.cb = (uint)Marshal.SizeOf(i);
      if (GetLastInputInfo(ref i)) {
        return (uint)Environment.TickCount - i.t;
      }
      return 0;
    } catch { return 0; }
  }
}
"@ -ErrorAction SilentlyContinue
    } catch {}
}

function Get-ActiveAppInfo {
    try {
        if ([System.Management.Automation.PSTypeName]'SentinelNativeW'.Type) {
            $h = [SentinelNativeW]::GetForegroundWindow()
            if ($h -ne [IntPtr]::Zero) {
                $p = [uint32]0
                [SentinelNativeW]::GetWindowThreadProcessId($h, [ref]$p) | Out-Null
                if ($p -gt 0) {
                    $proc = Get-Process -Id $p -ErrorAction SilentlyContinue
                    if ($proc) {
                        $pName = $proc.ProcessName
                        $title = $proc.MainWindowTitle

                        # Tratar ApplicationFrameHost e Calculadora moderna do Windows
                        if ($pName -eq "ApplicationFrameHost") {
                            $calc = Get-Process CalculatorApp -ErrorAction SilentlyContinue | Select-Object -First 1
                            if ($calc) {
                                $pName = "CalculatorApp"
                                $title = "Calculadora"
                            } elseif ($title -match 'Calculadora|Calculator') {
                                $pName = "CalculatorApp"
                                $title = "Calculadora"
                            }
                        }
                        if ($pName -match '^(CalculatorApp|calc)$') {
                            $pName = "CalculatorApp"
                            if (-not $title) { $title = "Calculadora" }
                        }
                        return @{ name = "$pName.exe"; title = if ($title) { $title } else { $pName }; pid = [int]$p }
                    }
                }
            }
        }
    } catch {}

    # Fallback se Win32 API estiver limitada: detetar processos de topo
    try {
        $calc = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match '^(CalculatorApp|calc)$' } | Select-Object -First 1
        if ($calc) {
            return @{ name = "CalculatorApp.exe"; title = "Calculadora"; pid = [int]$calc.Id }
        }
        $withWindow = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 -and $_.ProcessName -notmatch '^(explorer|powershell|cmd|taskmgr)$' } | Select-Object -First 1
        if ($withWindow) {
            return @{ name = "$($withWindow.ProcessName).exe"; title = if ($withWindow.MainWindowTitle) { $withWindow.MainWindowTitle } else { $withWindow.ProcessName }; pid = [int]$withWindow.Id }
        }
    } catch {}

    return $null
}

function Get-RunningAppsList {
    $apps = [System.Collections.Generic.List[PSObject]]::new()
    $seen = @{}

    # Identificar a sessao de desktop do explorador
    $exp = Get-Process explorer -ErrorAction SilentlyContinue | Select-Object -First 1
    $targetSession = if ($exp) { $exp.SessionId } else { (Get-Process -Id $PID).SessionId }

    $allProcs = Get-Process -ErrorAction SilentlyContinue

    # Processos de sistema e servicos a ignorar
    $sysRegex = '^(svchost|csrss|smss|services|lsass|wininit|winlogon|fontdrvhost|dwm|ctfmon|sihost|taskhostw|conhost|RuntimeBroker|SearchHost|StartMenuExperienceHost|ShellExperienceHost|TextInputHost|SecurityHealthSystray|SecurityHealthService|smartscreen|audiodg|spoolsv|wlanext|dasHost|SettingSyncHost|SystemSettingsBroker|explorer|wscript|cscript|powershell|cmd|taskmgr)$'

    # 1. Processos com titulo de janela visivel (qualquer aplicacao aberta pelo utilizador)
    foreach ($p in $allProcs) {
        $t = $p.MainWindowTitle
        if ($t -and $t.Trim() -ne "") {
            $pName = "$($p.ProcessName).exe"
            $k = $pName.ToLower()
            if (-not $seen.ContainsKey($k)) {
                $seen[$k] = $true
                $apps.Add(@{
                    name = $pName
                    pid = [int]$p.Id
                    mem_mb = [math]::Round($p.WorkingSet64 / 1MB)
                    title = $t
                })
            }
        }
    }

    # 2. Processos ativos na sessao interativa do utilizador (mesmo sem titulo ou minimizados)
    foreach ($p in $allProcs) {
        if ($p.SessionId -eq $targetSession -and $p.ProcessName -notmatch $sysRegex) {
            $pName = "$($p.ProcessName).exe"
            $k = $pName.ToLower()
            if (-not $seen.ContainsKey($k)) {
                $seen[$k] = $true
                $title = if ($p.MainWindowTitle) { $p.MainWindowTitle } else { $p.ProcessName }
                if ($p.ProcessName -match '^(CalculatorApp|calc)$') { $title = "Calculadora" }
                elseif ($p.ProcessName -eq "notepad") { $title = "Bloco de Notas" }
                elseif ($p.ProcessName -eq "mspaint") { $title = "Paint" }
                elseif ($p.ProcessName -match 'discord') { $title = "Discord" }
                elseif ($p.ProcessName -match 'spotify') { $title = "Spotify" }
                elseif ($p.ProcessName -match 'steam') { $title = "Steam" }
                elseif ($p.ProcessName -match 'chrome') { $title = "Google Chrome" }
                elseif ($p.ProcessName -match 'msedge') { $title = "Microsoft Edge" }
                elseif ($p.ProcessName -match 'firefox') { $title = "Mozilla Firefox" }
                elseif ($p.ProcessName -match 'brave') { $title = "Brave" }
                elseif ($p.ProcessName -match 'Roblox') { $title = "Roblox" }
                elseif ($p.ProcessName -match 'Minecraft|javaw') { $title = "Minecraft" }

                $apps.Add(@{
                    name = $pName
                    pid = [int]$p.Id
                    mem_mb = [math]::Round($p.WorkingSet64 / 1MB)
                    title = $title
                })
            }
        }
    }

    # 3. Deteccao garantida para a Calculadora UWP do Windows (CalculatorApp.exe)
    $calcProc = $allProcs | Where-Object { $_.ProcessName -match '^(CalculatorApp|calc)$' } | Select-Object -First 1
    if ($calcProc -and -not $seen.ContainsKey("calculatorapp.exe")) {
        $seen["calculatorapp.exe"] = $true
        $apps.Add(@{
            name = "CalculatorApp.exe"
            pid = [int]$calcProc.Id
            mem_mb = [math]::Round($calcProc.WorkingSet64 / 1MB)
            title = "Calculadora"
        })
    }

    return $apps
}

function Show-Alert($msg) {
    try {
        (New-Object -ComObject WScript.Shell).Popup($msg, 15, "SentinelPC Controlo Parental", 48) | Out-Null
    } catch {}
}

# Inicializar ou carregar contador local diario de tempo
$dailyUsageFile = "$env:ProgramData\\SentinelPC\\daily_usage.json"
$todayStr = (Get-Date).ToString("yyyy-MM-dd")
$localUsage = @{ date = $todayStr; activeSeconds = 0; apps = @{} }
if (Test-Path $dailyUsageFile) {
    try {
        $saved = Get-Content $dailyUsageFile -Raw -ErrorAction SilentlyContinue | ConvertFrom-Json
        if ($saved -and $saved.date -eq $todayStr) {
            $localUsage.activeSeconds = [int]$saved.activeSeconds
            if ($saved.apps) {
                foreach ($prop in $saved.apps.PSObject.Properties) {
                    $localUsage.apps[$prop.Name] = [int]$prop.Value
                }
            }
        }
    } catch {}
}

Write-Host "[SentinelPC] Agente em comunicacao continua com $ServerUrl..." -ForegroundColor Cyan

while ($true) {
    try {
        # 1. Reset diario a meia-noite se a data mudar
        $currDay = (Get-Date).ToString("yyyy-MM-dd")
        if ($localUsage.date -ne $currDay) {
            $localUsage = @{ date = $currDay; activeSeconds = 0; apps = @{} }
        }

        # 2. Deteta app em primeiro plano e inatividade do teclado/rato
        $fg = Get-ActiveAppInfo
        $idle = 0
        try {
            if ([System.Management.Automation.PSTypeName]'SentinelNativeW'.Type) {
                $idle = [SentinelNativeW]::IdleMs()
            }
        } catch {}

        $activeName = if ($fg) { $fg.name } else { "idle" }
        $activeTitle = if ($fg) { $fg.title } else { "" }

        # Se houve atividade do utilizador nos ultimos 5 minutos (< 300.000ms), acumula tempo ativo
        if ($idle -lt 300000) {
            $localUsage.activeSeconds += 10
            if ($activeName -and $activeName -ne "idle") {
                if (-not $localUsage.apps[$activeName]) { $localUsage.apps[$activeName] = 0 }
                $localUsage.apps[$activeName] += 10
            }
            try {
                $localUsage | ConvertTo-Json -Compress | Set-Content $dailyUsageFile -Force -ErrorAction SilentlyContinue
            } catch {}
        }

        # 3. Lista completa de programas e processos abertos
        $procs = @(Get-RunningAppsList)

        # 4. Metricas de Hardware
        $os = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
        $cpu = (Get-CimInstance Win32_Processor -ErrorAction SilentlyContinue | Measure-Object -Property LoadPercentage -Average).Average
        $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'" -ErrorAction SilentlyContinue

        $hw = @{
            cpuPercent = if ($cpu) { [int]$cpu } else { 10 }
            totalRamMb = if ($os) { [int]($os.TotalVisibleMemorySize / 1024) } else { 16384 }
            freeRamMb = if ($os) { [int]($os.FreePhysicalMemory / 1024) } else { 8192 }
            diskTotalGb = if ($disk) { [math]::Round($disk.Size / 1GB, 1) } else { 500 }
            diskFreeGb = if ($disk) { [math]::Round($disk.FreeSpace / 1GB, 1) } else { 250 }
            uptimeSeconds = if ($os) { [int]((Get-Date) - $os.LastBootUpTime).TotalSeconds } else { 3600 }
        }

        # 5. Envia telemetria via HTTP REST para o servidor
        $body = @{
            targetMachine = $env:COMPUTERNAME
            targetUser = $env:USERNAME
            activeProcess = $activeName
            activeTitle = $activeTitle
            idleMs = [int]$idle
            activeSecondsToday = [int]$localUsage.activeSeconds
            appTimes = $localUsage.apps
            runningProcesses = $procs
            hardware = $hw
            osVersion = if ($os) { $os.Caption } else { "Windows 11" }
        } | ConvertTo-Json -Compress -Depth 4

        $res = Invoke-RestMethod -Uri "$ServerUrl/api/report" -Method Post -ContentType "application/json; charset=utf-8" -Body $body -TimeoutSec 8

        # 6. Executa Acoes Imediatas e Fila de Comandos recebidos do servidor
        if ($res.action) {
            if ($res.action.type -eq "kill" -and $res.action.process) {
                $pName = ($res.action.process -replace '\.exe$','')
                Stop-Process -Name $pName -Force -ErrorAction SilentlyContinue
                Show-Alert "Limite diário esgotado para esta aplicação."
            }
            if ($res.action.type -eq "lock_screen") {
                rundll32.exe user32.dll,LockWorkStation
            }
        }

        if ($res.pendingActions -and $res.pendingActions.Count -gt 0) {
            foreach ($act in $res.pendingActions) {
                if ($act.type -eq "kill" -and $act.pid) {
                    Stop-Process -Id [int]$act.pid -Force -ErrorAction SilentlyContinue
                }
                if ($act.type -eq "killall" -and $act.name) {
                    Stop-Process -Name ($act.name -replace '\.exe$','') -Force -ErrorAction SilentlyContinue
                }
                if ($act.type -eq "msg" -and $act.text) {
                    Show-Alert $act.text
                }
                if ($act.type -eq "power") {
                    if ($act.action -eq "logoff") { logoff }
                    if ($act.action -eq "shutdown") { shutdown /s /t 60 /c "O computador vai desligar em 60 segundos por ordem dos pais." }
                    if ($act.action -eq "restart") { shutdown /r /t 60 /c "O computador vai reiniciar em 60 segundos." }
                    if ($act.action -eq "cancel") { shutdown /a }
                }
            }
        }

    } catch {
        # Resiliente: se o servidor estiver temporariamente indisponivel, continua em loop
    }

    Start-Sleep -Seconds 10
}
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(script);
});

// 16. Servir Instalador Automático de 1 Linha (install.ps1)
app.get('/api/agent/install.ps1', (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.get('host') || '127.0.0.1:3000';
  const rawProto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const protocol = rawProto.split(',')[0].trim();
  const serverUrl = `${protocol}://${host}`;

  const script = `# ================================================================
# SentinelPC - Instalador do Agente Cliente Windows Nativo
# Servidor Central: ${serverUrl}
# ================================================================
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " [SentinelPC] A instalar o Agente de Comunicacao HTTP no Windows... " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$d = "$env:ProgramData\\SentinelPC"
if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }

# 1. Adiciona exclusao no Windows Defender para a pasta do agente
try { Add-MpPreference -ExclusionPath $d -ErrorAction SilentlyContinue } catch {}

# 2. Descarrega script vigia.ps1 do servidor
$vigiaPath = "$d\\vigia.ps1"
Write-Host "[1/4] A descarregar script vigia.ps1 de ${serverUrl}..."
Invoke-WebRequest -Uri "${serverUrl}/api/agent/vigia.ps1" -OutFile $vigiaPath -UseBasicParsing

# 3. Cria atalhos nativos (.lnk) nas pastas Startup do Windows (All Users & Current User)
Write-Host "[2/4] A configurar arranque automatico no login (Startup Shortcuts)..."
try {
    $WshShell = New-Object -ComObject WScript.Shell
    $scArgs = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $vigiaPath + '"'

    # Startup Comum (All Users)
    $startupAll = "$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
    if (Test-Path $startupAll) {
        $scAll = $WshShell.CreateShortcut("$startupAll\\SentinelPC.lnk")
        $scAll.TargetPath = "powershell.exe"
        $scAll.Arguments = $scArgs
        $scAll.WindowStyle = 7
        $scAll.Description = "SentinelPC Agente de Monitorizacao"
        $scAll.Save()
    }

    # Startup do Utilizador Atual
    $userStartup = "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
    if (Test-Path $userStartup) {
        $scUser = $WshShell.CreateShortcut("$userStartup\\SentinelPC.lnk")
        $scUser.TargetPath = "powershell.exe"
        $scUser.Arguments = $scArgs
        $scUser.WindowStyle = 7
        $scUser.Description = "SentinelPC Agente de Monitorizacao"
        $scUser.Save()
    }
} catch {}

# 4. Regista no Windows Registry Run (HKLM e HKCU para redundancia total)
Write-Host "[3/4] A registar arranque no Registry do Windows (HKLM & HKCU Run)..."
try {
    $runCmd = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $vigiaPath + '"'
    Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "SentinelWatcher" -Value $runCmd -Force -ErrorAction SilentlyContinue | Out-Null
    Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "SentinelWatcher" -Value $runCmd -Force -ErrorAction SilentlyContinue | Out-Null
} catch {}

# 5. Regista Tarefa Agendada no Windows ao iniciar sessao
try {
    $taskTr = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \"' + $vigiaPath + '\"'
    schtasks /create /tn "SentinelWatcher" /tr $taskTr /sc onlogon /f | Out-Null
} catch {}

# 6. Termina eventuais processos antigos ou bloqueados
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { 
    $_.CommandLine -like '*vigia.ps1*' -or $_.CommandLine -like '*SentinelWatcher*' 
} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

# 7. Iniciar imediatamente no desktop atual
Write-Host "[4/4] A iniciar o agente imediatamente no ambiente de trabalho..."
Start-Process powershell.exe -ArgumentList $scArgs

Write-Host ""
Write-Host "[✓] Agente instalado com sucesso e associado ao login do Windows!" -ForegroundColor Green
Write-Host "[✓] O agente arranca automaticamente ao fazer login e monitoriza todas as aplicacoes." -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(script);
});

// 17. Desinstalador do Agente Windows (uninstall.ps1)
app.get('/api/agent/uninstall.ps1', (req, res) => {
  const script = `# ================================================================
# SentinelPC - Desinstalador do Agente Windows
# ================================================================
schtasks /delete /tn "SentinelWatcher" /f -ErrorAction SilentlyContinue | Out-Null
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "SentinelWatcher" -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "SentinelWatcher" -ErrorAction SilentlyContinue
Remove-Item "$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\SentinelPC.lnk" -Force -ErrorAction SilentlyContinue
Remove-Item "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\SentinelPC.lnk" -Force -ErrorAction SilentlyContinue
Remove-Item "$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\SentinelWatcher.vbs" -Force -ErrorAction SilentlyContinue
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*vigia.ps1*' -or $_.CommandLine -like '*SentinelWatcher*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Remove-Item -Path "$env:ProgramData\\SentinelPC" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "[✓] SentinelPC desinstalado completamente do computador." -ForegroundColor Yellow
`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(script);
});

// 18. Ping real com validação ICMP / TCP
app.post('/api/ping', async (req, res) => {
  const { ip, port } = req.body;
  if (!ip || typeof ip !== 'string') {
    return res.status(400).json({ success: false, online: false, error: 'Endereço IP ou hostname não fornecido' });
  }

  const cleanIp = ip.trim().replace(/[^a-zA-Z0-9.-]/g, '');
  if (!cleanIp) {
    return res.status(400).json({ success: false, online: false, error: 'Endereço IP inválido' });
  }

  const targetPort = port ? parseInt(port, 10) : null;
  const startTime = Date.now();

  try {
    const { stdout } = await execAsync(`ping -c 1 -W 2 ${cleanIp}`, { timeout: 2500 });
    const isPacketLoss = stdout.includes('100% packet loss') || stdout.includes('100% loss') || /0 (packets )?received/i.test(stdout);
    const isUnreachable = /unreachable|unknown host|Name or service not known/i.test(stdout);
    const match = stdout.match(/time=([\d.]+)\s*ms/) || stdout.match(/rtt min\/avg\/max\/mdev = [\d.]+\/([\d.]+)/);

    if (isPacketLoss || isUnreachable || !match || !match[1]) {
      throw new Error('ICMP echo sem resposta ou pacote perdido');
    }

    const latency = Math.round(parseFloat(match[1])) || 1;
    return res.json({
      success: true,
      online: true,
      latency,
      method: 'icmp',
      message: `Host ${cleanIp} respondeu ao ICMP Echo (${latency}ms)`,
    });
  } catch (icmpErr: any) {
    const probePort = targetPort && targetPort > 0 ? targetPort : 5985;

    try {
      const tcpResult = await new Promise<{ online: boolean; latency: number }>((resolve, reject) => {
        const t0 = Date.now();
        const socket = new net.Socket();
        socket.setTimeout(1800);

        socket.on('connect', () => {
          const lat = Date.now() - t0;
          socket.destroy();
          resolve({ online: true, latency: lat });
        });

        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error('timeout'));
        });

        socket.on('error', (err) => {
          socket.destroy();
          reject(err);
        });

        socket.connect(probePort, cleanIp);
      });

      if (tcpResult.online) {
        return res.json({
          success: true,
          online: true,
          latency: tcpResult.latency,
          method: 'tcp',
          port: probePort,
          message: `Porta ${probePort} no host ${cleanIp} aberta e a responder (${tcpResult.latency}ms)`,
        });
      }
    } catch {}

    return res.json({
      success: true,
      online: false,
      latency: null,
      error: `Inalcançável: Nenhuma resposta de ${cleanIp} (Host offline ou não associado na rede)`,
    });
  }
});

// 19. Reset de dados do agente
app.post('/api/reset', (req, res) => {
  currentState.isRealData = true;
  currentState.apps = [];
  currentState.hourlyActivity = Array.from({ length: 15 }, (_, i) => ({
    hour: i + 8,
    games: 0,
    social: 0,
    study: 0,
    browsing: 0,
    other: 0,
  }));
  const activePc = getActivePc();
  activePc.isOnline = false;
  activePc.lastSeen = 'Nunca';
  currentState.runningProcesses[activePc.id] = [];
  currentState.pendingActions[activePc.id] = [];
  currentState.agent.lastSyncTime = 'Nunca';
  currentState.agent.processesCount = 0;
  currentState.agent.taskStatus = 'À espera de relatórios do agente...';

  currentState.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('pt-PT'),
    type: 'info',
    message: `Dados e contadores de ${activePc.nome} repostos a zero.`,
    source: 'servidor',
  });

  saveState();
  res.json({ success: true, state: currentState });
});

// 20. GitHub Status
app.get('/api/admin/github-status', async (req, res) => {
  try {
    const updateFile = path.join(DATA_DIR, 'last_update.json');
    let lastUpdateInfo: any = {};
    if (fs.existsSync(updateFile)) {
      try {
        lastUpdateInfo = JSON.parse(fs.readFileSync(updateFile, 'utf-8'));
      } catch {}
    }

    const appDir = fs.existsSync(path.join(__dirname, 'package.json'))
      ? __dirname
      : (fs.existsSync('/opt/control_pc') ? '/opt/control_pc' : process.cwd());
    let localCommit = lastUpdateInfo.commit || 'unknown';

    try {
      const { stdout } = await execAsync('git rev-parse --short HEAD', { cwd: appDir });
      if (stdout.trim()) {
        localCommit = stdout.trim();
      }
    } catch {}

    let remoteCommit = 'eb3aaba';
    try {
      const { stdout } = await execAsync('git ls-remote https://github.com/wsmigas/Control_PC.git HEAD', { timeout: 8000 });
      const firstPart = stdout.trim().split(/\s+/)[0];
      if (firstPart) {
        remoteCommit = firstPart.substring(0, 7);
      }
    } catch {}

    res.json({
      success: true,
      directory: appDir,
      localCommit,
      remoteCommit,
      isUpToDate: localCommit !== 'unknown' && localCommit === remoteCommit,
      lastUpdated: lastUpdateInfo.lastUpdated || null,
      repoUrl: 'https://github.com/wsmigas/Control_PC.git',
    });
  } catch (err: any) {
    res.json({
      success: false,
      error: err.message,
      repoUrl: 'https://github.com/wsmigas/Control_PC.git',
    });
  }
});

// 21. GitHub Update
app.post('/api/admin/github-update', async (req, res) => {
  const logs: string[] = [];
  const addLog = (msg: string) => {
    logs.push(msg);
    console.log(`[GitHub Update] ${msg}`);
  };

  const appDir = fs.existsSync(path.join(__dirname, 'package.json'))
    ? __dirname
    : (fs.existsSync('/opt/control_pc') ? '/opt/control_pc' : process.cwd());
  addLog(`[1/5] Início da atualização no diretório: ${appDir}`);

  try {
    const scriptPath = path.join(__dirname, 'update_from_github.sh');
    let updateCmd = `bash "${scriptPath}" "${appDir}"`;
    if (!fs.existsSync(scriptPath)) {
      updateCmd = `cd "${appDir}" && git fetch origin main && git reset --hard origin/main && npm install --legacy-peer-deps --no-audit && npm run build`;
    }

    addLog(`[2/5] A sincronizar com https://github.com/wsmigas/Control_PC.git e a compilar nova versão...`);

    const { stdout, stderr } = await execAsync(updateCmd, {
      cwd: appDir,
      timeout: 180000,
      env: { ...process.env, PATH: process.env.PATH },
    });

    if (stdout) {
      stdout.split('\n').map(l => l.trim()).filter(Boolean).forEach(l => logs.push(l));
    }
    if (stderr && stderr.includes('error:')) {
      logs.push(`[AVISO] ${stderr.trim()}`);
    }

    let currentCommit = 'latest';
    try {
      const { stdout: commitOut } = await execAsync('git rev-parse --short HEAD', { cwd: appDir });
      currentCommit = commitOut.trim();
    } catch {}

    const nowIso = new Date().toISOString();
    const updateInfo = {
      lastUpdated: nowIso,
      commit: currentCommit,
    };
    try {
      fs.writeFileSync(path.join(DATA_DIR, 'last_update.json'), JSON.stringify(updateInfo, null, 2), 'utf-8');
    } catch {}

    currentState.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-PT'),
      type: 'success',
      message: `Painel SentinelPC atualizado via GitHub com sucesso (Commit ${currentCommit}).`,
      source: 'update_from_github',
    });
    saveState();

    addLog(`[✓] Sucesso: Aplicação compilada e atualizada na versão ${currentCommit}!`);

    res.json({
      success: true,
      logs,
      commit: currentCommit,
      message: `Painel atualizado com sucesso! (Versão: ${currentCommit})`,
    });
  } catch (err: any) {
    const errMsg = err.message || 'Falha durante execução do script de atualização';
    addLog(`[FALHA] ${errMsg}`);
    if (err.stdout) {
      err.stdout.split('\n').map((l: string) => l.trim()).filter(Boolean).forEach((l: string) => logs.push(l));
    }
    if (err.stderr) {
      err.stderr.split('\n').map((l: string) => l.trim()).filter(Boolean).forEach((l: string) => logs.push(`[STDERR] ${l}`));
    }

    res.status(500).json({
      success: false,
      logs,
      error: errMsg,
    });
  }
});

// -----------------------------------------------------------------------------
// FRONTEND SERVER SETUP
// -----------------------------------------------------------------------------

async function startServer() {
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SentinelPC] Servidor ativo em http://0.0.0.0:${PORT}`);
  });
}

startServer();
