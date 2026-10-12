import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Persistent state directory
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'state.json');

// Default initial state
const defaultState = {
  isRealData: false,
  agent: {
    targetUser: 'Filho',
    targetMachine: 'PC-WINDOWS',
    ipAddress: '192.168.1.145',
    port: 5985,
    connectionMethod: 'winrm',
    pollingIntervalSeconds: 60,
    osVersion: 'Windows 10/11',
    version: '2.4.2-blobs',
    processesCount: 0,
    taskStatus: 'A aguardar primeira ligação do agente...',
    sha256Hash: '9a7e3b18c6e245a498263158f9104b901a82e75306e00b65cf5480e6113b2c1f',
    hashVerified: false,
    lastSyncTime: 'Nunca',
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
    { id: 'dom-1', domain: 'tiktok.com', category: 'Redes Sociais', active: true, hitsToday: 0, addedDate: new Date().toISOString().split('T')[0] },
    { id: 'dom-2', domain: 'instagram.com', category: 'Redes Sociais', active: true, hitsToday: 0, addedDate: new Date().toISOString().split('T')[0] },
    { id: 'dom-3', domain: 'betclic.pt', category: 'Apostas', active: true, hitsToday: 0, addedDate: new Date().toISOString().split('T')[0] },
  ],
  logs: [
    {
      id: 'log-init',
      timestamp: new Date().toLocaleTimeString('pt-PT'),
      type: 'info',
      message: 'Servidor SentinelPC inicializado. A aguardar conexão do agente Windows.',
      source: 'server',
    },
  ],
};

function loadState() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
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

// Category helper
function categorizeProcess(processName: string): 'games' | 'social' | 'study' | 'browsing' | 'creative' | 'system' {
  const p = processName.toLowerCase();
  if (p.includes('roblox') || p.includes('minecraft') || p.includes('steam') || p.includes('fortnite') || p.includes('epic') || p.includes('valorant') || p.includes('javaw')) {
    return 'games';
  }
  if (p.includes('discord') || p.includes('whatsapp') || p.includes('telegram') || p.includes('tiktok') || p.includes('messenger')) {
    return 'social';
  }
  if (p.includes('code') || p.includes('word') || p.includes('excel') || p.includes('powerpnt') || p.includes('notepad') || p.includes('pycharm')) {
    return 'study';
  }
  if (p.includes('chrome') || p.includes('msedge') || p.includes('firefox') || p.includes('opera') || p.includes('brave')) {
    return 'browsing';
  }
  if (p.includes('spotify') || p.includes('vlc') || p.includes('obs') || p.includes('photoshop') || p.includes('blender')) {
    return 'creative';
  }
  return 'system';
}

// -----------------------------------------------------------------------------
// API ROUTES
// -----------------------------------------------------------------------------

// 1. Get current real status
app.get('/api/status', (req, res) => {
  res.json(currentState);
});

// 2. Telemetry ingestion from real Windows agent (vigia.ps1 / agente.ps1)
app.post('/api/report', (req, res) => {
  const {
    targetMachine,
    targetUser,
    activeProcess,
    activeTitle,
    runningProcesses,
    osVersion,
  } = req.body;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-PT');
  const currentHour = now.getHours();

  currentState.isRealData = true;
  currentState.agent.lastSyncTime = 'Agora mesmo';
  currentState.agent.hashVerified = true;
  currentState.agent.installationStatus = 'installed';

  if (targetMachine) currentState.agent.targetMachine = targetMachine;
  if (targetUser) currentState.agent.targetUser = targetUser;
  if (osVersion) currentState.agent.osVersion = osVersion;

  // Track running process count
  const runningList: string[] = Array.isArray(runningProcesses) ? runningProcesses : [];
  currentState.agent.processesCount = runningList.length || 1;
  currentState.agent.taskStatus = `Ativo (Monitorizados ${runningList.length} processos)`;

  let actionToTake: { type: string; process?: string; message?: string } | null = null;

  // Process the active foreground application
  if (activeProcess && typeof activeProcess === 'string') {
    const cleanName = activeProcess.replace(/\.exe$/i, '');
    const exeName = `${cleanName}.exe`;
    const category = categorizeProcess(cleanName);

    // Find or add application
    let app = currentState.apps.find((a: any) => a.processName.toLowerCase() === exeName.toLowerCase());

    if (!app) {
      app = {
        id: `app-${cleanName.toLowerCase()}`,
        processName: exeName,
        displayName: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        iconType: 'box',
        category,
        minutesToday: 1,
        dailyLimitMinutes: category === 'games' ? 90 : category === 'social' ? 60 : null,
        status: 'running',
        windowTitle: activeTitle || '',
        lastActiveTime: 'Agora mesmo',
        isRestricted: category === 'games' || category === 'social',
      };
      currentState.apps.push(app);
    } else {
      app.minutesToday += 1; // Increment 1 active minute
      app.windowTitle = activeTitle || app.windowTitle;
      app.status = 'running';
      app.lastActiveTime = 'Agora mesmo';

      // Check if limit exceeded or manually blocked
      if (app.status === 'blocked' || (app.dailyLimitMinutes !== null && app.minutesToday >= app.dailyLimitMinutes)) {
        actionToTake = {
          type: 'kill',
          process: exeName,
          message: `Limite de tempo de ${app.displayName} atingido (${app.minutesToday}m).`,
        };
        app.status = 'blocked';
      }
    }

    // Update hourly activity
    const hourSlot = currentState.hourlyActivity.find((h: any) => h.hour === currentHour);
    if (hourSlot) {
      if (category === 'games') hourSlot.games += 1;
      else if (category === 'social') hourSlot.social += 1;
      else if (category === 'study') hourSlot.study += 1;
      else if (category === 'browsing') hourSlot.browsing += 1;
      else hourSlot.other += 1;
    }
  }

  // Check emergency lock
  if (currentState.agent.emergencyLock) {
    actionToTake = {
      type: 'lock_screen',
      message: 'Pausa Familiar ativada pelos pais.',
    };
  }

  // Add system log entry periodically
  if (currentState.logs.length === 0 || currentState.logs[0].message.includes('A aguardar')) {
    currentState.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: timeStr,
      type: 'success',
      message: `Primeiro relatório recebido com sucesso de ${currentState.agent.targetMachine}! Agente operacional.`,
      source: 'vigia.ps1',
    });
  }

  saveState();

  res.json({
    status: 'ok',
    action: actionToTake,
    emergencyLock: currentState.agent.emergencyLock,
    serverTime: now.toISOString(),
  });
});

// 3. Serve the real vigia.ps1 script dynamically configured for this server
app.get('/api/agent/vigia.ps1', (req, res) => {
  const host = req.get('host') || '127.0.0.1:3000';
  const protocol = req.protocol || 'http';
  const serverUrl = `${protocol}://${host}`;

  const script = `# ================================================================
# SentinelPC - Agente Vigia Windows (vigia.ps1)
# Servidor: ${serverUrl}
# ================================================================

$ErrorActionPreference = "SilentlyContinue"
$ServerUrl = "${serverUrl}"

Write-Host "[SentinelPC] Agente Vigia em execucao..." -ForegroundColor Cyan

while ($true) {
    try {
        # 1. Deteta a janela em primeiro plano e processos com janelas ativas
        $activeProc = Get-Process | Where-Object { $_.MainWindowTitle } | Sort-Object -Descending WS | Select-Object -First 1
        $runningProcs = (Get-Process | Where-Object { $_.MainWindowTitle } | Select-Object -ExpandProperty ProcessName)

        if ($activeProc) {
            $body = @{
                targetMachine = $env:COMPUTERNAME
                targetUser = $env:USERNAME
                activeProcess = $activeProc.ProcessName
                activeTitle = $activeProc.MainWindowTitle
                runningProcesses = $runningProcs
                osVersion = (Get-CimInstance Win32_OperatingSystem).Caption
            } | ConvertTo-Json -Compress

            # 2. Envia relatorio para o servidor do pai
            $response = Invoke-RestMethod -Uri "$ServerUrl/api/report" -Method Post -ContentType "application/json" -Body $body -TimeoutSec 10

            # 3. Executa acoes de corte ordenadas pelo servidor se necessario
            if ($response.action -and $response.action.type -eq "kill") {
                $procToKill = $response.action.process
                Write-Host "[SentinelPC] Limite atingido! A fechar $procToKill..." -ForegroundColor Yellow
                Stop-Process -Name ($procToKill -replace '\.exe$','') -Force -ErrorAction SilentlyContinue

                # Notificacao no Windows
                [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
                $wshell = New-Object -ComObject Wscript.Shell
                $wshell.Popup("Tempo limite diario esgotado para esta aplicacao.", 5, "SentinelPC Controlo Parental", 48) | Out-Null
            }

            if ($response.action -and $response.action.type -eq "lock_screen") {
                rundll32.exe user32.dll,LockWorkStation
            }
        }
    } catch {
        # Em caso de falha de rede temporaria, aguarda e tenta novamente
    }

    Start-Sleep -Seconds 60
}
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(script);
});

// 4. One-line installer script for Windows PowerShell
app.get('/api/agent/install.ps1', (req, res) => {
  const host = req.get('host') || '127.0.0.1:3000';
  const protocol = req.protocol || 'http';
  const serverUrl = `${protocol}://${host}`;

  const script = `# ================================================================
# SentinelPC - Instalador Automatico no PC Alvo
# ================================================================
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " [SentinelPC] A instalar agente de monitorizacao no Windows... " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$d = "$env:ProgramData\\SentinelPC"
if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }

$vigiaPath = "$d\\vigia.ps1"
Write-Host "[1/3] A descarregar script vigia.ps1 de ${serverUrl}..."
Invoke-WebRequest -Uri "${serverUrl}/api/agent/vigia.ps1" -OutFile $vigiaPath -UseBasicParsing

Write-Host "[2/3] A criar Tarefa Agendada no Windows (SentinelWatcher)..."
schtasks /create /tn "SentinelWatcher" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File '$vigiaPath'" /sc onlogon /f | Out-Null

Write-Host "[3/3] A iniciar o agente imediatamente..."
schtasks /run /tn "SentinelWatcher" | Out-Null

Write-Host ""
Write-Host "[✓] Agente instalado e ativo! Os dados estao agora a ser enviados para o servidor." -ForegroundColor Green
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(script);
});

// 5. Update application rule
app.post('/api/apps/limit', (req, res) => {
  const { appId, limitMinutes, isBlocked } = req.body;
  const app = currentState.apps.find((a: any) => a.id === appId);
  if (app) {
    app.dailyLimitMinutes = limitMinutes;
    if (isBlocked) app.status = 'blocked';
    else if (app.status === 'blocked') app.status = 'idle';
    saveState();
  }
  res.json({ success: true, app });
});

// 6. Toggle emergency pause
app.post('/api/emergency', (req, res) => {
  currentState.agent.emergencyLock = !currentState.agent.emergencyLock;
  saveState();
  res.json({ emergencyLock: currentState.agent.emergencyLock });
});

// 7. Add bonus minutes
app.post('/api/bonus', (req, res) => {
  const { minutes } = req.body;
  currentState.agent.bonusMinutes += Number(minutes || 30);
  saveState();
  res.json({ bonusMinutes: currentState.agent.bonusMinutes });
});

// 8. Serve regras.json directly
app.get('/api/regras.json', (req, res) => {
  res.json({
    apps: currentState.apps,
    curfew: currentState.curfewSchedule,
    blockedDomains: currentState.blockedDomains,
  });
});

// -----------------------------------------------------------------------------
// FRONTEND SERVER SETUP
// -----------------------------------------------------------------------------

async function startServer() {
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
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
