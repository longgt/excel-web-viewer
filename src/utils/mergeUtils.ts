import { CellValue, CellStyle, MergedCellRange } from '../types';
import { getColumnLetter } from './excelParser';

/**
 * Parses an Excel cell address like "A1", "C24", "AB102" into 0-based { row, col }
 */
export function parseCellAddress(addr: string): { row: number; col: number } | null {
  if (!addr) return null;
  const match = addr.trim().toUpperCase().match(/^([A-Z]+)([0-9]+)$/);
  if (!match) return null;

  const colLetters = match[1];
  const rowNum = parseInt(match[2], 10);
  if (isNaN(rowNum) || rowNum < 1) return null;

  let col = 0;
  for (let i = 0; i < colLetters.length; i++) {
    col = col * 26 + (colLetters.charCodeAt(i) - 65 + 1);
  }

  return { row: rowNum - 1, col: col - 1 };
}

/**
 * Encodes 0-based row and col into an Excel address like "A1", "B2"
 */
export function encodeCellAddress(row: number, col: number): string {
  return `${getColumnLetter(col)}${row + 1}`;
}

/**
 * Parses an Excel range string like "A1:D1", "B2:B5", or "C3" into a normalized MergedCellRange
 */
export function parseMergeRange(rangeStr: string): MergedCellRange | null {
  if (!rangeStr) return null;
  const cleanStr = rangeStr.trim().toUpperCase();
  const parts = cleanStr.split(':');

  const start = parseCellAddress(parts[0]);
  if (!start) return null;

  const end = parts.length > 1 ? parseCellAddress(parts[1]) : start;
  if (!end) return null;

  const startRow = Math.min(start.row, end.row);
  const endRow = Math.max(start.row, end.row);
  const startCol = Math.min(start.col, end.col);
  const endCol = Math.max(start.col, end.col);

  return {
    startRow,
    startCol,
    endRow,
    endCol,
    rowSpan: endRow - startRow + 1,
    colSpan: endCol - startCol + 1,
  };
}

export interface MergeMaps {
  masterMap: Map<string, MergedCellRange>; // Key: "row,col"
  coveredMap: Map<string, { masterRow: number; masterCol: number }>; // Key: "row,col"
}

/**
 * Builds fast lookup maps for merged cells
 */
export function buildMergeMaps(merges?: string[]): MergeMaps {
  const masterMap = new Map<string, MergedCellRange>();
  const coveredMap = new Map<string, { masterRow: number; masterCol: number }>();

  if (!merges || merges.length === 0) {
    return { masterMap, coveredMap };
  }

  for (const rangeStr of merges) {
    const range = parseMergeRange(rangeStr);
    if (!range) continue;

    // Only multi-cell ranges are true merges
    if (range.rowSpan <= 1 && range.colSpan <= 1) continue;

    const masterKey = `${range.startRow},${range.startCol}`;
    masterMap.set(masterKey, range);

    for (let r = range.startRow; r <= range.endRow; r++) {
      for (let c = range.startCol; c <= range.endCol; c++) {
        if (r === range.startRow && c === range.startCol) continue;
        coveredMap.set(`${r},${c}`, {
          masterRow: range.startRow,
          masterCol: range.startCol,
        });
      }
    }
  }

  return { masterMap, coveredMap };
}

/**
 * Checks if row 0 (Excel Row 1) contains any merged cells across columns or rows.
 * If true, Row 1 is a merged title, banner, or section header and MUST NOT be sliced off.
 */
export function isRow0Merged(merges?: string[]): boolean {
  if (!merges || merges.length === 0) return false;
  for (const m of merges) {
    const range = parseMergeRange(m);
    if (!range) continue;
    if (range.startRow === 0 && (range.colSpan > 1 || range.rowSpan > 1)) {
      return true;
    }
  }
  return false;
}

/**
 * Ensures that subordinate cells in merged ranges are populated with the master cell's value and style.
 * This guarantees that:
 * 1. Filtering by a category or merged value does not filter out subordinate rows
 * 2. Searching/highlighting finds all cells within the merge
 * 3. Copying row or cell captures the correct data
 * 4. Merged cells do not appear as empty blanks
 */
export function propagateMergedValues(
  rows: CellValue[][],
  styles: (CellStyle | null)[][],
  merges?: string[]
): void {
  if (!merges || merges.length === 0 || rows.length === 0) return;

  for (const m of merges) {
    const range = parseMergeRange(m);
    if (!range) continue;

    const masterRow = range.startRow;
    const masterCol = range.startCol;
    if (masterRow < 0 || masterRow >= rows.length) continue;

    const masterVal = rows[masterRow]?.[masterCol];
    const masterStyle = styles[masterRow]?.[masterCol];

    for (let r = range.startRow; r <= range.endRow; r++) {
      if (r < 0 || r >= rows.length) continue;
      const row = rows[r];
      const styleRow = styles[r];
      if (!row) continue;

      for (let c = range.startCol; c <= range.endCol; c++) {
        if (r === masterRow && c === masterCol) continue;

        // If subordinate cell is empty, populate from master
        if (row[c] === '' || row[c] === null || row[c] === undefined) {
          row[c] = masterVal;
        }

        // Propagate style if subordinate cell has none
        if (styleRow && styleRow[c] === null && masterStyle) {
          styleRow[c] = masterStyle;
        }
      }
    }
  }
}

/**
 * When row 0 was stripped as a header row (offset = -1), adjusts any merge ranges
 * that apply to the remaining data rows.
 */
export function adjustMergesForRowOffset(merges: string[], rowOffset: number): string[] {
  if (!merges || merges.length === 0 || rowOffset === 0) return merges || [];

  const adjusted: string[] = [];
  for (const m of merges) {
    const range = parseMergeRange(m);
    if (!range) continue;

    const newStartRow = range.startRow + rowOffset;
    const newEndRow = range.endRow + rowOffset;

    // If merge was entirely on the stripped header row, drop it
    if (newEndRow < 0) continue;

    // Clamp start row to 0 if it started on the header row
    const clampedStartRow = Math.max(0, newStartRow);
    const startAddr = encodeCellAddress(clampedStartRow, range.startCol);
    const endAddr = encodeCellAddress(newEndRow, range.endCol);

    adjusted.push(`${startAddr}:${endAddr}`);
  }

  return adjusted;
}
