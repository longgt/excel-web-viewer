import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  WorkbookData,
  CellPosition,
  ColumnFilter,
  RowHighlightConfig,
  TextHighlightConfig,
  CellValue,
} from './types';
import { SAMPLE_WORKBOOK_SALES } from './data/sampleData';
import { parseExcelInBackground, validateFileSize } from './utils/backgroundParser';
import { applyFilters, FilterResultItem } from './utils/filterEvaluator';
import { checkCellMatch } from './utils/textHighlighter';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { SpreadsheetGrid } from './components/SpreadsheetGrid';
import { SpreadsheetSkeleton } from './components/SpreadsheetSkeleton';
import { SheetTabs } from './components/SheetTabs';
import { ExportModal } from './components/ExportModal';
import { ColumnFilterModal } from './components/ColumnFilterModal';
import { DropZoneOverlay } from './components/DropZoneOverlay';
import { AlertCircle } from 'lucide-react';

export default function App() {
  // Workbook state
  const [workbook, setWorkbook] = useState<WorkbookData>(SAMPLE_WORKBOOK_SALES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingFileInfo, setProcessingFileInfo] = useState<{
    name: string;
    size: number;
    stage: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active cell inspection state
  const [activeCell, setActiveCell] = useState<CellPosition | null>(null);
  const [activeCellValue, setActiveCellValue] = useState<string>('');

  // Text highlight in sheet state
  const [textHighlight, setTextHighlight] = useState<TextHighlightConfig>({
    query: '',
    caseSensitive: false,
    exactMatch: false,
    color: 'amber',
    currentMatchIndex: 0,
    totalMatches: 0,
  });

  // Row highlight state - stored per sheet name to preserve highlights across tabs
  const [sheetRowHighlights, setSheetRowHighlights] = useState<Record<string, Set<number>>>({
    'Orders & Revenue': new Set([0, 2, 6]), // Pre-highlighted sample rows for instant visual clarity
  });
  const [rowHighlightColor, setRowHighlightColor] = useState<
    'amber' | 'emerald' | 'sky' | 'rose' | 'violet'
  >('amber');
  const [showOnlyHighlighted, setShowOnlyHighlighted] = useState<boolean>(false);

  // Filters state per sheet
  const [sheetFilters, setSheetFilters] = useState<Record<string, ColumnFilter[]>>({});

  // Sorting state
  const [sortState, setSortState] = useState<{
    colIndex: number;
    direction: 'asc' | 'desc';
  } | null>(null);

  // UI Modals state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [filterModalCol, setFilterModalCol] = useState<number | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Current active sheet
  const activeSheet = workbook.sheets[workbook.activeSheetName] || {
    name: '',
    data: [],
    headers: [],
    rawRows: [],
    rowCount: 0,
    colCount: 0,
  };

  // Current active sheet's highlighted rows
  const activeHighlightedRows = useMemo(() => {
    return sheetRowHighlights[workbook.activeSheetName] || new Set<number>();
  }, [sheetRowHighlights, workbook.activeSheetName]);

  // Current active sheet's filters
  const activeFilters = useMemo(() => {
    return sheetFilters[workbook.activeSheetName] || [];
  }, [sheetFilters, workbook.activeSheetName]);

  // Composite row highlight config object
  const rowHighlightConfig: RowHighlightConfig = useMemo(
    () => ({
      highlightedRowKeys: activeHighlightedRows,
      color: rowHighlightColor,
      showOnlyHighlighted,
    }),
    [activeHighlightedRows, rowHighlightColor, showOnlyHighlighted]
  );

  // Calculate total text matches in current sheet whenever query or sheet changes
  const allMatchPositions = useMemo(() => {
    if (!textHighlight.query.trim() || !activeSheet.data) return [];

    const matches: Array<{ rawRow: number; col: number }> = [];
    activeSheet.data.forEach((row, rawRowIdx) => {
      row.forEach((cellVal, colIdx) => {
        const str = cellVal === null || cellVal === undefined ? '' : String(cellVal);
        if (
          checkCellMatch(
            str,
            textHighlight.query,
            textHighlight.caseSensitive,
            textHighlight.exactMatch
          )
        ) {
          matches.push({ rawRow: rawRowIdx, col: colIdx });
        }
      });
    });
    return matches;
  }, [
    activeSheet.data,
    textHighlight.query,
    textHighlight.caseSensitive,
    textHighlight.exactMatch,
  ]);

  // Update total matches count
  useEffect(() => {
    setTextHighlight((prev) => ({
      ...prev,
      totalMatches: allMatchPositions.length,
      currentMatchIndex:
        allMatchPositions.length > 0
          ? Math.min(prev.currentMatchIndex, allMatchPositions.length - 1)
          : 0,
    }));
  }, [allMatchPositions.length]);

  // Navigate through text matches in sheet
  const handleNavigateMatch = useCallback(
    (direction: 'next' | 'prev') => {
      if (allMatchPositions.length === 0) return;

      setTextHighlight((prev) => {
        let nextIdx =
          direction === 'next'
            ? (prev.currentMatchIndex + 1) % allMatchPositions.length
            : (prev.currentMatchIndex - 1 + allMatchPositions.length) %
              allMatchPositions.length;

        const target = allMatchPositions[nextIdx];
        if (target) {
          const val = activeSheet.data[target.rawRow]?.[target.col];
          setActiveCell({
            rowIndex: target.rawRow,
            colIndex: target.col,
            rawRowIndex: target.rawRow,
            cellAddress: `${String.fromCharCode(65 + (target.col % 26))}${target.rawRow + 1}`,
          });
          setActiveCellValue(val === null || val === undefined ? '' : String(val));
        }
        return { ...prev, currentMatchIndex: nextIdx };
      });
    },
    [allMatchPositions, activeSheet.data]
  );

  // Filtered and sorted rows calculation
  const filteredResultItems = useMemo(() => {
    // 1. Filter rows
    let result = applyFilters(
      activeSheet.data,
      activeFilters,
      activeHighlightedRows,
      showOnlyHighlighted,
      activeSheet.cellStyles
    );

    // 2. Sort rows if active
    if (sortState !== null) {
      const { colIndex, direction } = sortState;
      result = [...result].sort((a, b) => {
        const valA = a.row[colIndex];
        const valB = b.row[colIndex];

        const strA = valA === null || valA === undefined ? '' : String(valA).trim();
        const strB = valB === null || valB === undefined ? '' : String(valB).trim();

        const numA = parseFloat(strA.replace(/[^0-9.-]+/g, ''));
        const numB = parseFloat(strB.replace(/[^0-9.-]+/g, ''));

        let cmp = 0;
        if (!isNaN(numA) && !isNaN(numB) && strA.match(/\d/) && strB.match(/\d/)) {
          cmp = numA - numB;
        } else {
          cmp = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
        }

        return direction === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [
    activeSheet.data,
    activeSheet.cellStyles,
    activeFilters,
    activeHighlightedRows,
    showOnlyHighlighted,
    sortState,
  ]);

  // Active cell style lookup
  const activeCellStyle = useMemo(() => {
    if (!activeCell) return null;
    return activeSheet.cellStyles?.[activeCell.rawRowIndex]?.[activeCell.colIndex] || null;
  }, [activeCell, activeSheet.cellStyles]);

  // Filtered rows for export
  const filteredRowsOnly = useMemo(() => {
    return filteredResultItems.map((item) => item.row);
  }, [filteredResultItems]);

  // Highlighted rows for export
  const highlightedRowsOnly = useMemo(() => {
    return activeSheet.data.filter((_, idx) => activeHighlightedRows.has(idx));
  }, [activeSheet.data, activeHighlightedRows]);

  // Handle Sheet selection
  const handleSelectSheet = (sheetName: string) => {
    setWorkbook((prev) => ({ ...prev, activeSheetName: sheetName }));
    setActiveCell(null);
    setActiveCellValue('');
    setSortState(null);
  };

  // Handle Toggle Row Highlight
  const handleToggleRowHighlight = (rawRowIndex: number) => {
    setSheetRowHighlights((prev) => {
      const currentSet = new Set(prev[workbook.activeSheetName] || []);
      if (currentSet.has(rawRowIndex)) {
        currentSet.delete(rawRowIndex);
      } else {
        currentSet.add(rawRowIndex);
      }
      return {
        ...prev,
        [workbook.activeSheetName]: currentSet,
      };
    });
  };

  // Clear all row highlights in current sheet
  const handleClearRowHighlights = () => {
    setSheetRowHighlights((prev) => ({
      ...prev,
      [workbook.activeSheetName]: new Set(),
    }));
    setShowOnlyHighlighted(false);
  };

  // Handle Apply Column Filter
  const handleApplyColumnFilter = (filter: ColumnFilter) => {
    setSheetFilters((prev) => {
      const currentList = prev[workbook.activeSheetName] || [];
      const updated = currentList.filter((f) => f.colIndex !== filter.colIndex);
      return {
        ...prev,
        [workbook.activeSheetName]: [...updated, filter],
      };
    });
  };

  // Handle Remove single filter
  const handleRemoveFilter = (colIndex: number) => {
    setSheetFilters((prev) => {
      const currentList = prev[workbook.activeSheetName] || [];
      return {
        ...prev,
        [workbook.activeSheetName]: currentList.filter((f) => f.colIndex !== colIndex),
      };
    });
  };

  // Clear all filters in current sheet
  const handleClearAllFilters = () => {
    setSheetFilters((prev) => ({
      ...prev,
      [workbook.activeSheetName]: [],
    }));
    setSortState(null);
    setShowOnlyHighlighted(false);
  };

  // Column Sort
  const handleSortColumn = (colIndex: number, direction: 'asc' | 'desc') => {
    setSortState({ colIndex, direction });
  };

  // File Upload processor with 10MB cap check and background Web Worker execution
  const processUploadedFile = async (file: File) => {
    // 1. Enforce strict 10MB file limit
    const validation = validateFileSize(file.size);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'File size exceeds maximum 10MB limit.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setProcessingFileInfo({
      name: file.name,
      size: file.size,
      stage: 'Reading file buffer and transferring to Web Worker...',
    });

    try {
      const buffer = await file.arrayBuffer();

      setProcessingFileInfo((prev) =>
        prev
          ? {
              ...prev,
              stage: 'Parsing sheets and formulas in background thread without blocking UI...',
            }
          : null
      );

      const parsedWorkbook = await parseExcelInBackground(buffer, file.name, file.size);

      if (parsedWorkbook.sheetNames.length === 0) {
        throw new Error('No readable sheets found in this Excel file.');
      }

      setWorkbook(parsedWorkbook);
      setActiveCell(null);
      setActiveCellValue('');
      setSheetFilters({});
      setSheetRowHighlights({});
      setSortState(null);
      setShowOnlyHighlighted(false);
      setTextHighlight((prev) => ({
        ...prev,
        query: '',
        currentMatchIndex: 0,
        totalMatches: 0,
      }));
    } catch (err: any) {
      console.error('Excel background parsing error:', err);
      setErrorMessage(
        err?.message ||
          'Could not parse the Excel file. Please ensure it is a valid .xlsx, .xls, or .csv document.'
      );
    } finally {
      setIsLoading(false);
      setProcessingFileInfo(null);
    }
  };

  // Drag and drop listeners on window
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDraggingFile(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsDraggingFile(false);
        dragCounter = 0;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDraggingFile(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const droppedFile = e.dataTransfer.files[0];
        processUploadedFile(droppedFile);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 overflow-hidden font-sans select-none">
      {/* Drag & Drop Visual Overlay */}
      <DropZoneOverlay isDragging={isDraggingFile} />

      {/* Top Application Header */}
      <Header
        workbook={workbook}
        onFileUpload={processUploadedFile}
        onLoadSample={() => {
          setWorkbook(SAMPLE_WORKBOOK_SALES);
          setSheetRowHighlights({
            'Orders & Revenue': new Set([0, 2, 6]),
          });
          setSheetFilters({});
          setSortState(null);
          setShowOnlyHighlighted(false);
          setActiveCell(null);
          setActiveCellValue('');
        }}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        isFiltered={activeFilters.length > 0 || showOnlyHighlighted}
        highlightedRowCount={activeHighlightedRows.size}
        isLoading={isLoading}
      />

      {/* Error Banner if any file parsing fails */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 flex items-center justify-between text-xs text-rose-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold hover:underline text-rose-700 ml-4 shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Secondary Ribbon / Toolbar */}
      <Toolbar
        activeCell={activeCell}
        activeCellValue={activeCellValue}
        activeCellStyle={activeCellStyle}
        textHighlight={textHighlight}
        onTextHighlightChange={(patch) =>
          setTextHighlight((prev) => ({ ...prev, ...patch }))
        }
        onNavigateMatch={handleNavigateMatch}
        rowHighlight={rowHighlightConfig}
        onRowHighlightChange={(patch) => {
          if (patch.color) setRowHighlightColor(patch.color);
          if (patch.showOnlyHighlighted !== undefined)
            setShowOnlyHighlighted(patch.showOnlyHighlighted);
        }}
        onClearRowHighlights={handleClearRowHighlights}
        filters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleClearAllFilters}
      />

      {/* Main Spreadsheet Grid Container */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        {isLoading ? (
          <SpreadsheetSkeleton
            fileName={processingFileInfo?.name}
            fileSize={processingFileInfo?.size}
            stageMessage={processingFileInfo?.stage}
          />
        ) : (
          <SpreadsheetGrid
            headers={activeSheet.headers}
            headerStyles={activeSheet.headerStyles}
            cellStyles={activeSheet.cellStyles}
            filteredItems={filteredResultItems}
            totalRawRows={activeSheet.rowCount}
            activeCell={activeCell}
            onSelectCell={(cell, val) => {
              setActiveCell(cell);
              setActiveCellValue(val);
            }}
            textHighlight={textHighlight}
            rowHighlight={rowHighlightConfig}
            onToggleRowHighlight={handleToggleRowHighlight}
            filters={activeFilters}
            onOpenColumnFilter={(colIdx) => setFilterModalCol(colIdx)}
            sortState={sortState}
          />
        )}
      </main>

      {/* Bottom Excel Sheet Tabs Bar */}
      <SheetTabs
        sheetNames={workbook.sheetNames}
        activeSheetName={workbook.activeSheetName}
        sheets={workbook.sheets}
        onSelectSheet={handleSelectSheet}
      />

      {/* Column Filter & Sort Modal */}
      {filterModalCol !== null && (
        <ColumnFilterModal
          colIndex={filterModalCol}
          colName={activeSheet.headers[filterModalCol] || `Column ${filterModalCol + 1}`}
          rows={activeSheet.data}
          existingFilter={activeFilters.find((f) => f.colIndex === filterModalCol)}
          onApplyFilter={handleApplyColumnFilter}
          onClearFilter={handleRemoveFilter}
          onSortColumn={handleSortColumn}
          onClose={() => setFilterModalCol(null)}
        />
      )}

      {/* CSV Export Modal */}
      {isExportModalOpen && (
        <ExportModal
          sheetName={workbook.activeSheetName}
          originalFileName={workbook.fileName}
          allRows={activeSheet.data}
          filteredRows={filteredRowsOnly}
          highlightedRows={highlightedRowsOnly}
          headers={activeSheet.headers}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
}
