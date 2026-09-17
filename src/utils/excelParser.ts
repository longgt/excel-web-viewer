import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { SheetData, WorkbookData, CellValue, CellStyle } from '../types';
import { extractExcelJsCellStyle, parseExcelColor } from './styleParser';
import { propagateMergedValues, isRow0Merged, adjustMergesForRowOffset } from './mergeUtils';

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
 * Formats a value according to an Excel numFmt string
 */
export function formatExcelValue(val: any, numFmt?: string): CellValue {
  if (val === null || val === undefined || val === '') return '';

  if (!numFmt || numFmt === 'General' || numFmt === '@') {
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    if (typeof val === 'number') {
      return Number(val.toPrecision(12)).toString();
    }
    return val;
  }

  if (typeof val === 'string') {
    return val;
  }

  // Handle Date
  if (val instanceof Date || (typeof val === 'number' && /yy|dd|mm|hh|ss/i.test(numFmt))) {
    try {
      const cleanFmt = numFmt.replace(/\\/g, '').replace(/\[[^\]]+\]/g, '');
      return XLSX.SSF.format(cleanFmt, val);
    } catch {
      if (val instanceof Date) return val.toISOString().split('T')[0];
    }
  }

  if (typeof val === 'number') {
    const hasDollar = numFmt.includes('$');
    const hasEuro = numFmt.includes('€');
    const hasPound = numFmt.includes('£');
    const hasYen = numFmt.includes('¥');
    const hasPercent = numFmt.includes('%');

    let cleanFmt = numFmt
      .replace(/\[\$.*?\]/g, '')
      .replace(/"[^"]*"/g, '')
      .replace(/_/g, '')
      .replace(/\\./g, '')
      .replace(/\*/g, '')
      .trim();

    if (cleanFmt.includes(';')) {
      const parts = cleanFmt.split(';');
      cleanFmt = val < 0 && parts.length > 1 ? parts[1] : parts[0];
    }

    if (cleanFmt.startsWith('0,')) cleanFmt = '#' + cleanFmt;

    try {
      let formatted = XLSX.SSF.format(cleanFmt, val);
      if (hasDollar && !formatted.includes('$')) formatted = (val < 0 ? '-$' : '$') + formatted.replace(/^-/, '');
      if (hasEuro && !formatted.includes('€')) formatted = formatted + ' €';
      if (hasPound && !formatted.includes('£')) formatted = '£' + formatted;
      if (hasYen && !formatted.includes('¥')) formatted = '¥' + formatted;
      return formatted;
    } catch {
      if (hasPercent) return (val * 100).toFixed(1) + '%';
      if (hasDollar) return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return val.toLocaleString();
    }
  }

  return String(val);
}

/**
 * Extracts normalized CellValue from an ExcelJS Cell
 */
export function extractExcelJsCellValue(cell: any): CellValue {
  if (!cell || cell.value === null || cell.value === undefined) {
    return '';
  }

  const val = cell.value;
  const numFmt = cell.numFmt;

  // 1. Primitive types
  if (typeof val === 'string') {
    return val;
  }
  if (typeof val === 'boolean') {
    return val;
  }
  if (typeof val === 'number') {
    if (numFmt && numFmt !== 'General') {
      return formatExcelValue(val, numFmt);
    }
    return val;
  }

  // 2. Date object
  if (val instanceof Date) {
    if (numFmt && numFmt !== 'General') {
      return formatExcelValue(val, numFmt);
    }
    return val.toISOString().split('T')[0];
  }

  // 3. Formula object: { formula: string, result: any }
  if (typeof val === 'object' && 'result' in val) {
    if (val.result !== undefined && val.result !== null) {
      if (numFmt && numFmt !== 'General') {
        return formatExcelValue(val.result, numFmt);
      }
      if (val.result instanceof Date) {
        return val.result.toISOString().split('T')[0];
      }
      return val.result;
    }
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

    // Extract raw merges from ExcelJS
    const merges = Array.isArray(worksheet.model?.merges) ? [...worksheet.model.merges] : [];

    // Propagate master values to subordinate cells in raw data so filters/searches/copies work seamlessly
    propagateMergedValues(rawRows, rawStyles, merges);

    let headers: string[] = [];
    let headerStyles: (CellStyle | null)[] = [];
    let dataRows: CellValue[][] = [];
    let cellStyles: (CellStyle | null)[][] = [];
    let finalMerges: string[] = merges;

    // Check if row 0 has merged cells (e.g. A1:D1 title or section banner).
    // If it has merged cells, Row 1 MUST NOT be sliced off as a column header,
    // otherwise the merged table/title disappears from the grid!
    const row0HasMerge = isRow0Merged(merges);
    const firstRow = rawRows[0];
    const firstRowStyles = rawStyles[0];
    const hasAnyHeaderVal = firstRow.some((val) => val !== '' && val !== null && val !== undefined);

    if (!row0HasMerge && hasAnyHeaderVal) {
      headers = firstRow.map((val, idx) => {
        const str = String(val ?? '').trim();
        return str.length > 0 ? str : `Col ${getColumnLetter(idx)}`;
      });
      headerStyles = firstRowStyles;
      dataRows = rawRows.slice(1);
      cellStyles = rawStyles.slice(1);
      finalMerges = adjustMergesForRowOffset(merges, -1);
    } else {
      headers = Array.from({ length: maxCols }, (_, i) => getColumnLetter(i));
      headerStyles = new Array(maxCols).fill(null);
      dataRows = rawRows;
      cellStyles = rawStyles;
      finalMerges = merges;
    }

    // Extract Column Widths in pixels from Excel
    const columnWidths: number[] = [];
    for (let cIdx = 1; cIdx <= maxCols; cIdx++) {
      const col = worksheet.getColumn(cIdx);
      if (col && typeof col.width === 'number' && col.width > 0) {
        // Excel column width units to pixels
        columnWidths.push(Math.max(65, Math.min(600, Math.round(col.width * 8.2 + 12))));
      } else {
        columnWidths.push(140);
      }
    }

    // Extract Row Heights in pixels from Excel
    const rowHeights: (number | undefined)[] = [];
    for (let rIdx = 1; rIdx <= rawRows.length; rIdx++) {
      const row = worksheet.getRow(rIdx);
      if (row && typeof row.height === 'number' && row.height > 0) {
        rowHeights.push(Math.round(row.height * 1.33));
      } else {
        rowHeights.push(undefined);
      }
    }

    // Extract Tab Color & Gridlines view options
    const tabColor = parseExcelColor(worksheet.properties?.tabColor);
    const showGridLines = worksheet.views?.[0]?.showGridLines !== false;

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
      columnWidths,
      rowHeights,
      tabColor,
      showGridLines,
      merges: finalMerges,
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

    const rawMerges: string[] = Array.isArray(worksheet['!merges'])
      ? worksheet['!merges'].map((m) => XLSX.utils.encode_range(m))
      : [];

    const rawStyles = normalizedRows.map(() => new Array(maxCols).fill(null));

    // Propagate master values to subordinate cells in raw data so filters/searches work seamlessly
    propagateMergedValues(normalizedRows, rawStyles, rawMerges);

    let headers: string[] = [];
    let headerStyles: (CellStyle | null)[] = [];
    let dataRows: CellValue[][] = [];
    let cellStyles: (CellStyle | null)[][] = [];
    let finalMerges: string[] = rawMerges;

    const row0HasMerge = isRow0Merged(rawMerges);

    if (normalizedRows.length > 0) {
      const firstRow = normalizedRows[0];
      const hasAnyNonEmpty = firstRow.some((val) => val !== '' && val !== null && val !== undefined);

      if (!row0HasMerge && hasAnyNonEmpty) {
        headers = firstRow.map((val, idx) => {
          const str = String(val ?? '').trim();
          return str.length > 0 ? str : `Col ${getColumnLetter(idx)}`;
        });
        headerStyles = new Array(headers.length).fill(null);
        dataRows = normalizedRows.slice(1);
        cellStyles = dataRows.map(() => new Array(headers.length).fill(null));
        finalMerges = adjustMergesForRowOffset(rawMerges, -1);
      } else {
        headers = Array.from({ length: maxCols }, (_, i) => getColumnLetter(i));
        headerStyles = new Array(maxCols).fill(null);
        dataRows = normalizedRows;
        cellStyles = rawStyles;
        finalMerges = rawMerges;
      }
    } else {
      headers = [getColumnLetter(0)];
      headerStyles = [null];
      dataRows = [];
      cellStyles = [];
      finalMerges = [];
    }

    // Extract Column Widths from SheetJS !cols
    const columnWidths: number[] = [];
    if (worksheet['!cols']) {
      for (let c = 0; c < headers.length; c++) {
        const colInfo = worksheet['!cols'][c];
        if (colInfo?.wch) {
          columnWidths.push(Math.max(65, Math.min(600, Math.round(colInfo.wch * 8.2 + 12))));
        } else if (colInfo?.wpx) {
          columnWidths.push(Math.max(65, Math.min(600, colInfo.wpx)));
        } else {
          columnWidths.push(140);
        }
      }
    } else {
      columnWidths.push(...new Array(headers.length).fill(140));
    }

    // Extract Row Heights from SheetJS !rows
    const rowHeights: (number | undefined)[] = [];
    if (worksheet['!rows']) {
      for (let r = 0; r < normalizedRows.length; r++) {
        const rowInfo = worksheet['!rows'][r];
        if (rowInfo?.hpt) {
          rowHeights.push(Math.round(rowInfo.hpt * 1.33));
        } else if (rowInfo?.hpx) {
          rowHeights.push(rowInfo.hpx);
        } else {
          rowHeights.push(undefined);
        }
      }
    }

    sheets[sheetName] = {
      name: sheetName,
      data: dataRows,
      headers,
      rawRows: normalizedRows,
      rowCount: dataRows.length,
      colCount: headers.length,
      cellStyles,
      headerStyles,
      rawStyles,
      columnWidths,
      rowHeights,
      showGridLines: true,
      merges: finalMerges,
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
