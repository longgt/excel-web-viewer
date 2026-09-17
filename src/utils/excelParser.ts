import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { SheetData, WorkbookData, CellValue, CellStyle } from '../types';
import { extractExcelJsCellStyle } from './styleParser';

export function getColumnLetter(colIndex: number): string {
  let letter = '';
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Extracts normalized CellValue from an ExcelJS Cell
 */
export function extractExcelJsCellValue(cell: any): CellValue {
  if (!cell || cell.value === null || cell.value === undefined) {
    return '';
  }

  const val = cell.value;

  // 1. Primitive types
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
    // If formatted display text is provided (currency, percentage, formatted date), use it
    if (typeof val === 'number' && cell.numFmt && cell.text) {
      return cell.text;
    }
    return val;
  }

  // 2. Date object
  if (val instanceof Date) {
    if (cell.text && typeof cell.text === 'string' && cell.text.trim()) {
      return cell.text;
    }
    return val.toISOString().split('T')[0];
  }

  // 3. Formula object: { formula: string, result: any }
  if (typeof val === 'object' && 'result' in val) {
    if (val.result !== undefined && val.result !== null) {
      if (val.result instanceof Date) {
        return cell.text || val.result.toISOString().split('T')[0];
      }
      return val.result;
    }
    if (cell.text) return cell.text;
    return `=${val.formula}`;
  }

  // 4. Rich text: { richText: Array<{ text: string, font?: any }> }
  if (typeof val === 'object' && Array.isArray(val.richText)) {
    return val.richText.map((chunk: any) => chunk.text || '').join('');
  }

  // 5. Hyperlink: { text: string, hyperlink: string }
  if (typeof val === 'object' && 'text' in val) {
    return val.text;
  }

  // 6. Fallback to cell.text or String(val)
  if (cell.text !== undefined && cell.text !== null) {
    return cell.text;
  }

  return String(val);
}

/**
 * Parses modern OOXML (.xlsx) files using ExcelJS to retain formatting:
 * font size, bold, italic, underline, strike, text color, background color, borders, alignment.
 */
export async function parseExcelWithExcelJs(
  data: ArrayBuffer,
  fileName: string,
  fileSize: number
): Promise<WorkbookData> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);

  const sheets: Record<string, SheetData> = {};
  const sheetNames: string[] = [];

  for (const worksheet of workbook.worksheets) {
    const sheetName = worksheet.name;
    sheetNames.push(sheetName);

    const rowCount = worksheet.rowCount || 0;
    let maxCols = worksheet.columnCount || 0;

    worksheet.eachRow({ includeEmpty: true }, (row) => {
      if (row.cellCount > maxCols) {
        maxCols = row.cellCount;
      }
    });

    if (maxCols === 0) maxCols = 1;

    const rawRows: CellValue[][] = [];
    const rawStyles: (CellStyle | null)[][] = [];

    for (let rIdx = 1; rIdx <= rowCount; rIdx++) {
      const row = worksheet.getRow(rIdx);
      const rowVals: CellValue[] = new Array(maxCols).fill('');
      const rowStyling: (CellStyle | null)[] = new Array(maxCols).fill(null);

      let rowHasDataOrStyle = false;
      for (let cIdx = 1; cIdx <= maxCols; cIdx++) {
        const cell = row.getCell(cIdx);
        const cellVal = extractExcelJsCellValue(cell);
        const style = extractExcelJsCellStyle(cell);

        rowVals[cIdx - 1] = cellVal;
        rowStyling[cIdx - 1] = style;

        if (cellVal !== '' || style !== null) {
          rowHasDataOrStyle = true;
        }
      }

      if (rowHasDataOrStyle || rIdx <= rowCount) {
        rawRows.push(rowVals);
        rawStyles.push(rowStyling);
      }
    }

    // Trim trailing empty rows
    while (rawRows.length > 0) {
      const lastRow = rawRows[rawRows.length - 1];
      const lastRowStyles = rawStyles[rawStyles.length - 1];
      const hasContent = lastRow.some((v) => v !== '' && v !== null && v !== undefined);
      const hasStyle = lastRowStyles.some((s) => s !== null);
      if (!hasContent && !hasStyle) {
        rawRows.pop();
        rawStyles.pop();
      } else {
        break;
      }
    }

    if (rawRows.length === 0) {
      rawRows.push(['']);
      rawStyles.push([null]);
    }

    let headers: string[] = [];
    let headerStyles: (CellStyle | null)[] = [];
    let dataRows: CellValue[][] = [];
    let cellStyles: (CellStyle | null)[][] = [];

    const firstRow = rawRows[0];
    const firstRowStyles = rawStyles[0];
    const hasAnyHeaderVal = firstRow.some((val) => val !== '' && val !== null && val !== undefined);

    if (hasAnyHeaderVal) {
      headers = firstRow.map((val, idx) => {
        const str = String(val ?? '').trim();
        return str.length > 0 ? str : `Col ${getColumnLetter(idx)}`;
      });
      headerStyles = firstRowStyles;
      dataRows = rawRows.slice(1);
      cellStyles = rawStyles.slice(1);
    } else {
      headers = Array.from({ length: maxCols }, (_, i) => getColumnLetter(i));
      headerStyles = new Array(maxCols).fill(null);
      dataRows = rawRows;
      cellStyles = rawStyles;
    }

    sheets[sheetName] = {
      name: sheetName,
      data: dataRows,
      headers,
      rawRows,
      rowCount: dataRows.length,
      colCount: headers.length,
      cellStyles,
      headerStyles,
      rawStyles,
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

/**
 * Fallback parser using SheetJS (XLSX) for legacy or tabular formats (.xls, .csv, .tsv)
 */
export function parseExcelWithSheetJS(
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

  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rawJsonRows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: '',
    }) as CellValue[][];

    let maxCols = 0;
    for (const row of rawJsonRows) {
      if (Array.isArray(row) && row.length > maxCols) {
        maxCols = row.length;
      }
    }

    const normalizedRows: CellValue[][] = (rawJsonRows.length > 0 ? rawJsonRows : [[]]).map((row) => {
      const fullRow = new Array(maxCols);
      for (let i = 0; i < maxCols; i++) {
        fullRow[i] = row && row[i] !== undefined ? row[i] : '';
      }
      return fullRow;
    });

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
      cellStyles: dataRows.map(() => new Array(headers.length).fill(null)),
      headerStyles: new Array(headers.length).fill(null),
      rawStyles: normalizedRows.map(() => new Array(headers.length).fill(null)),
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

/**
 * Main parser entry point: prefers ExcelJS for rich formatting preservation (.xlsx),
 * with SheetJS fallback for legacy formats.
 */
export async function parseExcelWorkbook(
  data: ArrayBuffer,
  fileName: string,
  fileSize: number
): Promise<WorkbookData> {
  const lowerName = fileName.toLowerCase();
  const isXlsx = lowerName.endsWith('.xlsx');
  const isLegacy = lowerName.endsWith('.xls') || lowerName.endsWith('.csv') || lowerName.endsWith('.tsv');

  if (isXlsx || !isLegacy) {
    try {
      return await parseExcelWithExcelJs(data, fileName, fileSize);
    } catch (err) {
      console.warn('ExcelJS failed to parse, falling back to SheetJS:', err);
    }
  }

  return parseExcelWithSheetJS(data, fileName, fileSize);
}
