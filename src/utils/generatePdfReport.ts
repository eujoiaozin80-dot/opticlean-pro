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
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const now = new Date();
    
    // Ensure data has default values
    const metrics = data.metrics || {
      cpu: { usageTotal: 0, speed: 0, usagePerCore: [] },
      memory: { total: 0, used: 0, free: 0, percent: 0 },
      disk: { total: 0, used: 0, free: 0 },
      network: { rx: 0, tx: 0, interface: 'N/A' },
      temperature: { cpu: null },
    };
    const operations = data.operations || [];
    const cpuHistory = data.cpuHistory || [];
    const memoryHistory = data.memoryHistory || [];
    
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
      ['CPU Total', `${metrics.cpu?.usageTotal || 0}%`, getStatusText(metrics.cpu?.usageTotal || 0)],
      ['CPU Velocidade', `${metrics.cpu?.speed || 0} MHz`, 'Normal'],
      ['Núcleos', `${metrics.cpu?.usagePerCore?.length || 0}`, '-'],
      ['Memória Usada', `${metrics.memory?.used || 0} GB / ${metrics.memory?.total || 0} GB`, getStatusText(metrics.memory?.percent || 0)],
      ['Memória Percentual', `${metrics.memory?.percent || 0}%`, getStatusText(metrics.memory?.percent || 0)],
      ['Disco Usado', `${metrics.disk?.used || 0} GB / ${metrics.disk?.total || 0} GB`, '-'],
      ['Rede (Interface)', metrics.network?.interface || 'N/A', '-'],
      ['Download', `${metrics.network?.rx || 0} KB/s`, '-'],
      ['Upload', `${metrics.network?.tx || 0} KB/s`, '-'],
    ];
    
    if (metrics.temperature?.cpu !== null && metrics.temperature?.cpu !== undefined) {
      metricsData.push(['Temperatura CPU', `${metrics.temperature.cpu}°C`, metrics.temperature.cpu > 80 ? 'Crítico' : 'Normal']);
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
    if (metrics.cpu?.usagePerCore && metrics.cpu.usagePerCore.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Uso por Núcleo', 20, yPos);
      yPos += 8;
      
      const coreData = metrics.cpu.usagePerCore.map((usage, i) => [
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
    if (operations.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Operações Recentes', 20, yPos);
      yPos += 8;
      
      const opsData = operations.slice(0, 10).map(op => [
        op.operation_name || 'N/A',
        op.operation_type || 'N/A',
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
    if (cpuHistory.length > 0 || memoryHistory.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Médias Históricas (Última Sessão)', 20, yPos);
      yPos += 8;
      
      const avgCpu = cpuHistory.length > 0 
        ? Math.round(cpuHistory.reduce((sum, p) => sum + (p.value || 0), 0) / cpuHistory.length)
        : 0;
      const avgMem = memoryHistory.length > 0
        ? Math.round(memoryHistory.reduce((sum, p) => sum + (p.value || 0), 0) / memoryHistory.length)
        : 0;
      const maxCpu = cpuHistory.length > 0 ? Math.max(...cpuHistory.map(p => p.value || 0)) : 0;
      const maxMem = memoryHistory.length > 0 ? Math.max(...memoryHistory.map(p => p.value || 0)) : 0;
      
      const histData = [
        ['CPU - Média', `${avgCpu}%`],
        ['CPU - Pico', `${maxCpu}%`],
        ['Memória - Média', `${avgMem}%`],
        ['Memória - Pico', `${maxMem}%`],
        ['Amostras Coletadas', `${cpuHistory.length}`],
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
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error('Falha ao gerar PDF. Verifique se as métricas estão carregadas.');
  }
};

function getStatusText(percent: number): string {
  if (percent >= 90) return 'Crítico';
  if (percent >= 70) return 'Atenção';
  return 'Normal';
}

export default generatePdfReport;
