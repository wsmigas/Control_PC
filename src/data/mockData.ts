import { AppUsageRecord, CurfewDaySchedule, BlockedDomain, AgentIntegrity, HourlyActivity, SystemLogEntry } from '../types';

export const INITIAL_APPS: AppUsageRecord[] = [
  {
    id: 'app-roblox',
    processName: 'RobloxPlayerBeta.exe',
    displayName: 'Roblox',
    iconType: 'gamepad',
    category: 'games',
    minutesToday: 75,
    dailyLimitMinutes: 90,
    status: 'running',
    windowTitle: 'Roblox - Blox Fruits [Sea 3]',
    lastActiveTime: 'Agora mesmo',
    isRestricted: true,
  },
  {
    id: 'app-discord',
    processName: 'Discord.exe',
    displayName: 'Discord',
    iconType: 'message-square',
    category: 'social',
    minutesToday: 55,
    dailyLimitMinutes: 60,
    status: 'running',
    windowTitle: '#geral - Grupo Turma 9B',
    lastActiveTime: 'Agora mesmo',
    isRestricted: true,
  },
  {
    id: 'app-vscode',
    processName: 'Code.exe',
    displayName: 'Visual Studio Code',
    iconType: 'code',
    category: 'study',
    minutesToday: 95,
    dailyLimitMinutes: null, // Unlimited for study
    status: 'idle',
    windowTitle: 'projeto-ciencias - Visual Studio Code',
    lastActiveTime: 'Há 18 min',
    isRestricted: false,
  },
  {
    id: 'app-chrome',
    processName: 'chrome.exe',
    displayName: 'Google Chrome',
    iconType: 'globe',
    category: 'browsing',
    minutesToday: 42,
    dailyLimitMinutes: 120,
    status: 'running',
    windowTitle: 'YouTube - Documentário sobre o Espaço',
    lastActiveTime: 'Agora mesmo',
    isRestricted: true,
  },
  {
    id: 'app-minecraft',
    processName: 'javaw.exe',
    displayName: 'Minecraft (Java Edition)',
    iconType: 'box',
    category: 'games',
    minutesToday: 45,
    dailyLimitMinutes: 90,
    status: 'idle',
    windowTitle: 'Minecraft 1.20.4',
    lastActiveTime: 'Há 2h 10m',
    isRestricted: true,
  },
  {
    id: 'app-steam',
    processName: 'steam.exe',
    displayName: 'Steam Client',
    iconType: 'layers',
    category: 'games',
    minutesToday: 20,
    dailyLimitMinutes: 90,
    status: 'idle',
    windowTitle: 'Steam',
    lastActiveTime: 'Há 3h 05m',
    isRestricted: true,
  },
  {
    id: 'app-spotify',
    processName: 'Spotify.exe',
    displayName: 'Spotify',
    iconType: 'music',
    category: 'creative',
    minutesToday: 60,
    dailyLimitMinutes: null,
    status: 'running',
    windowTitle: 'Spotify Free - Lo-Fi Beats',
    lastActiveTime: 'Agora mesmo',
    isRestricted: false,
  },
  {
    id: 'app-word',
    processName: 'WINWORD.EXE',
    displayName: 'Microsoft Word',
    iconType: 'file-text',
    category: 'study',
    minutesToday: 35,
    dailyLimitMinutes: null,
    status: 'idle',
    windowTitle: 'Trabalho_Historia_SecXX.docx',
    lastActiveTime: 'Há 4h 15m',
    isRestricted: false,
  },
];

export const INITIAL_HOURLY_ACTIVITY: HourlyActivity[] = [
  { hour: 8, games: 0, social: 0, study: 0, browsing: 0, other: 0 },
  { hour: 9, games: 0, social: 0, study: 25, browsing: 10, other: 5 },
  { hour: 10, games: 0, social: 5, study: 40, browsing: 8, other: 0 },
  { hour: 11, games: 0, social: 0, study: 30, browsing: 5, other: 10 },
  { hour: 12, games: 15, social: 15, study: 0, browsing: 10, other: 5 },
  { hour: 13, games: 20, social: 10, study: 0, browsing: 15, other: 5 },
  { hour: 14, games: 0, social: 0, study: 0, browsing: 0, other: 0 }, // School/out
  { hour: 15, games: 0, social: 0, study: 0, browsing: 0, other: 0 },
  { hour: 16, games: 0, social: 10, study: 0, browsing: 12, other: 10 },
  { hour: 17, games: 10, social: 15, study: 35, browsing: 8, other: 15 },
  { hour: 18, games: 45, social: 5, study: 0, browsing: 12, other: 10 },
  { hour: 19, games: 50, social: 10, study: 0, browsing: 0, other: 0 }, // Active gaming now
  { hour: 20, games: 0, social: 0, study: 0, browsing: 0, other: 0 },
  { hour: 21, games: 0, social: 0, study: 0, browsing: 0, other: 0 },
  { hour: 22, games: 0, social: 0, study: 0, browsing: 0, other: 0 },
];

export const INITIAL_CURFEW_SCHEDULE: CurfewDaySchedule[] = [
  {
    dayId: 'mon',
    dayName: 'Segunda-feira',
    shortName: 'Seg',
    isSchoolDay: true,
    enabled: true,
    startHour: '08:00',
    endHour: '21:30',
    maxMinutes: 210, // 3h 30m
  },
  {
    dayId: 'tue',
    dayName: 'Terça-feira',
    shortName: 'Ter',
    isSchoolDay: true,
    enabled: true,
    startHour: '08:00',
    endHour: '21:30',
    maxMinutes: 210,
  },
  {
    dayId: 'wed',
    dayName: 'Quarta-feira',
    shortName: 'Qua',
    isSchoolDay: true,
    enabled: true,
    startHour: '08:00',
    endHour: '21:30',
    maxMinutes: 210,
  },
  {
    dayId: 'thu',
    dayName: 'Quinta-feira',
    shortName: 'Qui',
    isSchoolDay: true,
    enabled: true,
    startHour: '08:00',
    endHour: '21:30',
    maxMinutes: 210,
  },
  {
    dayId: 'fri',
    dayName: 'Sexta-feira',
    shortName: 'Sex',
    isSchoolDay: true,
    enabled: true,
    startHour: '08:00',
    endHour: '23:00',
    maxMinutes: 300, // 5h 00m
  },
  {
    dayId: 'sat',
    dayName: 'Sábado',
    shortName: 'Sáb',
    isSchoolDay: false,
    enabled: true,
    startHour: '09:00',
    endHour: '23:30',
    maxMinutes: 360, // 6h 00m
  },
  {
    dayId: 'sun',
    dayName: 'Domingo',
    shortName: 'Dom',
    isSchoolDay: false,
    enabled: true,
    startHour: '09:00',
    endHour: '21:30',
    maxMinutes: 240, // 4h 00m
  },
];

export const INITIAL_BLOCKED_DOMAINS: BlockedDomain[] = [
  {
    id: 'dom-1',
    domain: 'tiktok.com',
    category: 'Redes Sociais',
    active: true,
    hitsToday: 14,
    addedDate: '2026-10-01',
  },
  {
    id: 'dom-2',
    domain: 'instagram.com',
    category: 'Redes Sociais',
    active: true,
    hitsToday: 8,
    addedDate: '2026-10-01',
  },
  {
    id: 'dom-3',
    domain: 'betclic.pt',
    category: 'Apostas / Jogos de Azar',
    active: true,
    hitsToday: 0,
    addedDate: '2026-09-15',
  },
  {
    id: 'dom-4',
    domain: 'steamcommunity.com/market',
    category: 'Compras em Jogos',
    active: false,
    hitsToday: 3,
    addedDate: '2026-10-05',
  },
  {
    id: 'dom-5',
    domain: 'omegle.com',
    category: 'Chat Inapropriado',
    active: true,
    hitsToday: 0,
    addedDate: '2026-09-10',
  },
];

export const INITIAL_AGENT: AgentIntegrity = {
  targetUser: 'Tomas',
  targetMachine: 'PC-QUARTO-WIN11',
  ipAddress: '192.168.1.145',
  port: 5985,
  connectionMethod: 'winrm',
  pollingIntervalSeconds: 60,
  osVersion: 'Windows 11 Pro 23H2 (Build 22631)',
  version: '2.4.2-blobs',
  processesCount: 4,
  taskStatus: 'Pronta / Em Execução (Tarefa Agendada SentinelWatcher)',
  sha256Hash: '9a7e3b18c6e245a498263158f9104b901a82e75306e00b65cf5480e6113b2c1f',
  hashVerified: true,
  lastSyncTime: 'Há 12 segundos',
  emergencyLock: false,
  bonusMinutes: 0,
  installationStatus: 'installed',
  optInstallPath: '/opt/control_pc',
};

export const INITIAL_LOGS: SystemLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '19:15:02',
    type: 'info',
    message: 'Agente sincronizou com sucesso. Processos ativos: 4, Hash SHA256 validado.',
    source: 'agente.ps1',
  },
  {
    id: 'log-2',
    timestamp: '18:55:40',
    type: 'warning',
    message: 'Aviso emitido para Roblox: 15 minutos restantes do limite diário.',
    source: 'vigia.ps1',
  },
  {
    id: 'log-3',
    timestamp: '18:00:15',
    type: 'info',
    message: 'Processo RobloxPlayerBeta.exe detetado e contabilização de tempo iniciada.',
    source: 'vigia.ps1',
  },
  {
    id: 'log-4',
    timestamp: '17:15:30',
    type: 'alert',
    message: 'Tentativa de acesso bloqueada para tiktok.com via redirecionamento de hosts.',
    source: 'hosts',
  },
  {
    id: 'log-5',
    timestamp: '14:20:00',
    type: 'info',
    message: 'Sessão do utilizador em pausa automática (inatividade detetada).',
    source: 'agente.ps1',
  },
];

// Helper to format minutes into readable "2h 45m"
export function formatMinutesToHuman(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

// Generates the chunked Base64 blob matching the user's Python patch:
// def blob(var, texto, bom=False, tam=2000):
export function generatePowerShellBlobString(varName: string, text: string, chunkSize = 2000): string {
  // Convert string to base64
  const utf8Bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const b64 = btoa(binary);

  const chunks: string[] = [];
  for (let i = 0; i < b64.length; i += chunkSize) {
    chunks.push(b64.slice(i, i + chunkSize));
  }

  const lines = [`$${varName} = ''`];
  for (const chunk of chunks) {
    lines.push(`$${varName} += '${chunk}'`);
  }
  return lines.join('\n');
}

// Generates the real regras.json content based on UI state
export function generateRegrasJson(apps: AppUsageRecord[], curfew: CurfewDaySchedule[], blockedDomains: BlockedDomain[]) {
  const rules = {
    versao: '2.4.2',
    gerado_em: new Date().toISOString(),
    limites_aplicacoes: apps
      .filter((a) => a.dailyLimitMinutes !== null || a.isRestricted)
      .map((a) => ({
        processo: a.processName,
        nome: a.displayName,
        categoria: a.category,
        limite_minutos: a.dailyLimitMinutes,
        bloqueado: a.status === 'blocked',
      })),
    horarios_curfew: curfew.map((c) => ({
      dia: c.dayId,
      nome: c.dayName,
      ativo: c.enabled,
      inicio: c.startHour,
      fim_recolher: c.endHour,
      quota_max_minutos: c.maxMinutes,
    })),
    dominios_bloqueados: blockedDomains
      .filter((d) => d.active)
      .map((d) => d.domain),
    aviso_antecedencia_minutos: [15, 5, 1],
    acao_ao_esgotar: 'minimizar_e_bloquear',
  };

  return JSON.stringify(rules, null, 2);
}

// Generates the hosts file block matching the patch
export function generateHostsBlock(blockedDomains: BlockedDomain[]): string {
  const active = blockedDomains.filter((d) => d.active);
  const lines = [
    '# --- SENTINELPC BLOQUEIO PARENTAL INICIO ---',
    ...active.map((d) => `0.0.0.0 ${d.domain}\n0.0.0.0 www.${d.domain}`),
    '# --- SENTINELPC BLOQUEIO PARENTAL FIM ---',
  ];
  return lines.join('\n');
}
