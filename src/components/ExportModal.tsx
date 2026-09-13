import React, { useState, useMemo } from 'react';
import { Download, FileText, X, Check, Eye } from 'lucide-react';
import { CellValue } from '../types';
import { generateCsvString, downloadCsvFile } from '../utils/exportCsv';

interface ExportModalProps {
  sheetName: string;
  originalFileName: string;
  allRows: CellValue[][];
  filteredRows: CellValue[][];
  highlightedRows: CellValue[][];
  headers: string[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  sheetName,
  originalFileName,
  allRows,
  filteredRows,
  highlightedRows,
  headers,
  onClose,
}) => {
  const defaultBaseName = originalFileName.replace(/\.[^/.]+$/, '');
  const [fileName, setFileName] = useState<string>(
    `${defaultBaseName}_${sheetName.replace(/\s+/g, '_')}`
  );
  const [delimiter, setDelimiter] = useState<',' | ';' | '\t' | '|'>(',');
  const [scope, setScope] = useState<'filtered' | 'all' | 'highlighted'>(() => {
    if (highlightedRows.length > 0) return 'filtered';
    return 'filtered';
  });
  const [includeHeaders, setIncludeHeaders] = useState(true);

  // Target rows depending on scope
  const targetRows = useMemo(() => {
    if (scope === 'highlighted') return highlightedRows;
    if (scope === 'all') return allRows;
    return filteredRows;
  }, [scope, highlightedRows, allRows, filteredRows]);

  // Generate preview snippet (first 4 lines)
  const previewSnippet = useMemo(() => {
    const previewRows = targetRows.slice(0, 4);
    return generateCsvString(
      includeHeaders ? headers : null,
      previewRows,
      delimiter
    );
  }, [targetRows, includeHeaders, headers, delimiter]);

  const handleDownload = () => {
    const csvContent = generateCsvString(
      includeHeaders ? headers : null,
      targetRows,
      delimiter
    );
    downloadCsvFile(csvContent, fileName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Export Sheet as CSV</h2>
              <p className="text-xs text-slate-500">
                Sheet: <span className="font-semibold text-emerald-700">{sheetName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* File Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              File Name
            </label>
            <div className="flex items-center">
              <input
                id="input-export-filename"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="flex-1 h-9 px-3 bg-white border border-slate-300 rounded-l-md text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
              />
              <span className="h-9 px-3 bg-slate-100 border border-l-0 border-slate-300 rounded-r-md text-xs font-mono text-slate-500 flex items-center select-none">
                .csv
              </span>
            </div>
          </div>

          {/* Row Scope */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Rows to Export ({targetRows.length} rows selected)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`flex flex-col p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                  scope === 'filtered'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">Filtered View</span>
                  <input
                    type="radio"
                    name="export-scope"
                    checked={scope === 'filtered'}
                    onChange={() => setScope('filtered')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  {filteredRows.length} rows currently visible
                </span>
              </label>

              <label
                className={`flex flex-col p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                  scope === 'highlighted'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-600'
                    : highlightedRows.length === 0
                    ? 'border-slate-200 bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">Highlighted Only</span>
                  <input
                    type="radio"
                    name="export-scope"
                    disabled={highlightedRows.length === 0}
                    checked={scope === 'highlighted'}
                    onChange={() => setScope('highlighted')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  {highlightedRows.length} highlighted rows
                </span>
              </label>

              <label
                className={`flex flex-col p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                  scope === 'all'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">All Sheet Rows</span>
                  <input
                    type="radio"
                    name="export-scope"
                    checked={scope === 'all'}
                    onChange={() => setScope('all')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  {allRows.length} total data rows
                </span>
              </label>
            </div>
          </div>

          {/* Delimiter and Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Delimiter format
              </label>
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value as any)}
                className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value=",">Comma (, ) — Standard CSV</option>
                <option value=";">Semicolon (; ) — European CSV</option>
                <option value="&#9;">Tab (\t) — TSV</option>
                <option value="|">Pipe (| )</option>
              </select>
            </div>

            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 w-4 h-4"
                />
                <span className="font-medium">Include column headers row</span>
              </label>
            </div>
          </div>

          {/* Live Preview Snippet */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                Live Preview (First {Math.min(targetRows.length, 3)} rows):
              </span>
              <span className="text-[10px] text-slate-400 font-mono">RFC-4180 Escaped</span>
            </div>
            <pre className="p-3 bg-slate-900 text-emerald-300 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed max-h-32 border border-slate-800 shadow-inner">
              {previewSnippet || '(Empty output)'}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Exporting <strong className="text-slate-800">{targetRows.length}</strong> rows to CSV
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-export"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
