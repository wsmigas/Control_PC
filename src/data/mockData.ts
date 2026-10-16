import { AppUsageRecord, CurfewDaySchedule, BlockedDomain, AgentIntegrity, HourlyActivity, SystemLogEntry } from '../types';

export const INITIAL_APPS: AppUsageRecord[] = [];

export const INITIAL_HOURLY_ACTIVITY: HourlyActivity[] = Array.from({ length: 15 }, (_, i) => ({
  hour: i + 8,
  games: 0,
  social: 0,
  study: 0,
  browsing: 0,
  other: 0,
}));

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
    hitsToday: 0,
    addedDate: '2026-10-12',
  },
  {
    id: 'dom-2',
    domain: 'instagram.com',
    category: 'Redes Sociais',
    active: true,
    hitsToday: 0,
    addedDate: '2026-10-12',
  },
  {
    id: 'dom-3',
    domain: 'betclic.pt',
    category: 'Apostas / Jogos de Azar',
    active: true,
    hitsToday: 0,
    addedDate: '2026-10-12',
  },
];

export const INITIAL_AGENT: AgentIntegrity = {
  targetUser: 'Filho',
  targetMachine: 'PC-WINDOWS',
  ipAddress: '192.168.1.120',
  port: 5985,
  connectionMethod: 'agent_poll',
  pollingIntervalSeconds: 3,
  osVersion: 'Windows 10/11',
  version: '2.4.2-blobs',
  processesCount: 0,
  taskStatus: 'À espera de relatórios do agente...',
  sha256Hash: '9a7e3b18c6e245a498263158f9104b901a82e75306e00b65cf5480e6113b2c1f',
  hashVerified: false,
  lastSyncTime: 'A aguardar primeira conexão',
  emergencyLock: false,
  bonusMinutes: 0,
  installationStatus: 'not_installed',
  optInstallPath: '/opt/control_pc',
};

export const INITIAL_LOGS: SystemLogEntry[] = [
  {
    id: 'log-1',
    timestamp: 'Agora',
    type: 'info',
    message: 'Sistema em Modo de Produção. Servidor em escuta na porta 3000 para receber relatórios reais do vigia.ps1.',
    source: 'servidor',
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
