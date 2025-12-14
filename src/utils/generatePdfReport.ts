import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface SystemMetrics {
  cpu: { usageTotal: number; speed: number; usagePerCore: number[] };
  memory: { total: number; used: number; free: number; percent: number };
  disk: { total: number; used: number; free: number };
  network: { rx: number; tx: number; interface: string };
  temperature: { cpu: number | null };
}

interface Operation {
  id: string;
  operation_name: string;
  operation_type: string;
  status: string;
  created_at: string;
  details?: string;
}

export interface ReportData {
  metrics: SystemMetrics;
  operations: Operation[];
  cpuHistory: { time: string; value: number }[];
  memoryHistory: { time: string; value: number }[];
  userName?: string;
  email?: string;
}

export const generatePdfReport = (data: ReportData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date();
  
  // Header
  doc.setFillColor(13, 17, 23);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('OptiClean Pro', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório de Performance do Sistema', 20, 33);
  
  doc.setFontSize(9);
  doc.text(`Gerado em: ${now.toLocaleString('pt-BR')}`, pageWidth - 20, 25, { align: 'right' });
  if (data.userName) {
    doc.text(`Usuário: ${data.userName}`, pageWidth - 20, 33, { align: 'right' });
  }
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  let yPos = 55;
  
  // System Overview Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Visão Geral do Sistema', 20, yPos);
  yPos += 10;
  
  // Metrics Table
  const metricsData = [
    ['Métrica', 'Valor Atual', 'Status'],
    ['CPU Total', `${data.metrics.cpu.usageTotal}%`, getStatusText(data.metrics.cpu.usageTotal)],
    ['CPU Velocidade', `${data.metrics.cpu.speed} MHz`, 'Normal'],
    ['Núcleos', `${data.metrics.cpu.usagePerCore.length}`, '-'],
    ['Memória Usada', `${data.metrics.memory.used} GB / ${data.metrics.memory.total} GB`, getStatusText(data.metrics.memory.percent)],
    ['Memória Percentual', `${data.metrics.memory.percent}%`, getStatusText(data.metrics.memory.percent)],
    ['Disco Usado', `${data.metrics.disk.used} GB / ${data.metrics.disk.total} GB`, '-'],
    ['Rede (Interface)', data.metrics.network.interface, '-'],
    ['Download', `${data.metrics.network.rx} KB/s`, '-'],
    ['Upload', `${data.metrics.network.tx} KB/s`, '-'],
  ];
  
  if (data.metrics.temperature.cpu !== null) {
    metricsData.push(['Temperatura CPU', `${data.metrics.temperature.cpu}°C`, data.metrics.temperature.cpu > 80 ? 'Crítico' : 'Normal']);
  }
  
  doc.autoTable({
    startY: yPos,
    head: [metricsData[0]],
    body: metricsData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [30, 64, 175], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 60 },
      2: { cellWidth: 40 },
    },
    margin: { left: 20, right: 20 },
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Per Core Usage
  if (data.metrics.cpu.usagePerCore.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Uso por Núcleo', 20, yPos);
    yPos += 8;
    
    const coreData = data.metrics.cpu.usagePerCore.map((usage, i) => [
      `Core ${i}`,
      `${usage}%`,
      getStatusText(usage)
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [['Núcleo', 'Uso', 'Status']],
      body: coreData,
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      styles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
  }
  
  // Check if we need a new page
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }
  
  // Recent Operations
  if (data.operations.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Operações Recentes', 20, yPos);
    yPos += 8;
    
    const opsData = data.operations.slice(0, 10).map(op => [
      op.operation_name,
      op.operation_type,
      op.status || 'completed',
      new Date(op.created_at).toLocaleString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [['Operação', 'Tipo', 'Status', 'Data']],
      body: opsData,
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      styles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
  }
  
  // Check if we need a new page
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }
  
  // Historical Averages
  if (data.cpuHistory.length > 0 || data.memoryHistory.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Médias Históricas (Última Sessão)', 20, yPos);
    yPos += 8;
    
    const avgCpu = data.cpuHistory.length > 0 
      ? Math.round(data.cpuHistory.reduce((sum, p) => sum + p.value, 0) / data.cpuHistory.length)
      : 0;
    const avgMem = data.memoryHistory.length > 0
      ? Math.round(data.memoryHistory.reduce((sum, p) => sum + p.value, 0) / data.memoryHistory.length)
      : 0;
    const maxCpu = data.cpuHistory.length > 0 ? Math.max(...data.cpuHistory.map(p => p.value)) : 0;
    const maxMem = data.memoryHistory.length > 0 ? Math.max(...data.memoryHistory.map(p => p.value)) : 0;
    
    const histData = [
      ['CPU - Média', `${avgCpu}%`],
      ['CPU - Pico', `${maxCpu}%`],
      ['Memória - Média', `${avgMem}%`],
      ['Memória - Pico', `${maxMem}%`],
      ['Amostras Coletadas', `${data.cpuHistory.length}`],
    ];
    
    doc.autoTable({
      startY: yPos,
      head: [['Métrica', 'Valor']],
      body: histData,
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 },
    });
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `OptiClean Pro - Relatório de Performance | Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save
  const filename = `opticlean-report-${now.toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

function getStatusText(percent: number): string {
  if (percent >= 90) return 'Crítico';
  if (percent >= 70) return 'Atenção';
  return 'Normal';
}

export default generatePdfReport;
