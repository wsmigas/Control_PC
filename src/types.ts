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
}

export interface AgentIntegrity {
  targetUser: string;
  targetMachine: string;
  ipAddress: string;
  port: number;
  connectionMethod: 'winrm' | 'agent_poll' | 'ssh';
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
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  message: string;
  source: string;
}

export function formatMinutesToHuman(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}
