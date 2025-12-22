// ================================
// OptiClean Pro - Main Process Fix
// Código completo e corrigido
// ================================

import { app, BrowserWindow, ipcMain, Notification, dialog } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
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

// ================= AUTO UPDATER =================
// Configurar autoUpdater
autoUpdater.autoDownload = false; // Não baixar automaticamente, pedir permissão
autoUpdater.autoInstallOnAppQuit = true; // Instalar na próxima inicialização

// Configurar para desenvolvimento (desabilitar atualizações em dev)
if (process.env.NODE_ENV === 'development') {
  autoUpdater.updateConfigPath = null;
}

// Eventos do autoUpdater
autoUpdater.on('checking-for-update', () => {
  writeLog('Verificando atualizações...');
  if (mainWindow) {
    mainWindow.webContents.send('update-checking');
  }
});

autoUpdater.on('update-available', (info) => {
  writeLog(`Atualização disponível: ${info.version}`);
  if (mainWindow) {
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes || 'Nova versão disponível',
    });
  }
  
  // Mostrar notificação
  if (Notification.isSupported()) {
    new Notification({
      title: 'Atualização Disponível',
      body: `Versão ${info.version} está disponível!`,
      icon: path.join(__dirname, '../public/favicon.ico'),
    }).show();
  }
});

autoUpdater.on('update-not-available', (info) => {
  writeLog(`Aplicativo está atualizado: ${info.version}`);
  if (mainWindow) {
    mainWindow.webContents.send('update-not-available', {
      version: info.version,
    });
  }
});

autoUpdater.on('error', (err) => {
  writeLog(`Erro ao verificar atualização: ${err.message}`);
  if (mainWindow) {
    mainWindow.webContents.send('update-error', {
      message: err.message,
    });
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-download-progress', {
      percent: Math.round(progressObj.percent),
      transferred: progressObj.transferred,
      total: progressObj.total,
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  writeLog(`Atualização baixada: ${info.version}`);
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', {
      version: info.version,
    });
  }
  
  // Mostrar notificação
  if (Notification.isSupported()) {
    new Notification({
      title: 'Atualização Baixada',
      body: 'A atualização foi baixada. O aplicativo será reiniciado.',
      icon: path.join(__dirname, '../public/favicon.ico'),
    }).show();
  }
});

const LICENSE_PATH = path.join(app.getPath('userData'), 'license.json');
const LOG_PATH = path.join(app.getPath('userData'), 'logs');
const LOG_FILE = path.join(LOG_PATH, 'system-monitor.log');

// ================= RATE LIMITING =================
const rateLimiter = new Map();

function checkRateLimit(ipcHandler, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const key = ipcHandler;
  
  if (!rateLimiter.has(key)) {
    rateLimiter.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const limit = rateLimiter.get(key);
  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + windowMs;
    return true;
  }
  
  if (limit.count >= maxRequests) {
    writeLog(`Rate limit excedido para ${key}: ${limit.count} requisições`);
    return false;
  }
  
  limit.count++;
  return true;
}

// ================= SEGURANÇA =================
// Validar e sanitizar inputs para prevenir command injection
function validatePid(pid) {
  // PID deve ser um número inteiro positivo
  const pidNum = parseInt(pid, 10);
  if (isNaN(pidNum) || pidNum <= 0 || pidNum > 65535) {
    throw new Error('PID inválido');
  }
  return pidNum;
}

function sanitizeString(input) {
  if (typeof input !== 'string') {
    throw new Error('Input deve ser uma string');
  }
  // Remover caracteres perigosos para command injection
  return input.replace(/[;&|`$(){}[\]<>]/g, '');
}

function validateServiceName(serviceName) {
  // Nome de serviço deve conter apenas letras, números, hífen e underscore
  if (!/^[a-zA-Z0-9_-]+$/.test(serviceName)) {
    throw new Error('Nome de serviço inválido');
  }
  return serviceName;
}

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
let lastProcessTimes = new Map(); // Armazenar tempos anteriores de processos

async function getProcessList() {
  try {
    // Buscar informações de processos com CPU e memória
    const { stdout: processStdout } = await execPromise(
      'wmic process get ProcessId,Name,WorkingSetSize,PercentProcessorTime /format:csv'
    );

    const lines = processStdout.trim().split('\n').slice(1);
    const totalMem = os.totalmem();
    const now = Date.now();

    const processes = lines
      .map(line => {
        const p = line.split(',');
        const pid = parseInt(p[2]) || 0;
        const name = p[1] || 'Unknown';
        const memBytes = parseInt(p[3]) || 0;
        
        if (!pid || !name || name === 'Unknown') return null;

        // Calcular porcentagem de memória (limitada a 100%)
        const memPercent = Math.min(100, Math.round((memBytes / totalMem) * 100 * 100) / 100);
        
        // Calcular CPU usando PercentProcessorTime
        let cpuPercent = 0;
        const percentProcessorTime = parseFloat(p[4]) || 0;
        
        // PercentProcessorTime já vem como porcentagem, mas pode ser por núcleo
        // Dividir pelo número de núcleos para obter porcentagem real
        const numCores = os.cpus().length;
        cpuPercent = Math.min(100, Math.round((percentProcessorTime / numCores) * 100) / 100);

        return {
          name,
          pid,
          cpu: cpuPercent,
          mem: memPercent,
          cpuPercent: cpuPercent,
          memPercent: memPercent,
        };
      })
      .filter(p => p !== null)
      .slice(0, 100); // Limitar a 100 processos

    // Normalizar porcentagens para garantir que a soma não ultrapasse 100%
    // Isso é normal em sistemas multi-core, mas vamos normalizar para exibição
    const totalCpu = processes.reduce((sum, p) => sum + p.cpuPercent, 0);
    const sumMemPercent = processes.reduce((sum, p) => sum + p.memPercent, 0);

    // Se a soma ultrapassar 100%, normalizar proporcionalmente
    // (Isso é normal para CPU em sistemas multi-core, mas vamos limitar visualmente)
    if (totalCpu > 100) {
      const scale = 100 / totalCpu;
      processes.forEach(p => {
        p.cpuPercent = Math.min(100, Math.round(p.cpuPercent * scale * 100) / 100);
        p.cpu = p.cpuPercent;
      });
    }

    // Para memória, a soma pode ser > 100% porque múltiplos processos usam memória
    // Mas vamos garantir que nenhum processo individual ultrapasse 100%
    processes.forEach(p => {
      p.memPercent = Math.min(100, p.memPercent);
      p.mem = p.memPercent;
    });

    return processes;
  } catch (error) {
    writeLog(`Erro ao buscar processos: ${error.message}`);
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
  // Rate limiting
  if (!checkRateLimit('kill-process', 5, 60000)) {
    return { success: false, error: 'Muitas requisições. Aguarde um momento.' };
  }
  try {
    // Validar PID antes de executar
    const validPid = validatePid(pid);
    
    // Lista de processos críticos do sistema que não devem ser finalizados
    const criticalProcesses = [
      'System', 'smss.exe', 'csrss.exe', 'wininit.exe', 
      'services.exe', 'lsass.exe', 'svchost.exe', 'explorer.exe',
      'dwm.exe', 'winlogon.exe', 'spoolsv.exe'
    ];
    
    // Verificar se o processo é crítico antes de finalizar
    try {
      const { stdout } = await execPromise(`wmic process where ProcessId=${validPid} get Name /format:csv`);
      const lines = stdout.trim().split('\n');
      if (lines.length > 1) {
        const processName = lines[1].split(',')[1]?.trim();
        if (processName && criticalProcesses.some(cp => processName.toLowerCase().includes(cp.toLowerCase()))) {
          return { 
            success: false, 
            error: `Não é possível finalizar o processo crítico do sistema: ${processName}` 
          };
        }
      }
    } catch (checkError) {
      // Se não conseguir verificar, prosseguir com cuidado
      writeLog(`Aviso: Não foi possível verificar processo ${validPid} antes de finalizar`);
    }
    
    // Executar com PID validado
    await execPromise(`taskkill /PID ${validPid} /F`);
    writeLog(`Processo finalizado: PID ${validPid}`);
    return { success: true };
  } catch (e) {
    writeLog(`Erro ao finalizar processo ${pid}: ${e.message}`);
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
  // Rate limiting
  if (!checkRateLimit('clean-system', 3, 300000)) { // 3 requisições a cada 5 minutos
    return { success: false, error: 'Muitas requisições de limpeza. Aguarde 5 minutos.' };
  }
  
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
  // Rate limiting
  if (!checkRateLimit('optimize-system', 3, 300000)) { // 3 requisições a cada 5 minutos
    return { success: false, error: 'Muitas requisições de otimização. Aguarde 5 minutos.' };
  }
  
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
      // Validar nome do serviço
      const validServiceName = validateServiceName(service);
      
      // Verificar se serviço existe e está rodando
      const { stdout } = await execPromise(`sc query ${validServiceName}`);
      if (stdout.includes('RUNNING')) {
        // Apenas parar temporariamente, não desabilitar
        await execPromise(`net stop ${validServiceName} /y 2>nul`);
        processesOptimized++;
        actions.push(`Serviço ${validServiceName} pausado`);
      }
    } catch (error) {
      writeLog(`Erro ao processar serviço ${service}: ${error.message}`);
    }
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
      if (memory > 500 * 1024 * 1024 && name && !essentialProcesses.includes(name)) {
        try {
          // Sanitizar nome do processo antes de usar
          const sanitizedName = sanitizeString(name);
          if (sanitizedName && sanitizedName === name) {
            await execPromise(`taskkill /IM "${sanitizedName}" /F 2>nul`);
            processesOptimized++;
            writeLog(`Processo otimizado: ${sanitizedName}`);
          }
        } catch (error) {
          writeLog(`Erro ao otimizar processo ${name}: ${error.message}`);
        }
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

// ================= OTIMIZAÇÃO DE DISCO =================
ipcMain.handle('optimize-disk', async () => {
  if (!checkRateLimit('optimize-disk', 2, 600000)) {
    return { success: false, error: 'Aguarde 10 minutos entre otimizações de disco.' };
  }
  
  writeLog('Iniciando otimização de disco...');
  const actions = [];
  
  try {
    // Limpar arquivos temporários do sistema
    await execPromise('del /q/f/s %TEMP%\\* 2>nul');
    actions.push('Arquivos temporários limpos');
  } catch {}
  
  try {
    // Limpar cache do Windows
    await execPromise('del /q/f/s C:\\Windows\\Temp\\* 2>nul');
    actions.push('Cache do Windows limpo');
  } catch {}
  
  try {
    // Limpar prefetch (melhora inicialização)
    await execPromise('del /q/f/s C:\\Windows\\Prefetch\\* 2>nul');
    actions.push('Prefetch otimizado');
  } catch {}
  
  try {
    // Analisar e corrigir erros do disco (apenas análise, não correção que requer reinício)
    await execPromise('chkdsk C: 2>nul', { timeout: 30000 });
    actions.push('Verificação de disco iniciada');
  } catch {}
  
  const disk = await getDiskUsage();
  
  return {
    success: true,
    actions,
    freeSpace: disk.free,
    message: `Otimização concluída. ${disk.free}GB livres.`
  };
});

// ================= OTIMIZAÇÃO DE REDE =================
ipcMain.handle('optimize-network', async () => {
  if (!checkRateLimit('optimize-network', 2, 300000)) {
    return { success: false, error: 'Aguarde 5 minutos entre otimizações de rede.' };
  }
  
  writeLog('Iniciando otimização de rede...');
  const actions = [];
  
  try {
    // Limpar cache DNS
    await execPromise('ipconfig /flushdns');
    actions.push('Cache DNS limpo');
  } catch {}
  
  try {
    // Reset do catálogo Winsock
    await execPromise('netsh winsock reset catalog 2>nul');
    actions.push('Winsock resetado');
  } catch {}
  
  try {
    // Resetar configurações TCP/IP
    await execPromise('netsh int ip reset 2>nul');
    actions.push('TCP/IP resetado');
  } catch {}
  
  try {
    // Renovar IP
    await execPromise('ipconfig /release && ipconfig /renew');
    actions.push('IP renovado');
  } catch {}
  
  return {
    success: true,
    actions,
    message: 'Configurações de rede otimizadas. Reinicie para aplicar todas as mudanças.'
  };
});

// ================= LIMPEZA DE REGISTRO =================
ipcMain.handle('clean-registry', async () => {
  if (!checkRateLimit('clean-registry', 1, 600000)) {
    return { success: false, error: 'Aguarde 10 minutos entre limpezas de registro.' };
  }
  
  writeLog('Iniciando limpeza de registro...');
  const actions = [];
  let keysRemoved = 0;
  
  // Paths de registro comuns para limpeza
  const registryPaths = [
    'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU',
    'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\TypedPaths',
    'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\ComDlg32\\OpenSaveMRU',
  ];
  
  for (const path of registryPaths) {
    try {
      await execPromise(`reg delete "${path}" /f 2>nul`);
      keysRemoved++;
      actions.push(`Histórico removido: ${path.split('\\').pop()}`);
    } catch {}
  }
  
  // Limpar cache de ícones
  try {
    await execPromise('ie4uinit.exe -ClearIconCache 2>nul');
    actions.push('Cache de ícones limpo');
  } catch {}
  
  // Limpar histórico de pesquisa
  try {
    await execPromise('del /f /q "%APPDATA%\\Microsoft\\Windows\\Recent\\*" 2>nul');
    actions.push('Histórico de arquivos recentes limpo');
  } catch {}
  
  return {
    success: true,
    keysRemoved,
    actions,
    message: `Limpeza de registro concluída. ${keysRemoved} entradas processadas.`
  };
});

// ================= OTIMIZAÇÃO DE MEMÓRIA =================
ipcMain.handle('optimize-memory', async () => {
  if (!checkRateLimit('optimize-memory', 3, 120000)) {
    return { success: false, error: 'Aguarde 2 minutos entre otimizações de memória.' };
  }
  
  writeLog('Iniciando otimização de memória...');
  const memBefore = await getMemoryUsage();
  
  try {
    // Liberar memória de trabalho dos processos
    await execPromise('powershell -Command "Get-Process | ForEach-Object { try { $_.MinWorkingSet = $_.MinWorkingSet } catch {} }"', { timeout: 30000 });
  } catch {}
  
  try {
    // Limpar memória standby (requer privilégios elevados)
    await execPromise('powershell -Command "[System.GC]::Collect()"', { timeout: 10000 });
  } catch {}
  
  // Aguardar um pouco para memória ser liberada
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const memAfter = await getMemoryUsage();
  const freedMB = Math.max(0, (memBefore.used - memAfter.used) * 1024);
  
  return {
    success: true,
    freedMB: Math.round(freedMB),
    memoryBefore: memBefore.percent,
    memoryAfter: memAfter.percent,
    message: `${Math.round(freedMB)}MB de memória liberados.`
  };
});

// ================= OTIMIZAÇÃO DE CPU =================
ipcMain.handle('optimize-cpu', async () => {
  if (!checkRateLimit('optimize-cpu', 3, 120000)) {
    return { success: false, error: 'Aguarde 2 minutos entre otimizações de CPU.' };
  }
  
  writeLog('Iniciando otimização de CPU...');
  const actions = [];
  let processesOptimized = 0;
  
  try {
    // Reduzir prioridade de processos que consomem muita CPU
    const { stdout } = await execPromise('wmic process get Name,ProcessId,PercentProcessorTime /format:csv');
    const lines = stdout.trim().split('\n').slice(1);
    
    const essentialProcesses = [
      'System', 'svchost.exe', 'csrss.exe', 'wininit.exe', 'services.exe',
      'lsass.exe', 'smss.exe', 'explorer.exe', 'dwm.exe', 'electron.exe'
    ];
    
    for (const line of lines) {
      const parts = line.split(',');
      const name = parts[1];
      const pid = parseInt(parts[2]) || 0;
      const cpuUsage = parseFloat(parts[3]) || 0;
      
      // Se uso de CPU > 50% e não é essencial
      if (cpuUsage > 50 && name && !essentialProcesses.includes(name) && pid > 0) {
        try {
          await execPromise(`wmic process where ProcessId=${pid} CALL setpriority "below normal"`);
          processesOptimized++;
          actions.push(`Prioridade reduzida: ${name}`);
        } catch {}
      }
    }
  } catch (error) {
    writeLog(`Erro na otimização de CPU: ${error.message}`);
  }
  
  // Elevar prioridade do OptiClean
  try {
    await execPromise('wmic process where name="electron.exe" CALL setpriority "high priority"');
    actions.push('Prioridade do OptiClean elevada');
  } catch {}
  
  return {
    success: true,
    processesOptimized,
    actions,
    message: `${processesOptimized} processos otimizados.`
  };
});


ipcMain.handle('check-for-updates', async () => {
  try {
    await autoUpdater.checkForUpdates();
    return { success: true };
  } catch (error) {
    writeLog(`Erro ao verificar atualizações: ${error.message}`);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    writeLog(`Erro ao baixar atualização: ${error.message}`);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('install-update', async () => {
  try {
    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  } catch (error) {
    writeLog(`Erro ao instalar atualização: ${error.message}`);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// ================= EXECUÇÃO DE COMANDOS =================
ipcMain.handle('run-command', async (_, command) => {
  try {
    // Lista de comandos permitidos para segurança
    const allowedCommands = [
      'taskmgr', 'control', 'cmd', 'notepad', 'calc', 'mspaint',
      'explorer', 'msconfig', 'regedit', 'services.msc', 'compmgmt.msc',
      'eventvwr', 'perfmon', 'resmon', 'dxdiag', 'msinfo32'
    ];
    
    // Verificar se o comando é permitido
    const commandBase = command.toLowerCase().split(' ')[0];
    if (!allowedCommands.includes(commandBase)) {
      return { success: false, error: `Comando não permitido: ${commandBase}` };
    }
    
    // Executar comando de forma assíncrona (não bloquear a UI)
    exec(command, (error, stdout, stderr) => {
      if (error) {
        writeLog(`Erro ao executar comando "${command}": ${error.message}`);
      } else {
        writeLog(`Comando executado com sucesso: ${command}`);
      }
    });
    
    return { success: true };
  } catch (error) {
    writeLog(`Erro ao executar comando "${command}": ${error.message}`);
    return { success: false, error: error.message };
  }
});

// ================= GERENCIAMENTO DE PRIORIDADE DE PROCESSOS =================
ipcMain.handle('set-process-priority', async (_, pid, priority) => {
  // Rate limiting
  if (!checkRateLimit('set-process-priority', 10, 60000)) { // 10 alterações por minuto
    return { success: false, error: 'Muitas alterações de prioridade. Aguarde um momento.' };
  }
  
  try {
    // Validar PID
    const validPid = validatePid(pid);
    
    // Validar prioridade
    const validPriorities = ['low', 'below_normal', 'normal', 'above_normal', 'high', 'realtime'];
    if (!validPriorities.includes(priority)) {
      return { success: false, error: `Prioridade inválida: ${priority}` };
    }
    
    // Mapear prioridades para valores do Windows
    const priorityMap = {
      'low': 'idle',
      'below_normal': 'below_normal',
      'normal': 'normal',
      'above_normal': 'above_normal', 
      'high': 'high',
      'realtime': 'realtime'
    };
    
    const wmicPriority = priorityMap[priority];
    
    // Usar WMIC para alterar prioridade do processo
    await execPromise(`wmic process where ProcessId=${validPid} CALL setpriority "${wmicPriority} priority"`);
    
    writeLog(`Prioridade do processo ${validPid} alterada para ${priority}`);
    return { success: true };
  } catch (error) {
    writeLog(`Erro ao alterar prioridade do processo ${pid}: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// ================= LIFECYCLE =================
app.whenReady().then(() => {
  createWindow();
  
  // Verificar atualizações após 5 segundos (dar tempo para app carregar)
  setTimeout(() => {
    if (process.env.NODE_ENV !== 'development') {
      writeLog('Iniciando verificação de atualizações...');
      autoUpdater.checkForUpdates().catch(err => {
        writeLog(`Erro ao verificar atualizações: ${err.message}`);
      });
    }
  }, 5000);
  
  // Verificar atualizações a cada 4 horas
  setInterval(() => {
    if (process.env.NODE_ENV !== 'development' && mainWindow) {
      writeLog('Verificação periódica de atualizações...');
      autoUpdater.checkForUpdates().catch(err => {
        writeLog(`Erro ao verificar atualizações: ${err.message}`);
      });
    }
  }, 4 * 60 * 60 * 1000); // 4 horas
});

app.on('window-all-closed', () => {
  stopSystemMonitor();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
