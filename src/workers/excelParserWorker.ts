import * as XLSX from 'xlsx';
import { SheetData, WorkbookData, CellValue } from '../types';

function getColumnLetter(colIndex: number): string {
  let letter = '';
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

export function parseExcelWorkbookInWorker(
  data: ArrayBuffer,
  fileName: string,
  fileSize: number
): WorkbookData {
  const workbook = XLSX.read(data, {
    type: 'array',
    cellDates: true,
    cellNF: true,
    cellText: true,
  });

  const sheets: Record<string, SheetData> = {};
  const sheetNames = workbook.SheetNames;

  for (let sIdx = 0; sIdx < sheetNames.length; sIdx++) {
    const sheetName = sheetNames[sIdx];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to 2D array of rows
    const rawJsonRows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: '',
    }) as CellValue[][];

    // Find maximum column width across all rows
    let maxCols = 0;
    for (const row of rawJsonRows) {
      if (Array.isArray(row) && row.length > maxCols) {
        maxCols = row.length;
      }
    }

    // Ensure at least 1 row and 1 column
    const normalizedRows: CellValue[][] = (rawJsonRows.length > 0 ? rawJsonRows : [[]]).map((row) => {
      const fullRow = new Array(maxCols);
      for (let i = 0; i < maxCols; i++) {
        fullRow[i] = row && row[i] !== undefined ? row[i] : '';
      }
      return fullRow;
    });

    // Check if the first row looks like headers
    let headers: string[] = [];
    let dataRows: CellValue[][] = [];

    if (normalizedRows.length > 0) {
      const firstRow = normalizedRows[0];
      const hasAnyNonEmpty = firstRow.some((val) => val !== '' && val !== null && val !== undefined);

      if (hasAnyNonEmpty) {
        headers = firstRow.map((val, idx) => {
          const str = String(val ?? '').trim();
          return str.length > 0 ? str : `Col ${getColumnLetter(idx)}`;
        });
        dataRows = normalizedRows.slice(1);
      } else {
        headers = Array.from({ length: maxCols }, (_, i) => getColumnLetter(i));
        dataRows = normalizedRows;
      }
    } else {
      headers = [getColumnLetter(0)];
      dataRows = [];
    }

    sheets[sheetName] = {
      name: sheetName,
      data: dataRows,
      headers,
      rawRows: normalizedRows,
      rowCount: dataRows.length,
      colCount: headers.length,
    };
  }

  const activeSheetName = sheetNames.length > 0 ? sheetNames[0] : '';

  return {
    fileName,
    fileSize,
    sheetNames,
    sheets,
    activeSheetName,
  };
}

// Worker message event handler
self.onmessage = (e: MessageEvent<{ buffer: ArrayBuffer; fileName: string; fileSize: number }>) => {
  const { buffer, fileName, fileSize } = e.data;
  try {
    const parsed = parseExcelWorkbookInWorker(buffer, fileName, fileSize);
    self.postMessage({
      type: 'SUCCESS',
      workbook: parsed,
    });
  } catch (error: any) {
    self.postMessage({
      type: 'ERROR',
      error: error?.message || 'Failed to parse Excel workbook in worker thread',
    });
  }
};
