import React, { useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Sparkles,
  Layers,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { WorkbookData } from '../types';

interface HeaderProps {
  workbook: WorkbookData;
  onFileUpload: (file: File) => void;
  onLoadSample: () => void;
  onOpenExportModal: () => void;
  isFiltered: boolean;
  highlightedRowCount: number;
  isLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  workbook,
  onFileUpload,
  onLoadSample,
  onOpenExportModal,
  isFiltered,
  highlightedRowCount,
  isLoading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      // Reset input so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  const activeSheet = workbook.sheets[workbook.activeSheetName];
  const formattedFileSize =
    workbook.fileSize > 1024 * 1024
      ? `${(workbook.fileSize / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(workbook.fileSize / 1024)} KB`;

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-slate-900 truncate max-w-xs md:max-w-md">
              {workbook.fileName}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
              {formattedFileSize}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              {workbook.sheetNames.length} {workbook.sheetNames.length === 1 ? 'Sheet' : 'Sheets'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium text-slate-700">
              Active: {workbook.activeSheetName}
            </span>
            <span>•</span>
            <span>
              {activeSheet ? `${activeSheet.rowCount} rows × ${activeSheet.colCount} cols` : '0 rows'}
            </span>
          </div>
        </div>
      </div>

      {/* Right action buttons */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.tsv,.ods"
          className="hidden"
          onChange={handleFileChange}
          disabled={isLoading}
        />

        <button
          id="btn-upload-file"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          title="Upload an Excel (.xlsx, .xls) or CSV file (Max 10MB)"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span>Upload Excel / CSV</span>
          <span className="text-[10px] text-slate-400 font-normal">(&le;10MB)</span>
        </button>

        <button
          id="btn-load-sample"
          onClick={onLoadSample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          title="Reload the sample sales dataset with multiple sheets"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Sample Data</span>
        </button>

        <button
          id="btn-open-export"
          onClick={onOpenExportModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
          {highlightedRowCount > 0 && (
            <span className="ml-1 bg-emerald-800 text-emerald-100 text-[10px] px-1.5 py-0.2 rounded-full font-medium">
              {highlightedRowCount} selected
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
