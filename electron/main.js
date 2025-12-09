// ================================
// OptiClean Pro - Main Process Fix
// Código completo e corrigido
// ================================

import { app, BrowserWindow, ipcMain } from 'electron';
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

// ================= REDE =================
async function getNetworkStats() {
  return {
    rx: 0,
    tx: 0,
    interface: os.networkInterfaces() ? Object.keys(os.networkInterfaces())[0] || 'N/A' : 'N/A'
  };
}

// ================= COLETOR =================
async function collectSystemStats() {
  const [cpu, memory, disk, processes, temp, network] = await Promise.all([
    getCpuUsage(),
    getMemoryUsage(),
    getDiskUsage(),
    getProcessList(),
    getCpuTemperature(),
    getNetworkStats(),
  ]);

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

// ================= MONITORAMENTO =================
function startSystemMonitor() {
  if (monitorInterval) return;

  monitorInterval = setInterval(async () => {
    const stats = await collectSystemStats();
    if (!mainWindow?.isDestroyed()) {
      mainWindow.webContents.send('system-stats', stats);
    }
  }, 1000);
}

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

// ================= LIFECYCLE =================
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  stopSystemMonitor();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
