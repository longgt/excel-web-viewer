import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Filter,
  ArrowDownAZ,
  ArrowUpAZ,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import {
  CellValue,
  CellPosition,
  ColumnFilter,
  RowHighlightConfig,
  TextHighlightConfig,
  CellStyle,
} from '../types';
import { getColumnLetter } from '../utils/excelParser';
import { cellStyleToCss } from '../utils/styleParser';
import { renderHighlightedText, checkCellMatch } from '../utils/textHighlighter';
import { FilterResultItem } from '../utils/filterEvaluator';

interface SpreadsheetGridProps {
  headers: string[];
  headerStyles?: (CellStyle | null)[];
  cellStyles?: (CellStyle | null)[][];
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
  columnWidths?: number[];
  rowHeights?: (number | undefined)[];
  showGridLines?: boolean;
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  headers,
  headerStyles,
  cellStyles,
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
  columnWidths,
  rowHeights,
  showGridLines = true,
}) => {
  // Local state for column widths to support Excel-like interactive dragging/resizing
  const [colWidths, setColWidths] = useState<number[]>(() => {
    if (columnWidths && columnWidths.length >= headers.length) {
      return [...columnWidths.slice(0, headers.length)];
    }
    return headers.map(() => 140);
  });

  // Sync colWidths when sheet or headers change
  useEffect(() => {
    if (columnWidths && columnWidths.length >= headers.length) {
      setColWidths([...columnWidths.slice(0, headers.length)]);
    } else {
      setColWidths(headers.map(() => 140));
    }
  }, [headers, columnWidths]);

  // Column resizing state
  const [resizingCol, setResizingCol] = useState<{
    colIdx: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  const handleStartResize = (e: React.MouseEvent, colIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCol({
      colIdx,
      startX: e.clientX,
      startWidth: colWidths[colIdx] || 140,
    });
  };

  useEffect(() => {
    if (!resizingCol) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizingCol.startX;
      const newWidth = Math.max(60, Math.min(800, resizingCol.startWidth + deltaX));
      setColWidths((prev) => {
        const next = [...prev];
        next[resizingCol.colIdx] = newWidth;
        return next;
      });
    };

    const handleMouseUp = () => {
      setResizingCol(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol]);

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

  // TanStack Virtual row virtualizer with row height support
  const rowVirtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = filteredItems[index];
      const h = item ? rowHeights?.[item.originalIndex] : undefined;
      return typeof h === 'number' && h > 0 ? Math.max(24, h) : 28;
    },
    overscan: 14,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  // Find index in filteredItems when activeCell changes
  const activeDisplayIndex = useMemo(() => {
    if (!activeCell) return -1;
    return filteredItems.findIndex(
      (item) => item.originalIndex === activeCell.rawRowIndex
    );
  }, [activeCell, filteredItems]);

  // Automatically scroll active cell into view
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

  // Excel-like Keyboard Navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!activeCell || filteredItems.length === 0) return;

      let nextDisplayIndex = activeDisplayIndex >= 0 ? activeDisplayIndex : 0;
      let nextCol = activeCell.colIndex;

      if (e.key === 'ArrowDown' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        if (nextDisplayIndex < filteredItems.length - 1) {
          nextDisplayIndex += 1;
        }
      } else if (e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey)) {
        e.preventDefault();
        if (nextDisplayIndex > 0) {
          nextDisplayIndex -= 1;
        }
      } else if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        if (nextCol < headers.length - 1) {
          nextCol += 1;
        }
      } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        if (nextCol > 0) {
          nextCol -= 1;
        }
      } else {
        return;
      }

      const item = filteredItems[nextDisplayIndex];
      if (!item) return;

      const rawRowIndex = item.originalIndex;
      const cellVal = item.row[nextCol];
      const displayString = cellVal === null || cellVal === undefined ? '' : String(cellVal);
      const cellAddress = `${getColumnLetter(nextCol)}${rawRowIndex + 1}`;

      onSelectCell(
        {
          rowIndex: nextDisplayIndex,
          colIndex: nextCol,
          rawRowIndex,
          cellAddress,
        },
        displayString
      );
    },
    [activeCell, activeDisplayIndex, filteredItems, headers.length, onSelectCell]
  );

  return (
    <div
      className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden relative select-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      {/* Table viewport with native horizontal/vertical scroll managed by TanStack Virtual */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto bg-[#f8fafc] relative"
        style={{
          fontFamily: 'Calibri, Aptos, "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
        }}
      >
        <table
          className={`border-separate border-spacing-0 text-[11px] min-w-full ${
            showGridLines ? 'border-slate-300' : 'border-transparent'
          }`}
          style={{ tableLayout: 'fixed' }}
        >
          {/* Defined column widths for Excel-accurate alignment */}
          <colgroup>
            <col style={{ width: 46, minWidth: 46, maxWidth: 46 }} />
            {headers.map((_, colIdx) => {
              const w = colWidths[colIdx] || 140;
              return <col key={`col-w-${colIdx}`} style={{ width: `${w}px`, minWidth: `${w}px` }} />;
            })}
          </colgroup>

          {/* Header Rows */}
          <thead className="sticky top-0 z-20 shadow-xs bg-[#f3f4f6]">
            {/* Top row: Column Letters (A, B, C...) with Excel Column Resize Handle */}
            <tr>
              {/* Corner Select-All Button */}
              <th className="sticky left-0 z-30 w-[46px] min-w-[46px] max-w-[46px] bg-[#e2e8f0] border-b border-r border-[#cbd5e1] p-0 text-center select-none">
                <div className="w-full h-full flex items-center justify-center p-1">
                  <div className="w-2.5 h-2.5 bg-slate-400/50 clip-triangle" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }} />
                </div>
              </th>

              {headers.map((_, colIdx) => {
                const isActiveCol = activeCell?.colIndex === colIdx;
                const colLetter = getColumnLetter(colIdx);
                const w = colWidths[colIdx] || 140;

                return (
                  <th
                    key={`col-letter-${colIdx}`}
                    style={{ width: `${w}px` }}
                    className={`relative border-b border-r border-[#cbd5e1] px-1 py-1 text-center font-mono text-[10px] select-none transition-colors ${
                      isActiveCol
                        ? 'bg-[#107c41]/15 text-[#107c41] font-bold border-b-2 border-b-[#107c41]'
                        : 'bg-[#f1f5f9] text-slate-500 font-medium hover:bg-slate-200/80'
                    }`}
                  >
                    <span>{colLetter}</span>

                    {/* Column Resizer Handle */}
                    <div
                      onMouseDown={(e) => handleStartResize(e, colIdx)}
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-500/40 z-10"
                      title="Drag to resize column"
                    />
                  </th>
                );
              })}
            </tr>

            {/* Bottom header row: Column Names + Filter Controls */}
            <tr>
              {/* Top-left row header marker */}
              <th className="sticky left-0 z-30 w-[46px] min-w-[46px] max-w-[46px] bg-[#f1f5f9] border-b border-r border-[#cbd5e1] px-1 py-1.5 text-center text-[10px] text-slate-400 font-mono font-medium select-none shadow-xs">
                #
              </th>

              {headers.map((headerText, colIdx) => {
                const isFiltered = activeFiltersMap.has(colIdx);
                const isSorted = sortState?.colIndex === colIdx;
                const headerStyle = headerStyles?.[colIdx];
                const headerCss = cellStyleToCss(headerStyle);
                const w = colWidths[colIdx] || 140;

                return (
                  <th
                    key={`header-${colIdx}`}
                    style={{ ...headerCss, width: `${w}px` }}
                    className={`border-b border-r border-[#cbd5e1] px-2.5 py-1.5 text-left font-semibold select-none group transition-colors relative ${
                      isFiltered
                        ? 'bg-emerald-50 text-emerald-900'
                        : !headerStyle?.backgroundColor
                        ? 'bg-[#f8fafc]'
                        : ''
                    } ${!headerStyle?.color ? 'text-slate-800' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate font-semibold text-[11px] tracking-tight" title={headerText}>
                        {headerText}
                      </span>

                      <div className="flex items-center gap-0.5 shrink-0">
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
                          className={`p-0.5 rounded transition-colors cursor-pointer ${
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

                    {/* Column Resizer Handle */}
                    <div
                      onMouseDown={(e) => handleStartResize(e, colIdx)}
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-500/40 z-10"
                    />
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body - Virtualized using TanStack Virtual */}
          <tbody className="bg-white">
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
                  const isActiveRow = activeCell?.rawRowIndex === rawRowIndex;
                  const highlightClass = getRowHighlightClass(rawRowIndex);

                  const customHeight = rowHeights?.[rawRowIndex];
                  const rowStyleProp =
                    typeof customHeight === 'number' && customHeight > 0
                      ? { height: `${customHeight}px` }
                      : {};

                  return (
                    <tr
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      style={rowStyleProp}
                      className={`group hover:bg-slate-50/80 transition-colors ${highlightClass}`}
                    >
                      {/* Row Header Cell - Clickable to toggle Row Highlight */}
                      <td
                        onClick={() => onToggleRowHighlight(rawRowIndex)}
                        className={`sticky left-0 z-10 w-[46px] min-w-[46px] max-w-[46px] border-r border-b text-center font-mono text-[10px] select-none cursor-pointer transition-colors ${
                          showGridLines ? 'border-[#e2e8f0]' : 'border-transparent'
                        } ${
                          isActiveRow
                            ? 'bg-[#107c41]/15 text-[#107c41] font-bold border-r-2 border-r-[#107c41]'
                            : isRowHighlighted
                            ? 'bg-amber-200/90 text-amber-950 font-bold border-r-amber-400'
                            : 'bg-[#f8fafc] text-slate-500 hover:bg-amber-100 hover:text-amber-900 group-hover:bg-slate-200'
                        }`}
                        title="Click to highlight / unhighlight this entire row"
                      >
                        <div className="flex items-center justify-center gap-0.5 py-1 px-1">
                          {isRowHighlighted ? (
                            <BookmarkCheck className="w-3 h-3 text-amber-700 fill-amber-300 shrink-0" />
                          ) : (
                            <Bookmark className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-60 shrink-0" />
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

                        // Extract cell formatting
                        const cellStyle = item.styles?.[colIdx] ?? cellStyles?.[rawRowIndex]?.[colIdx];
                        const cellCss = cellStyleToCss(cellStyle, { isRowHighlighted, isSelected, value: cellVal });
                        const w = colWidths[colIdx] || 140;

                        return (
                          <td
                            key={`cell-${rawRowIndex}-${colIdx}`}
                            style={{
                              ...cellCss,
                              width: `${w}px`,
                              borderColor: showGridLines ? undefined : 'transparent',
                            }}
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
                            className={`border-r border-b px-2.5 py-1 text-[11px] transition-colors cursor-cell truncate relative select-text ${
                              showGridLines ? 'border-[#e2e8f0]' : 'border-transparent'
                            } ${
                              isSelected
                                ? 'outline-2 outline-[#107c41] -outline-offset-2 z-10 font-medium'
                                : hasSearchMatch && textHighlight.query.trim()
                                ? 'bg-amber-100/80'
                                : ''
                            } ${!cellStyle?.color ? 'text-slate-800' : ''}`}
                            title={displayString}
                          >
                            <span className="block truncate">
                              {renderHighlightedText(
                                displayString,
                                textHighlight.query,
                                textHighlight.caseSensitive,
                                textHighlight.exactMatch,
                                textHighlight.color
                              )}
                            </span>

                            {/* Excel Fill Handle Square on active cell */}
                            {isSelected && (
                              <div
                                className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#107c41] border border-white z-20 cursor-crosshair"
                                title="Auto-fill handle"
                              />
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
      <footer className="bg-[#f8fafc] border-t border-[#cbd5e1] px-4 py-1.5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600 select-none shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-700">
            Showing {filteredItems.length} of {totalRawRows} rows
          </span>

          <span className="inline-flex items-center gap-1.5 text-[10px] text-[#107c41] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#107c41] shrink-0"></span>
            <span>Viewport: {virtualRows.length} rendered</span>
          </span>

          {rowHighlight.highlightedRowKeys.size > 0 && (
            <span className="flex items-center gap-1 font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              <BookmarkCheck className="w-3 h-3 text-amber-600" />
              {rowHighlight.highlightedRowKeys.size} highlighted
            </span>
          )}

          <span className="text-slate-300">|</span>
          <span className="text-slate-400 italic hidden sm:inline text-[10px]">
            Drag column edges to resize • Arrow keys or Tab/Enter to navigate cells
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
