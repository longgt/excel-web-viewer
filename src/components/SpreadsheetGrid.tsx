import React, { useMemo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Filter,
  ArrowDownAZ,
  ArrowUpAZ,
  CheckCircle,
  Hash,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import {
  CellValue,
  CellPosition,
  ColumnFilter,
  RowHighlightConfig,
  TextHighlightConfig,
} from '../types';
import { getColumnLetter } from '../utils/excelParser';
import { renderHighlightedText, checkCellMatch } from '../utils/textHighlighter';
import { FilterResultItem } from '../utils/filterEvaluator';

interface SpreadsheetGridProps {
  headers: string[];
  filteredItems: FilterResultItem[];
  totalRawRows: number;
  activeCell: CellPosition | null;
  onSelectCell: (cell: CellPosition, value: string) => void;
  textHighlight: TextHighlightConfig;
  rowHighlight: RowHighlightConfig;
  onToggleRowHighlight: (rawRowIndex: number) => void;
  filters: ColumnFilter[];
  onOpenColumnFilter: (colIndex: number) => void;
  sortState: { colIndex: number; direction: 'asc' | 'desc' } | null;
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  headers,
  filteredItems,
  totalRawRows,
  activeCell,
  onSelectCell,
  textHighlight,
  rowHighlight,
  onToggleRowHighlight,
  filters,
  onOpenColumnFilter,
  sortState,
}) => {
  // Map of active filters by column index
  const activeFiltersMap = useMemo(() => {
    const map = new Map<number, ColumnFilter>();
    for (const f of filters) {
      map.set(f.colIndex, f);
    }
    return map;
  }, [filters]);

  // Determine row highlight background classes
  const getRowHighlightClass = (rawIndex: number) => {
    const isHighlighted = rowHighlight.highlightedRowKeys.has(rawIndex);
    if (!isHighlighted) return '';

    switch (rowHighlight.color) {
      case 'emerald':
        return 'bg-emerald-50/90 border-l-4 border-l-emerald-500 font-medium text-emerald-950';
      case 'sky':
        return 'bg-sky-50/90 border-l-4 border-l-sky-500 font-medium text-sky-950';
      case 'rose':
        return 'bg-rose-50/90 border-l-4 border-l-rose-500 font-medium text-rose-950';
      case 'violet':
        return 'bg-violet-50/90 border-l-4 border-l-violet-500 font-medium text-violet-950';
      case 'amber':
      default:
        return 'bg-amber-50/90 border-l-4 border-l-amber-500 font-medium text-amber-950';
    }
  };

  // Quick statistics calculation for visible rows
  const statistics = useMemo(() => {
    let sum = 0;
    let numericCount = 0;
    let min = Infinity;
    let max = -Infinity;

    for (const item of filteredItems) {
      for (const val of item.row) {
        if (typeof val === 'number') {
          sum += val;
          numericCount++;
          if (val < min) min = val;
          if (val > max) max = val;
        } else if (typeof val === 'string' && val.trim() !== '') {
          const parsed = Number(val.replace(/[^0-9.-]+/g, ''));
          if (!isNaN(parsed) && val.match(/\d/)) {
            sum += parsed;
            numericCount++;
            if (parsed < min) min = parsed;
            if (parsed > max) max = parsed;
          }
        }
      }
    }

    return {
      numericCount,
      sum,
      average: numericCount > 0 ? sum / numericCount : 0,
      min: numericCount > 0 ? min : 0,
      max: numericCount > 0 ? max : 0,
    };
  }, [filteredItems]);

  // Viewport scroll container ref for TanStack Virtual
  const parentRef = useRef<HTMLDivElement>(null);

  // TanStack Virtual row virtualizer
  const rowVirtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 33, // Default row height (padding + border + text ~ 33px)
    overscan: 12, // Pre-render 12 rows above and below viewport for silky smooth scrolling
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  // Find index in filteredItems when activeCell changes (e.g. from search navigation)
  const activeDisplayIndex = useMemo(() => {
    if (!activeCell) return -1;
    return filteredItems.findIndex(
      (item) => item.originalIndex === activeCell.rawRowIndex
    );
  }, [activeCell, filteredItems]);

  // Automatically scroll active cell into view when navigated via search or selection
  const prevActiveCellRef = useRef<CellPosition | null>(null);
  useEffect(() => {
    if (
      activeCell &&
      activeDisplayIndex >= 0 &&
      (prevActiveCellRef.current?.rawRowIndex !== activeCell.rawRowIndex ||
        prevActiveCellRef.current?.colIndex !== activeCell.colIndex)
    ) {
      rowVirtualizer.scrollToIndex(activeDisplayIndex, { align: 'auto' });
    }
    prevActiveCellRef.current = activeCell;
  }, [activeCell, activeDisplayIndex, rowVirtualizer]);

  // Reset scroll to top-left when sheet switches or headers change
  const prevHeadersRef = useRef(headers);
  useEffect(() => {
    if (prevHeadersRef.current !== headers) {
      prevHeadersRef.current = headers;
      if (parentRef.current) {
        parentRef.current.scrollTop = 0;
        parentRef.current.scrollLeft = 0;
      }
    }
  }, [headers]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden relative">
      {/* Table viewport with native horizontal/vertical scroll managed by TanStack Virtual */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto bg-slate-100/50 relative select-text"
      >
        <table className="w-full border-separate border-spacing-0 text-xs font-sans">
          {/* Header Row */}
          <thead className="sticky top-0 z-20 shadow-xs bg-slate-100">
            {/* Top row: Column Letters (A, B, C...) */}
            <tr>
              <th className="sticky left-0 z-30 w-14 min-w-[56px] max-w-[56px] bg-slate-200 border-b border-r border-slate-300 px-1 py-1 text-center font-mono text-[10px] text-slate-500 select-none">
                #
              </th>
              {headers.map((_, colIdx) => (
                <th
                  key={`col-letter-${colIdx}`}
                  className="bg-slate-200/90 border-b border-r border-slate-300 px-2 py-0.5 text-center font-mono text-[10px] text-slate-500 font-semibold select-none min-w-[120px]"
                >
                  {getColumnLetter(colIdx)}
                </th>
              ))}
            </tr>

            {/* Bottom header row: Column Names + Filter Controls */}
            <tr>
              {/* Top-left corner row selection cell */}
              <th className="sticky left-0 z-30 w-14 min-w-[56px] max-w-[56px] bg-slate-100 border-b border-r border-slate-300 px-1 py-2 text-center text-[10px] text-slate-500 font-mono font-medium select-none shadow-xs">
                <span className="text-[10px] text-slate-400">Row</span>
              </th>

              {headers.map((headerText, colIdx) => {
                const isFiltered = activeFiltersMap.has(colIdx);
                const isSorted = sortState?.colIndex === colIdx;

                return (
                  <th
                    key={`header-${colIdx}`}
                    className={`bg-slate-100 border-b border-r border-slate-300 px-3 py-2 text-left font-semibold text-slate-800 select-none min-w-[140px] group transition-colors hover:bg-slate-200/60 ${
                      isFiltered ? 'bg-emerald-50 text-emerald-900' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-semibold text-xs tracking-tight" title={headerText}>
                        {headerText}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        {isSorted && (
                          <span className="text-emerald-700 p-0.5 rounded bg-emerald-100">
                            {sortState.direction === 'asc' ? (
                              <ArrowDownAZ className="w-3 h-3" />
                            ) : (
                              <ArrowUpAZ className="w-3 h-3" />
                            )}
                          </span>
                        )}

                        <button
                          id={`btn-filter-col-${colIdx}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenColumnFilter(colIdx);
                          }}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            isFiltered
                              ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200 opacity-60 group-hover:opacity-100'
                          }`}
                          title={`Filter & sort column "${headerText}"`}
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body - Virtualized using TanStack Virtual */}
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length + 1}
                  className="py-16 text-center text-slate-400 bg-white"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No rows match the filter criteria</p>
                    <p className="text-xs text-slate-400">
                      Try adjusting or clearing your column filters
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {/* Virtual Top Spacer */}
                {paddingTop > 0 && (
                  <tr aria-hidden="true">
                    <td
                      colSpan={headers.length + 1}
                      style={{
                        height: `${paddingTop}px`,
                        padding: 0,
                        border: 0,
                        margin: 0,
                      }}
                    />
                  </tr>
                )}

                {/* Visible Viewport Rows */}
                {virtualRows.map((virtualRow) => {
                  const displayRowIndex = virtualRow.index;
                  const item = filteredItems[displayRowIndex];
                  if (!item) return null;

                  const rawRowIndex = item.originalIndex;
                  const isRowHighlighted = rowHighlight.highlightedRowKeys.has(rawRowIndex);
                  const highlightClass = getRowHighlightClass(rawRowIndex);

                  return (
                    <tr
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      className={`group hover:bg-slate-50/80 transition-colors ${highlightClass}`}
                    >
                      {/* Row Header Cell - Clickable to toggle Row Highlight */}
                      <td
                        onClick={() => onToggleRowHighlight(rawRowIndex)}
                        className={`sticky left-0 z-10 w-14 min-w-[56px] max-w-[56px] border-r border-b border-slate-300 text-center font-mono text-[11px] select-none cursor-pointer transition-colors ${
                          isRowHighlighted
                            ? 'bg-amber-200/90 text-amber-950 font-bold border-r-amber-400'
                            : 'bg-slate-100/90 text-slate-500 hover:bg-amber-100 hover:text-amber-900 group-hover:bg-slate-200'
                        }`}
                        title="Click to highlight / unhighlight this entire row"
                      >
                        <div className="flex items-center justify-center gap-1 py-1.5 px-1">
                          {isRowHighlighted ? (
                            <BookmarkCheck className="w-3.5 h-3.5 text-amber-700 fill-amber-300 shrink-0" />
                          ) : (
                            <Bookmark className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-60 shrink-0" />
                          )}
                          <span>{rawRowIndex + 1}</span>
                        </div>
                      </td>

                      {/* Data Cells */}
                      {headers.map((_, colIdx) => {
                        const cellVal = item.row[colIdx];
                        const displayString =
                          cellVal === null || cellVal === undefined ? '' : String(cellVal);

                        const isSelected =
                          activeCell?.rawRowIndex === rawRowIndex &&
                          activeCell?.colIndex === colIdx;

                        // Check if matches search highlight query
                        const hasSearchMatch = checkCellMatch(
                          displayString,
                          textHighlight.query,
                          textHighlight.caseSensitive,
                          textHighlight.exactMatch
                        );

                        const cellAddress = `${getColumnLetter(colIdx)}${rawRowIndex + 1}`;

                        return (
                          <td
                            key={`cell-${rawRowIndex}-${colIdx}`}
                            onClick={() =>
                              onSelectCell(
                                {
                                  rowIndex: displayRowIndex,
                                  colIndex: colIdx,
                                  rawRowIndex,
                                  cellAddress,
                                },
                                displayString
                              )
                            }
                            className={`border-r border-b border-slate-200 px-3 py-1.5 text-slate-800 text-xs transition-colors cursor-cell min-w-[140px] truncate max-w-sm ${
                              isSelected
                                ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-50/50 font-medium'
                                : hasSearchMatch && textHighlight.query.trim()
                                ? 'bg-amber-100/70'
                                : ''
                            }`}
                            title={displayString}
                          >
                            {renderHighlightedText(
                              displayString,
                              textHighlight.query,
                              textHighlight.caseSensitive,
                              textHighlight.exactMatch,
                              textHighlight.color
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Virtual Bottom Spacer */}
                {paddingBottom > 0 && (
                  <tr aria-hidden="true">
                    <td
                      colSpan={headers.length + 1}
                      style={{
                        height: `${paddingBottom}px`,
                        padding: 0,
                        border: 0,
                        margin: 0,
                      }}
                    />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet Status Bar */}
      <footer className="bg-slate-100 border-t border-slate-300 px-4 py-1.5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600 select-none shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-700">
            Showing {filteredItems.length} of {totalRawRows} rows
          </span>

          <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-800 bg-emerald-50/90 px-2 py-0.5 rounded border border-emerald-200 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
            <span>Viewport: {virtualRows.length} rendered</span>
          </span>

          {rowHighlight.highlightedRowKeys.size > 0 && (
            <span className="flex items-center gap-1 font-semibold text-amber-800 bg-amber-100 px-2 py-0.2 rounded-full">
              <BookmarkCheck className="w-3 h-3 text-amber-600" />
              {rowHighlight.highlightedRowKeys.size} highlighted
            </span>
          )}

          <span className="text-slate-400">|</span>
          <span className="text-slate-500 italic hidden sm:inline">
            Click any row # to toggle row highlight
          </span>
        </div>

        {/* Live Statistical Calculations */}
        {statistics.numericCount > 0 && (
          <div className="flex items-center gap-3 font-mono text-[10px] text-slate-600 bg-white px-2.5 py-0.5 rounded border border-slate-200 shadow-2xs">
            <span>
              <strong className="text-slate-800 font-sans">Count:</strong> {statistics.numericCount}
            </span>
            <span>•</span>
            <span>
              <strong className="text-slate-800 font-sans">Sum:</strong>{' '}
              {statistics.sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span>•</span>
            <span>
              <strong className="text-slate-800 font-sans">Average:</strong>{' '}
              {statistics.average.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span>•</span>
            <span>
              <strong className="text-slate-800 font-sans">Min:</strong>{' '}
              {statistics.min.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span>•</span>
            <span>
              <strong className="text-slate-800 font-sans">Max:</strong>{' '}
              {statistics.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </footer>
    </div>
  );
};
