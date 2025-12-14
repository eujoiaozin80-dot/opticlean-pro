/**
 * Utilitários para exportação de dados
 */

import type { Process } from '@/types/process';

/**
 * Exporta lista de processos para CSV
 */
export function exportProcessesToCSV(processes: Process[], filename = 'processos.csv'): void {
  try {
    const csv = [
      ['Nome', 'PID', 'CPU %', 'RAM %', 'CPU Total', 'RAM Total'].join(','),
      ...processes.map((p) =>
        [
          `"${p.name.replace(/"/g, '""')}"`, // Escape quotes
          p.pid,
          p.cpuPercent.toFixed(2),
          p.memPercent.toFixed(2),
          p.cpu.toFixed(2),
          p.mem.toFixed(2),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM para Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Erro ao exportar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Exporta lista de processos para JSON
 */
export function exportProcessesToJSON(processes: Process[], filename = 'processos.json'): void {
  try {
    const json = JSON.stringify(processes, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Erro ao exportar JSON: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

