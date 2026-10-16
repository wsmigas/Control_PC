export type AppCategory = 'games' | 'social' | 'study' | 'browsing' | 'creative' | 'system';

export interface AppUsageRecord {
  id: string;
  processName: string;
  displayName: string;
  iconType: string;
  category: AppCategory;
  minutesToday: number;
  dailyLimitMinutes: number | null; // null means unrestricted
  status: 'running' | 'idle' | 'blocked';
  windowTitle?: string;
  lastActiveTime: string;
  isRestricted: boolean;
  allowedDays?: number[]; // [0,1,2,3,4,5,6] (0=Dom, 1=Seg.. 6=Sab). Empty = blocked permanently
  memMb?: number;
  pid?: number;
}

export interface ProcessItem {
  name: string;
  pid: number;
  session?: string;
  mem_mb: number;
  cpu?: number;
  title: string;
  isProtected?: boolean;
}

export interface HardwareState {
  cpuPercent: number;
  totalRamMb: number;
  freeRamMb: number;
  diskTotalGb: number;
  diskFreeGb: number;
  uptimeSeconds: number;
  tempMedia: number | null;
  lastUpdateTs?: number;
}

export interface HourlyActivity {
  hour: number; // 8 to 22
  games: number;
  social: number;
  study: number;
  browsing: number;
  other: number;
}

export interface CurfewDaySchedule {
  dayId: string;
  dayName: string;
  shortName: string;
  isSchoolDay: boolean;
  enabled: boolean;
  startHour: string; // "08:00"
  endHour: string;   // "21:30"
  maxMinutes: number; // 210 = 3h30m
}

export interface BlockedDomain {
  id: string;
  domain: string;
  category: string;
  active: boolean;
  hitsToday: number;
  addedDate: string;
  isWildcard?: boolean; // *.domain (NRPT DNS rule)
}

export interface PCConfig {
  id: string;
  nome: string;
  host: string;
  ssh_user?: string;
  ssh_password?: string;
  ssh_key?: string;
  target_user: string;
  port?: number;
  connectionMethod: 'agent_poll' | 'ssh';
  isOnline?: boolean;
  lastSeen?: string;
  lastSeenTs?: number;
}

export interface PendingAction {
  id: string;
  pcId?: string;
  type: 'kill' | 'killall' | 'msg' | 'power' | 'lock_screen';
  pid?: number;
  name?: string;
  text?: string;
  action?: 'logoff' | 'shutdown' | 'restart' | 'cancel';
  timestamp: number;
}

export interface AgentIntegrity {
  targetUser: string;
  targetMachine: string;
  ipAddress: string;
  port: number;
  connectionMethod: 'agent_poll' | 'ssh' | 'winrm';
  pollingIntervalSeconds: number;
  osVersion: string;
  version: string;
  processesCount: number;
  taskStatus: string;
  sha256Hash: string;
  hashVerified: boolean;
  lastSyncTime: string;
  emergencyLock: boolean;
  bonusMinutes: number;
  installationStatus: 'installed' | 'installing' | 'not_installed' | 'error';
  optInstallPath: string;
  hardware?: HardwareState;
  screenTimeMinutesToday?: number;
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  message: string;
  source: string;
}

export function formatMinutesToHuman(minutes: number): string {
  const m = Math.round(minutes);
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem.toString().padStart(2, '0')}m`;
}

export function formatBytesToGb(mb: number): string {
  return (mb / 1024).toFixed(1) + ' GB';
}
