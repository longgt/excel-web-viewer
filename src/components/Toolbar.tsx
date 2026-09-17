import React, { useState } from 'react';
import {
  Search,
  ChevronUp,
  ChevronDown,
  X,
  Highlighter,
  SlidersHorizontal,
  BookmarkCheck,
  RotateCcw,
  Check,
  Eye,
  FilterX,
  CaseSensitive,
  Grid,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
} from 'lucide-react';
import {
  CellPosition,
  ColumnFilter,
  RowHighlightConfig,
  TextHighlightConfig,
  CellStyle,
} from '../types';
import { copyToClipboard } from '../utils/clipboard';

interface ToolbarProps {
  activeCell: CellPosition | null;
  activeCellValue: string;
  activeCellStyle?: CellStyle | null;
  textHighlight: TextHighlightConfig;
  onTextHighlightChange: (config: Partial<TextHighlightConfig>) => void;
  onNavigateMatch: (direction: 'next' | 'prev') => void;
  rowHighlight: RowHighlightConfig;
  onRowHighlightChange: (config: Partial<RowHighlightConfig>) => void;
  onClearRowHighlights: () => void;
  filters: ColumnFilter[];
  onRemoveFilter: (colIndex: number) => void;
  onClearAllFilters: () => void;
  showGridLines?: boolean;
  onToggleGridLines?: () => void;
}

const HIGHLIGHT_COLORS: Array<{
  id: 'amber' | 'emerald' | 'sky' | 'rose' | 'violet';
  label: string;
  bgClass: string;
  ringClass: string;
}> = [
  { id: 'amber', label: 'Amber', bgClass: 'bg-amber-400', ringClass: 'ring-amber-500' },
  { id: 'emerald', label: 'Emerald', bgClass: 'bg-emerald-400', ringClass: 'ring-emerald-500' },
  { id: 'sky', label: 'Sky Blue', bgClass: 'bg-sky-400', ringClass: 'ring-sky-500' },
  { id: 'rose', label: 'Rose Pink', bgClass: 'bg-rose-400', ringClass: 'ring-rose-500' },
  { id: 'violet', label: 'Violet', bgClass: 'bg-violet-400', ringClass: 'ring-violet-500' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  activeCell,
  activeCellValue,
  activeCellStyle,
  textHighlight,
  onTextHighlightChange,
  onNavigateMatch,
  rowHighlight,
  onRowHighlightChange,
  onClearRowHighlights,
  filters,
  onRemoveFilter,
  onClearAllFilters,
  showGridLines = true,
  onToggleGridLines,
}) => {
  const highlightedRowCount = rowHighlight.highlightedRowKeys.size;
  const [hasCopiedFormula, setHasCopiedFormula] = useState(false);

  return (
    <div className="bg-white border-b border-slate-200 divide-y divide-slate-100 text-xs">
      {/* Top row: Formula bar & Text Search / Sheet Text Highlighting */}
      <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active cell address & Formula / Value inspection & Formatting indicator */}
        <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-2xl">
          <div className="h-8 px-2.5 bg-slate-100 text-slate-700 font-mono font-medium rounded border border-slate-200 flex items-center justify-center shrink-0 min-w-[54px] shadow-2xs">
            {activeCell ? activeCell.cellAddress : '—'}
          </div>
          <div className="relative flex-1 flex items-center">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-serif italic text-xs select-none">
              fx
            </span>
            <input
              type="text"
              readOnly
              value={activeCellValue}
              placeholder="Select any cell to inspect its value or formula"
              className="w-full h-8 pl-8 pr-8 bg-slate-50 border border-slate-200 rounded text-slate-800 font-mono text-xs focus:outline-hidden focus:bg-white focus:border-emerald-500 transition-colors"
            />
            {activeCell && activeCellValue && (
              <button
                id="btn-copy-active-cell"
                onClick={async () => {
                  await copyToClipboard(activeCellValue);
                  setHasCopiedFormula(true);
                  setTimeout(() => setHasCopiedFormula(false), 1800);
                }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-200/80 rounded transition-colors cursor-pointer"
                title="Copy cell value (Ctrl+C)"
              >
                {hasCopiedFormula ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          {/* Active cell formatting indicators */}
          {activeCellStyle && (
            <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 bg-slate-100/80 border border-slate-200 rounded text-slate-600 shrink-0">
              {activeCellStyle.fontName && (
                <span className="text-[11px] font-sans font-medium text-slate-700 truncate max-w-[85px]" title={`Font family: ${activeCellStyle.fontName}`}>
                  {activeCellStyle.fontName}
                </span>
              )}
              {activeCellStyle.fontSize && (
                <span className="text-[10px] font-mono text-slate-600 bg-white px-1 py-0.5 rounded border border-slate-200 shadow-2xs" title={`Font size: ${activeCellStyle.fontSize}pt`}>
                  {activeCellStyle.fontSize}pt
                </span>
              )}

              {/* Text formatting B/I/U/S */}
              <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1">
                <span
                  className={`w-5 h-5 flex items-center justify-center rounded text-[11px] font-bold ${
                    activeCellStyle.bold ? 'bg-emerald-100 text-emerald-800 font-extrabold' : 'text-slate-300'
                  }`}
                  title={activeCellStyle.bold ? 'Bold' : 'Regular'}
                >
                  B
                </span>
                <span
                  className={`w-5 h-5 flex items-center justify-center rounded text-[11px] italic font-serif ${
                    activeCellStyle.italic ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-300'
                  }`}
                  title={activeCellStyle.italic ? 'Italic' : 'Regular'}
                >
                  I
                </span>
                <span
                  className={`w-5 h-5 flex items-center justify-center rounded text-[11px] underline ${
                    activeCellStyle.underline ? 'bg-emerald-100 text-emerald-800' : 'text-slate-300'
                  }`}
                  title={activeCellStyle.underline ? 'Underlined' : 'No underline'}
                >
                  U
                </span>
                {activeCellStyle.strike && (
                  <span
                    className="w-5 h-5 flex items-center justify-center rounded text-[11px] line-through bg-emerald-100 text-emerald-800"
                    title="Strikethrough"
                  >
                    S
                  </span>
                )}
              </div>

              {/* Horizontal Alignment indicator */}
              {activeCellStyle.horizontalAlign && (
                <div className="flex items-center text-slate-500 border-l border-slate-200 pl-1" title={`Alignment: ${activeCellStyle.horizontalAlign}`}>
                  {activeCellStyle.horizontalAlign === 'center' && <AlignCenter className="w-3.5 h-3.5 text-emerald-700" />}
                  {activeCellStyle.horizontalAlign === 'right' && <AlignRight className="w-3.5 h-3.5 text-emerald-700" />}
                  {activeCellStyle.horizontalAlign === 'left' && <AlignLeft className="w-3.5 h-3.5 text-emerald-700" />}
                </div>
              )}

              {/* Number Format tag */}
              {activeCellStyle.numFmt && activeCellStyle.numFmt !== 'General' && (
                <span
                  className="text-[9px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 max-w-[85px] truncate"
                  title={`Excel Number Format: ${activeCellStyle.numFmt}`}
                >
                  {activeCellStyle.numFmt}
                </span>
              )}

              {(activeCellStyle.color || activeCellStyle.backgroundColor) && (
                <div className="flex items-center gap-1 border-l border-slate-200 pl-1">
                  {activeCellStyle.color && (
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                      style={{ backgroundColor: activeCellStyle.color }}
                      title={`Text Color: ${activeCellStyle.color}`}
                    />
                  )}
                  {activeCellStyle.backgroundColor && (
                    <span
                      className="w-3.5 h-3.5 rounded border border-slate-300 shadow-2xs shrink-0"
                      style={{ backgroundColor: activeCellStyle.backgroundColor }}
                      title={`Cell Fill: ${activeCellStyle.backgroundColor}`}
                    />
                  )}
                </div>
              )}

              {activeCellStyle.borders && (
                <span
                  className="text-[9px] uppercase tracking-wider text-slate-600 font-mono px-1 py-0.5 border border-slate-200 rounded bg-white shadow-2xs"
                  title="Cell borders preserved from Excel"
                >
                  border
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Text Highlight in Sheet & View Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {onToggleGridLines && (
            <button
              onClick={onToggleGridLines}
              className={`h-8 px-2 rounded border flex items-center gap-1 text-[11px] transition-colors cursor-pointer ${
                showGridLines
                  ? 'bg-slate-100 border-slate-300 text-slate-800 font-medium'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
              }`}
              title="Toggle Excel Gridlines"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Gridlines</span>
            </button>
          )}

          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              id="input-text-highlight"
              type="text"
              value={textHighlight.query}
              onChange={(e) => onTextHighlightChange({ query: e.target.value })}
              placeholder="Highlight text in sheet..."
              className="h-8 pl-8 pr-16 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-emerald-500 w-52 md:w-64 transition-all"
            />
            {textHighlight.query && (
              <button
                onClick={() => onTextHighlightChange({ query: '' })}
                className="absolute right-8 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear highlight text"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            {/* Match counter badge inside/beside input */}
            <span className="absolute right-2 text-[10px] font-mono text-slate-400 select-none">
              {textHighlight.query.trim()
                ? textHighlight.totalMatches > 0
                  ? `${textHighlight.currentMatchIndex + 1}/${textHighlight.totalMatches}`
                  : '0'
                : ''}
            </span>
          </div>

          {/* Previous / Next Match Buttons */}
          <div className="inline-flex rounded border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
            <button
              id="btn-prev-match"
              onClick={() => onNavigateMatch('prev')}
              disabled={textHighlight.totalMatches === 0}
              className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-200 transition-colors cursor-pointer"
              title="Previous match in sheet"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-next-match"
              onClick={() => onNavigateMatch('next')}
              disabled={textHighlight.totalMatches === 0}
              className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-200 transition-colors cursor-pointer"
              title="Next match in sheet"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Case sensitivity toggle */}
          <button
            id="btn-toggle-case-sensitive"
            onClick={() => onTextHighlightChange({ caseSensitive: !textHighlight.caseSensitive })}
            className={`h-8 px-2 rounded border flex items-center gap-1 transition-colors cursor-pointer ${
              textHighlight.caseSensitive
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle Case Sensitivity (Aa)"
          >
            <CaseSensitive className="w-3.5 h-3.5" />
            <span className="text-[11px]">Match Case</span>
          </button>

          {/* Highlight color picker */}
          <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
            <Highlighter className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-1">
              {HIGHLIGHT_COLORS.map((col) => (
                <button
                  key={col.id}
                  onClick={() => onTextHighlightChange({ color: col.id })}
                  className={`w-4 h-4 rounded-full ${col.bgClass} transition-transform ${
                    textHighlight.color === col.id ? `ring-2 ${col.ringClass} scale-110` : 'opacity-70 hover:opacity-100'
                  }`}
                  title={`Highlight in ${col.label}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Middle row: Row Highlight Controls & Filter status */}
      <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Row Highlight Info & Controls */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 text-xs">
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
              Row Highlighting:
            </span>

            {highlightedRowCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                {highlightedRowCount} {highlightedRowCount === 1 ? 'row' : 'rows'} highlighted
              </span>
            ) : (
              <span className="text-slate-400 text-xs italic">
                Click any row number (1, 2...) to highlight
              </span>
            )}
          </div>

          {highlightedRowCount > 0 && (
            <>
              {/* Toggle: Only show highlighted rows */}
              <button
                id="btn-filter-highlighted-rows"
                onClick={() =>
                  onRowHighlightChange({
                    showOnlyHighlighted: !rowHighlight.showOnlyHighlighted,
                  })
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border ${
                  rowHighlight.showOnlyHighlighted
                    ? 'bg-amber-600 border-amber-700 text-white font-medium shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
                title="Filter table to only show highlighted rows"
              >
                <Eye className="w-3 h-3" />
                <span>{rowHighlight.showOnlyHighlighted ? 'Showing Only Highlighted' : 'Show Only Highlighted'}</span>
              </button>

              {/* Row highlight color selector */}
              <div className="flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 font-medium mr-1">Row Tint:</span>
                {HIGHLIGHT_COLORS.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => onRowHighlightChange({ color: col.id })}
                    className={`w-3.5 h-3.5 rounded-full ${col.bgClass} transition-transform ${
                      rowHighlight.color === col.id ? `ring-2 ${col.ringClass} scale-110` : 'opacity-60 hover:opacity-100'
                    }`}
                    title={`Row color: ${col.label}`}
                  />
                ))}
              </div>

              {/* Clear row highlights */}
              <button
                id="btn-clear-row-highlights"
                onClick={onClearRowHighlights}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Clear all highlighted rows in this sheet"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear Rows</span>
              </button>
            </>
          )}
        </div>

        {/* Active Filters list / Summary */}
        <div className="flex items-center gap-2 flex-wrap">
          {filters.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-emerald-600" />
                Active Filters ({filters.length}):
              </span>
              {filters.map((f) => (
                <span
                  key={f.colIndex}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]"
                >
                  <span className="font-semibold">{f.colName}</span>
                  <span className="text-emerald-600 font-mono text-[10px]">
                    {f.operator.replace('_', ' ')}
                  </span>
                  <span className="max-w-[80px] truncate font-medium text-emerald-950">
                    "{f.value || (f.selectedValues ? `${f.selectedValues.size} items` : '')}"
                  </span>
                  <button
                    onClick={() => onRemoveFilter(f.colIndex)}
                    className="hover:bg-emerald-200 rounded p-0.5 text-emerald-700"
                    title="Remove filter"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              <button
                id="btn-clear-all-filters"
                onClick={onClearAllFilters}
                className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 font-medium px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors"
              >
                <FilterX className="w-3 h-3" />
                Clear All
              </button>
            </div>
          ) : (
            <span className="text-slate-400 text-[11px] italic">
              Click the filter icon in any column header to filter data
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
