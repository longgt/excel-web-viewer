import { CellValue, ExportOptions } from '../types';

export function formatCsvValue(val: CellValue, delimiter: string): string {
  if (val === null || val === undefined) {
    return '';
  }
  const str = String(val);
  // Check if quoting is needed: contains delimiter, double quote, newline, or carriage return
  const needsQuotes =
    str.includes(delimiter) ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r');

  if (needsQuotes) {
    // Escape double quotes by doubling them
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCsvString(
  headers: string[] | null,
  rows: CellValue[][],
  delimiter: string = ','
): string {
  const lines: string[] = [];

  if (headers && headers.length > 0) {
    lines.push(headers.map((h) => formatCsvValue(h, delimiter)).join(delimiter));
  }

  for (const row of rows) {
    lines.push(row.map((cell) => formatCsvValue(cell, delimiter)).join(delimiter));
  }

  return lines.join('\r\n');
}

export function downloadCsvFile(content: string, fileName: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
  link.setAttribute('download', safeName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
