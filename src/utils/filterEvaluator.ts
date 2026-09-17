import { CellValue, ColumnFilter, CellStyle } from '../types';

export function evaluateCellFilter(
  cellVal: CellValue,
  filter: ColumnFilter
): boolean {
  const cellStr = cellVal === null || cellVal === undefined ? '' : String(cellVal).trim();
  const filterVal = (filter.value || '').trim();

  switch (filter.operator) {
    case 'contains':
      return cellStr.toLowerCase().includes(filterVal.toLowerCase());

    case 'not_contains':
      return !cellStr.toLowerCase().includes(filterVal.toLowerCase());

    case 'equals':
      if (filterVal === '') return true;
      // If both are numbers, compare numerically
      const numCell = Number(cellStr.replace(/[^0-9.-]+/g, ''));
      const numFilter = Number(filterVal.replace(/[^0-9.-]+/g, ''));
      if (!isNaN(numCell) && !isNaN(numFilter) && cellStr !== '' && filterVal !== '') {
        return numCell === numFilter;
      }
      return cellStr.toLowerCase() === filterVal.toLowerCase();

    case 'not_equals':
      if (filterVal === '') return true;
      return cellStr.toLowerCase() !== filterVal.toLowerCase();

    case 'starts_with':
      return cellStr.toLowerCase().startsWith(filterVal.toLowerCase());

    case 'ends_with':
      return cellStr.toLowerCase().endsWith(filterVal.toLowerCase());

    case 'greater_than': {
      const cNum = parseFloat(cellStr.replace(/[^0-9.-]+/g, ''));
      const fNum = parseFloat(filterVal.replace(/[^0-9.-]+/g, ''));
      if (isNaN(cNum) || isNaN(fNum)) {
        return cellStr.localeCompare(filterVal) > 0;
      }
      return cNum > fNum;
    }

    case 'less_than': {
      const cNum = parseFloat(cellStr.replace(/[^0-9.-]+/g, ''));
      const fNum = parseFloat(filterVal.replace(/[^0-9.-]+/g, ''));
      if (isNaN(cNum) || isNaN(fNum)) {
        return cellStr.localeCompare(filterVal) < 0;
      }
      return cNum < fNum;
    }

    case 'is_empty':
      return cellStr === '';

    case 'is_not_empty':
      return cellStr !== '';

    case 'in_list':
      if (!filter.selectedValues || filter.selectedValues.size === 0) return true;
      return filter.selectedValues.has(cellStr);

    default:
      return true;
  }
}

export interface FilterResultItem {
  row: CellValue[];
  styles?: (CellStyle | null)[];
  originalIndex: number; // 0-based index in the sheet.data array
}

export function applyFilters(
  rows: CellValue[][],
  filters: ColumnFilter[],
  highlightedRowIndices: Set<number>,
  showOnlyHighlighted: boolean,
  cellStyles?: (CellStyle | null)[][]
): FilterResultItem[] {
  const result: FilterResultItem[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Check row highlight constraint
    if (showOnlyHighlighted && !highlightedRowIndices.has(i)) {
      continue;
    }

    // Check all column criteria
    let passesAll = true;
    for (const filter of filters) {
      const cellVal = row[filter.colIndex];
      if (!evaluateCellFilter(cellVal, filter)) {
        passesAll = false;
        break;
      }
    }

    if (passesAll) {
      result.push({
        row,
        styles: cellStyles ? cellStyles[i] : undefined,
        originalIndex: i,
      });
    }
  }

  return result;
}

export function extractUniqueColumnValues(
  rows: CellValue[][],
  colIndex: number
): { value: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const rawVal = row[colIndex];
    const val = rawVal === null || rawVal === undefined ? '' : String(rawVal).trim();
    const displayVal = val === '' ? '(Empty)' : val;
    counts.set(displayVal, (counts.get(displayVal) || 0) + 1);
  }

  const items: { value: string; count: number }[] = [];
  for (const [value, count] of counts.entries()) {
    items.push({ value, count });
  }

  // Sort alphabetically or numerically
  return items.sort((a, b) => {
    if (a.value === '(Empty)') return 1;
    if (b.value === '(Empty)') return -1;
    return a.value.localeCompare(b.value, undefined, { numeric: true });
  });
}
