export type CellValue = string | number | boolean | null | undefined;

export interface CellBorderSide {
  style?: 'thin' | 'medium' | 'thick' | 'double' | 'dashed' | 'dotted';
  color?: string; // CSS color string (e.g. "#94a3b8")
}

export interface CellBorders {
  top?: CellBorderSide;
  right?: CellBorderSide;
  bottom?: CellBorderSide;
  left?: CellBorderSide;
}

export interface CellStyle {
  fontSize?: number; // font size in pt (e.g. 11, 12, 14, 18)
  fontName?: string; // font family name (e.g. "Calibri", "Arial")
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string; // font color CSS string (e.g. "#1e293b")
  backgroundColor?: string; // fill color CSS string (e.g. "#fef08a")
  borders?: CellBorders;
  horizontalAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  wrapText?: boolean;
}

export interface SheetData {
  name: string;
  data: CellValue[][]; // 2D array of rows and columns (excluding header if hasHeaderRow is true, or including all)
  headers: string[]; // Header labels (either from row 1 or A, B, C...)
  rawRows: CellValue[][]; // Complete raw grid
  rowCount: number;
  colCount: number;
  cellStyles?: (CellStyle | null)[][]; // 2D array of cell styles corresponding to data
  headerStyles?: (CellStyle | null)[]; // Cell styles corresponding to headers
  rawStyles?: (CellStyle | null)[][]; // 2D array of cell styles corresponding to rawRows
}

export interface WorkbookData {
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  sheets: Record<string, SheetData>;
  activeSheetName: string;
}

export type FilterOperator =
  | 'contains'
  | 'not_contains'
  | 'equals'
  | 'not_equals'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty'
  | 'in_list';

export interface ColumnFilter {
  colIndex: number;
  colName: string;
  operator: FilterOperator;
  value: string;
  selectedValues?: Set<string>; // For multi-select discrete values
}

export interface TextHighlightConfig {
  query: string;
  caseSensitive: boolean;
  exactMatch: boolean;
  color: 'amber' | 'emerald' | 'sky' | 'rose' | 'violet';
  currentMatchIndex: number;
  totalMatches: number;
}

export interface CellPosition {
  rowIndex: number; // 0-based index in the current displayed view
  colIndex: number; // 0-based column index
  rawRowIndex: number; // 0-based index in the underlying sheet data
  cellAddress: string; // e.g. "B4"
}

export interface RowHighlightConfig {
  highlightedRowKeys: Set<number>; // raw row indices
  color: 'amber' | 'emerald' | 'sky' | 'rose' | 'violet';
  showOnlyHighlighted: boolean;
}

export interface ExportOptions {
  fileName: string;
  delimiter: ',' | ';' | '\t' | '|';
  scope: 'all' | 'filtered' | 'highlighted_only';
  includeHeaders: boolean;
  sheetsScope: 'current' | 'all';
}
