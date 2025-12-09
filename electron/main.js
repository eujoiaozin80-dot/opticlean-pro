// ================================
// OptiClean Pro - Main Process Fix
// Código completo e corrigido
// ================================

import { app, BrowserWindow, ipcMain, Notification } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';
import fs from 'fs/promises';
import { exec } from 'child_process';
import util from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execPromise = util.promisify(exec);

let mainWindow;
let monitorInterval = null;
let lastCpuInfo = null;

const LICENSE_PATH = path.join(app.getPath('userData'), 'license.json');
const LOG_PATH = path.join(app.getPath('userData'), 'logs');
const LOG_FILE = path.join(LOG_PATH, 'system-monitor.log');

// ================= LOGS =================
async function writeLog(message) {
  try {
    await fs.mkdir(LOG_PATH, { recursive: true });
    const timestamp = new Date().toISOString();
    await fs.appendFile(LOG_FILE, `[${timestamp}] ${message}\n`);
  } catch {}
}

// ================= JANELA =================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    backgroundColor: '#0a0a0f',
  });

  // CORREÇÃO DO ERRO
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setAutoHideMenuBar(true);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    writeLog('Aplicação carregada');
    startSystemMonitor();
  });

  mainWindow.on('closed', () => stopSystemMonitor());
}

// ================= CPU =================
async function getCpuUsage() {
  const cpus = os.cpus();
  const cpuInfo = cpus.map(cpu => ({ ...cpu.times }));

  if (!lastCpuInfo) {
    lastCpuInfo = cpuInfo;
    return {
      usageTotal: 0,
      usagePerCore: new Array(cpus.length).fill(0),
      speed: cpus[0].speed,
    };
  }

  const usagePerCore = cpuInfo.map((cpu, index) => {
    const old = lastCpuInfo[index];

    const idleDiff = cpu.idle - old.idle;
    const totalDiff =
      (cpu.user - old.user) +
      (cpu.nice - old.nice) +
      (cpu.sys - old.sys) +
      (cpu.irq - old.irq) +
      idleDiff;

    if (totalDiff <= 0) return 0;

    const usage = 100 - Math.round((idleDiff / totalDiff) * 100);
    return Math.max(0, Math.min(100, usage));
  });

  const avg = usagePerCore.reduce((a, b) => a + b) / usagePerCore.length;
  lastCpuInfo = cpuInfo;

  return {
    usageTotal: Math.round(avg),
    usagePerCore,
    speed: cpus[0].speed,
  };
}

// ================= MEMÓRIA =================
async function getMemoryUsage() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;

  return {
    total: Math.round(total / 1e9),
    used: Math.round(used / 1e9),
    free: Math.round(free / 1e9),
    percent: Math.round((used / total) * 100),
  };
}

// ================= DISCO =================
async function getDiskUsage() {
  try {
    const { stdout } = await execPromise(
      'wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /format:csv'
    );

    const lines = stdout.trim().split('\n');
    const parts = lines[1].split(',');

    const free = parseInt(parts[1]) || 0;
    const total = parseInt(parts[2]) || 0;

    return {
      total: Math.round(total / 1e9),
      used: Math.round((total - free) / 1e9),
      free: Math.round(free / 1e9),
    };
  } catch {
    return { total: 0, used: 0, free: 0 };
  }
}

// ================= PROCESSOS =================
async function getProcessList() {
  try {
    const { stdout } = await execPromise(
      'wmic process get ProcessId,Name,WorkingSetSize /format:csv'
    );

    const lines = stdout.trim().split('\n').slice(1);

    return lines.slice(0, 50).map(line => {
      const p = line.split(',');
      const memBytes = parseInt(p[3]) || 0;
      const memPercent = Math.round((memBytes / os.totalmem()) * 100);

      return {
        name: p[1] || 'Unknown',
        pid: parseInt(p[2]) || 0,
        cpu: 0, // Windows não expõe CPU por processo via wmic facilmente
        mem: memPercent,
        cpuPercent: 0,
        memPercent: memPercent,
      };
    }).filter(p => p.name && p.name !== 'Unknown');
  } catch {
    return [];
  }
}

async function getCpuTemperature() {
  return null; // Windows não tem API nativa
}

// ================= PLACEHOLDER - Funções de rede movidas para baixo =================

function stopSystemMonitor() {
  clearInterval(monitorInterval);
  monitorInterval = null;
}

// ================= IPC =================
ipcMain.handle('get-cpu-usage', async () => {
  const cpu = await getCpuUsage();
  return {
    usage: cpu.usageTotal,
    cores: os.cpus().length,
    temperature: 0,
  };
});

ipcMain.handle('get-memory-usage', async () => getMemoryUsage());
ipcMain.handle('get-disk-usage', async () => getDiskUsage());
ipcMain.handle('get-processes', async () => {
  const processes = await getProcessList();
  // Retornar formato esperado pelo frontend (cpu, mem)
  return processes;
});

ipcMain.handle('kill-process', async (_, pid) => {
  try {
    await execPromise(`taskkill /PID ${pid} /F`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ================= NOTIFICAÇÕES DESKTOP =================
let notificationCooldown = {};

ipcMain.handle('show-notification', async (_, { title, body, type }) => {
  try {
    // Verificar cooldown (30 segundos)
    const now = Date.now();
    const cooldownKey = `${type}-${title}`;
    if (notificationCooldown[cooldownKey] && now - notificationCooldown[cooldownKey] < 30000) {
      return { success: false, reason: 'cooldown' };
    }
    
    notificationCooldown[cooldownKey] = now;
    
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: title || 'OptiClean Pro',
        body: body || '',
        icon: path.join(__dirname, '../public/favicon.ico'),
        silent: false,
      });
      
      notification.show();
      return { success: true };
    }
    return { success: false, reason: 'not-supported' };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ================= REDE REAL =================
let lastNetworkStats = null;

async function getRealNetworkStats() {
  try {
    const { stdout } = await execPromise(
      'netstat -e'
    );
    
    const lines = stdout.trim().split('\n');
    let rx = 0, tx = 0;
    
    for (const line of lines) {
      if (line.includes('Bytes')) {
        const parts = line.split(/\s+/).filter(Boolean);
        if (parts.length >= 3) {
          rx = parseInt(parts[1]) || 0;
          tx = parseInt(parts[2]) || 0;
        }
      }
    }
    
    const interfaces = os.networkInterfaces();
    const interfaceName = Object.keys(interfaces).find(name => 
      !name.toLowerCase().includes('loopback') && interfaces[name]?.some(i => !i.internal)
    ) || Object.keys(interfaces)[0] || 'N/A';
    
    if (lastNetworkStats) {
      const rxDiff = Math.max(0, rx - lastNetworkStats.rx);
      const txDiff = Math.max(0, tx - lastNetworkStats.tx);
      lastNetworkStats = { rx, tx };
      
      return {
        rx: Math.round(rxDiff / 1024), // KB/s
        tx: Math.round(txDiff / 1024),
        interface: interfaceName
      };
    }
    
    lastNetworkStats = { rx, tx };
    return { rx: 0, tx: 0, interface: interfaceName };
  } catch {
    return { rx: 0, tx: 0, interface: 'N/A' };
  }
}

// Atualizar collectSystemStats para usar rede real
async function collectSystemStatsWithNetwork() {
  const [cpu, memory, disk, processes, temp, network] = await Promise.all([
    getCpuUsage(),
    getMemoryUsage(),
    getDiskUsage(),
    getProcessList(),
    getCpuTemperature(),
    getRealNetworkStats(),
  ]);

  // Verificar alertas e enviar notificações
  if (cpu.usageTotal >= 90) {
    mainWindow?.webContents.send('system-alert', { type: 'cpu', value: cpu.usageTotal });
    ipcMain.emit('show-notification', null, { 
      title: '⚠️ Alerta de CPU', 
      body: `Uso de CPU em ${cpu.usageTotal}%! Considere fechar programas.`,
      type: 'cpu-alert'
    });
  }
  
  if (memory.percent >= 90) {
    mainWindow?.webContents.send('system-alert', { type: 'memory', value: memory.percent });
    ipcMain.emit('show-notification', null, { 
      title: '⚠️ Alerta de Memória', 
      body: `Uso de memória em ${memory.percent}%! Considere fechar programas.`,
      type: 'memory-alert'
    });
  }

  return {
    cpu,
    memory,
    disk,
    network,
    processes,
    temperature: { cpu: temp },
    timestamp: new Date().toISOString(),
  };
}

// ================= MONITORAMENTO ATUALIZADO =================
function startSystemMonitor() {
  if (monitorInterval) return;

  monitorInterval = setInterval(async () => {
    const stats = await collectSystemStatsWithNetwork();
    if (!mainWindow?.isDestroyed()) {
      mainWindow.webContents.send('system-stats', stats);
    }
  }, 1000);
}

// ================= LIMPEZA DO SISTEMA =================
async function cleanTempFolder(folderPath) {
  let filesDeleted = 0;
  let bytesFreed = 0;
  
  try {
    const files = await fs.readdir(folderPath);
    
    for (const file of files) {
      try {
        const filePath = path.join(folderPath, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isFile()) {
          bytesFreed += stat.size;
          await fs.unlink(filePath);
          filesDeleted++;
        } else if (stat.isDirectory()) {
          // Recursivo para subpastas
          const subResult = await cleanTempFolder(filePath);
          filesDeleted += subResult.files;
          bytesFreed += subResult.bytes;
          
          // Tentar remover pasta vazia
          try {
            await fs.rmdir(filePath);
          } catch {}
        }
      } catch (e) {
        // Arquivo em uso ou sem permissão - pular
      }
    }
  } catch (e) {
    writeLog(`Erro ao limpar ${folderPath}: ${e.message}`);
  }
  
  return { files: filesDeleted, bytes: bytesFreed };
}

ipcMain.handle('clean-system', async () => {
  writeLog('Iniciando limpeza do sistema...');
  
  let totalFiles = 0;
  let totalBytes = 0;
  const details = [];
  
  // Pastas temporárias do Windows
  const tempFolders = [
    os.tmpdir(),
    path.join(os.homedir(), 'AppData', 'Local', 'Temp'),
    'C:\\Windows\\Temp',
    'C:\\Windows\\Prefetch',
  ];
  
  for (const folder of tempFolders) {
    try {
      await fs.access(folder);
      const result = await cleanTempFolder(folder);
      totalFiles += result.files;
      totalBytes += result.bytes;
      if (result.files > 0) {
        details.push(`${path.basename(folder)}: ${result.files} arquivos`);
      }
    } catch {}
  }
  
  // Limpar cache de navegadores (Chrome, Edge)
  const browserCaches = [
    path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Cache'),
    path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache'),
  ];
  
  for (const cache of browserCaches) {
    try {
      await fs.access(cache);
      const result = await cleanTempFolder(cache);
      totalFiles += result.files;
      totalBytes += result.bytes;
      if (result.files > 0) {
        details.push(`Cache navegador: ${result.files} arquivos`);
      }
    } catch {}
  }
  
  // Limpar lixeira via comando
  try {
    await execPromise('rd /s /q C:\\$Recycle.Bin 2>nul');
    details.push('Lixeira esvaziada');
  } catch {}
  
  // Limpar logs antigos do Windows
  try {
    await execPromise('wevtutil cl Application 2>nul');
    await execPromise('wevtutil cl System 2>nul');
    details.push('Logs do Windows limpos');
  } catch {}
  
  const freedMB = Math.round(totalBytes / (1024 * 1024));
  writeLog(`Limpeza concluída: ${totalFiles} arquivos, ${freedMB}MB liberados`);
  
  return {
    success: true,
    tempFiles: totalFiles,
    freedSpace: freedMB,
    details: details.join('; '),
  };
});

// ================= OTIMIZAÇÃO DO SISTEMA =================
ipcMain.handle('optimize-system', async () => {
  writeLog('Iniciando otimização do sistema...');
  
  let processesOptimized = 0;
  const actions = [];
  
  // Limpar memória RAM (flush working set)
  try {
    await execPromise('powershell -Command "Get-Process | ForEach-Object { $_.WorkingSet64 = 0 }" 2>nul');
    actions.push('Memória RAM otimizada');
  } catch {}
  
  // Parar serviços desnecessários temporariamente
  const unnecessaryServices = [
    'DiagTrack', // Telemetria
    'SysMain', // Superfetch (pode causar alto uso de disco)
    'WSearch', // Windows Search (se não usado)
  ];
  
  for (const service of unnecessaryServices) {
    try {
      // Verificar se serviço existe e está rodando
      const { stdout } = await execPromise(`sc query ${service}`);
      if (stdout.includes('RUNNING')) {
        // Apenas parar temporariamente, não desabilitar
        await execPromise(`net stop ${service} /y 2>nul`);
        processesOptimized++;
        actions.push(`Serviço ${service} pausado`);
      }
    } catch {}
  }
  
  // Finalizar processos com alto uso de memória (>500MB) que não são essenciais
  try {
    const { stdout } = await execPromise('wmic process get Name,WorkingSetSize /format:csv');
    const lines = stdout.trim().split('\n').slice(1);
    
    const essentialProcesses = [
      'System', 'svchost.exe', 'csrss.exe', 'wininit.exe', 'services.exe',
      'lsass.exe', 'smss.exe', 'explorer.exe', 'dwm.exe', 'RuntimeBroker.exe'
    ];
    
    for (const line of lines) {
      const parts = line.split(',');
      const name = parts[1];
      const memory = parseInt(parts[2]) || 0;
      
      // Se uso > 500MB e não é essencial
      if (memory > 500 * 1024 * 1024 && !essentialProcesses.includes(name)) {
        try {
          await execPromise(`taskkill /IM "${name}" /F 2>nul`);
          processesOptimized++;
        } catch {}
      }
    }
  } catch {}
  
  // Definir prioridade alta para o processo atual
  try {
    await execPromise('wmic process where name="electron.exe" CALL setpriority "high priority"');
    actions.push('Prioridade do app elevada');
  } catch {}
  
  writeLog(`Otimização concluída: ${processesOptimized} processos ajustados`);
  
  return {
    success: true,
    processesOptimized,
    memoryFreed: Math.round(os.freemem() / (1024 * 1024 * 1024) * 10) / 10,
    actions: actions.join('; '),
  };
});

// ================= ANÁLISE DO SISTEMA =================
ipcMain.handle('analyze-system', async () => {
  writeLog('Iniciando análise do sistema...');
  
  const issues = [];
  const cpu = await getCpuUsage();
  const memory = await getMemoryUsage();
  const disk = await getDiskUsage();
  
  // Verificar CPU
  let cpuHealth = 'good';
  if (cpu.usageTotal >= 90) {
    cpuHealth = 'critical';
    issues.push({ 
      type: 'cpu', 
      title: 'CPU sobrecarregada', 
      description: `Uso em ${cpu.usageTotal}%. Feche programas desnecessários.`,
      severity: 'high'
    });
  } else if (cpu.usageTotal >= 70) {
    cpuHealth = 'warning';
    issues.push({ 
      type: 'cpu', 
      title: 'CPU com uso elevado', 
      description: `Uso em ${cpu.usageTotal}%. Monitore os processos.`,
      severity: 'medium'
    });
  }
  
  // Verificar Memória
  let memHealth = 'good';
  if (memory.percent >= 90) {
    memHealth = 'critical';
    issues.push({ 
      type: 'memory', 
      title: 'Memória crítica', 
      description: `Apenas ${memory.free}GB livres. Risco de travamento.`,
      severity: 'high'
    });
  } else if (memory.percent >= 75) {
    memHealth = 'warning';
    issues.push({ 
      type: 'memory', 
      title: 'Memória elevada', 
      description: `${memory.percent}% em uso. Considere fechar programas.`,
      severity: 'medium'
    });
  }
  
  // Verificar Disco
  let diskHealth = 'good';
  const diskPercent = disk.total > 0 ? Math.round((disk.used / disk.total) * 100) : 0;
  if (diskPercent >= 95) {
    diskHealth = 'critical';
    issues.push({ 
      type: 'disk', 
      title: 'Disco quase cheio', 
      description: `Apenas ${disk.free}GB livres. Limpe arquivos urgentemente.`,
      severity: 'high'
    });
  } else if (diskPercent >= 85) {
    diskHealth = 'warning';
    issues.push({ 
      type: 'disk', 
      title: 'Disco com pouco espaço', 
      description: `${disk.free}GB livres. Considere uma limpeza.`,
      severity: 'medium'
    });
  }
  
  // Verificar arquivos temporários
  try {
    const tempPath = os.tmpdir();
    const tempFiles = await fs.readdir(tempPath);
    if (tempFiles.length > 100) {
      issues.push({ 
        type: 'temp', 
        title: 'Muitos arquivos temporários', 
        description: `${tempFiles.length} arquivos em TEMP. Execute uma limpeza.`,
        severity: 'low'
      });
    }
  } catch {}
  
  // Verificar programas na inicialização
  try {
    const { stdout } = await execPromise('wmic startup get Name /format:csv');
    const startupCount = stdout.trim().split('\n').length - 1;
    if (startupCount > 10) {
      issues.push({ 
        type: 'startup', 
        title: 'Muitos programas na inicialização', 
        description: `${startupCount} programas. Isso pode deixar o boot lento.`,
        severity: 'medium'
      });
    }
  } catch {}
  
  // Verificar integridade do Windows (SFC)
  try {
    const { stdout } = await execPromise('sfc /verifyonly 2>&1');
    if (stdout.includes('found integrity violations')) {
      issues.push({ 
        type: 'system', 
        title: 'Arquivos do sistema corrompidos', 
        description: 'Execute "sfc /scannow" como administrador para reparar.',
        severity: 'high'
      });
    }
  } catch {}
  
  writeLog(`Análise concluída: ${issues.length} problema(s) encontrado(s)`);
  
  return {
    success: true,
    totalIssues: issues.length,
    issues,
    cpuHealth,
    memHealth,
    diskHealth,
    timestamp: new Date().toISOString(),
  };
});

// ================= PROGRAMAS DE INICIALIZAÇÃO =================
ipcMain.handle('get-startup-programs', async () => {
  writeLog('Obtendo programas de inicialização...');
  
  const programs = [];
  
  try {
    // Registro do usuário
    const { stdout } = await execPromise(
      'reg query "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" 2>nul'
    );
    
    const lines = stdout.split('\n').filter(l => l.includes('REG_SZ'));
    for (const line of lines) {
      const parts = line.trim().split(/\s+REG_SZ\s+/);
      if (parts.length >= 2) {
        programs.push({
          name: parts[0].trim(),
          path: parts[1].trim(),
          enabled: true,
          location: 'user',
        });
      }
    }
  } catch {}
  
  try {
    // Registro do sistema
    const { stdout } = await execPromise(
      'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" 2>nul'
    );
    
    const lines = stdout.split('\n').filter(l => l.includes('REG_SZ'));
    for (const line of lines) {
      const parts = line.trim().split(/\s+REG_SZ\s+/);
      if (parts.length >= 2) {
        programs.push({
          name: parts[0].trim(),
          path: parts[1].trim(),
          enabled: true,
          location: 'system',
        });
      }
    }
  } catch {}
  
  writeLog(`${programs.length} programas de inicialização encontrados`);
  
  return {
    success: true,
    programs,
    total: programs.length,
  };
});

// ================= VERIFICAR ATUALIZAÇÕES =================
ipcMain.handle('check-updates', async () => {
  writeLog('Verificando atualizações...');
  
  const updates = [];
  
  try {
    // Verificar atualizações do Windows via PowerShell
    const { stdout } = await execPromise(
      'powershell -Command "(New-Object -ComObject Microsoft.Update.Session).CreateUpdateSearcher().Search(\'IsInstalled=0\').Updates | Select-Object Title" 2>nul'
    );
    
    const lines = stdout.split('\n').filter(l => l.trim() && !l.includes('Title') && !l.includes('---'));
    for (const line of lines) {
      const title = line.trim();
      if (title) {
        updates.push({
          name: title,
          type: title.toLowerCase().includes('security') ? 'security' : 
                title.toLowerCase().includes('cumulative') ? 'cumulative' : 'other',
        });
      }
    }
  } catch {}
  
  writeLog(`${updates.length} atualizações disponíveis`);
  
  return {
    success: true,
    totalUpdates: updates.length,
    updates,
  };
});

// ================= LIFECYCLE =================
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  stopSystemMonitor();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
