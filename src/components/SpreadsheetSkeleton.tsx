import React from 'react';
import { FileSpreadsheet, Cpu, Sparkles } from 'lucide-react';
import { getColumnLetter } from '../utils/excelParser';

interface SpreadsheetSkeletonProps {
  fileName?: string;
  fileSize?: number;
  stageMessage?: string;
}

export const SpreadsheetSkeleton: React.FC<SpreadsheetSkeletonProps> = ({
  fileName,
  fileSize,
  stageMessage = 'Parsing workbook in background worker thread...',
}) => {
  const dummyCols = Array.from({ length: 9 }, (_, i) => i);
  const dummyRows = Array.from({ length: 14 }, (_, i) => i);

  // Pre-generated random-like width classes for realistic table cell skeleton bars
  const cellWidths = [
    'w-3/4',
    'w-1/2',
    'w-5/6',
    'w-2/3',
    'w-4/5',
    'w-3/5',
    'w-1/3',
    'w-2/3',
    'w-1/2',
  ];

  const formattedSize =
    fileSize && fileSize > 0
      ? fileSize > 1024 * 1024
        ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(fileSize / 1024)} KB`
      : '';

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden relative select-none">
      {/* Centered Modern Floating Processing Status Card */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-md">
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-emerald-200/80 p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm relative">
              <FileSpreadsheet className="w-5 h-5 animate-pulse" />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-slate-800 truncate">
                  {fileName ? fileName : 'Processing Workbook'}
                </h3>
                {formattedSize && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                    {formattedSize}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-emerald-700 font-medium">
                <Cpu className="w-3 h-3 text-emerald-600 animate-spin" />
                <span className="truncate">{stageMessage}</span>
              </div>
            </div>
          </div>

          {/* Smooth animated progress bar */}
          <div className="mt-3 w-full bg-emerald-100/60 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-600 h-1.5 rounded-full w-2/5 animate-[shimmer_1.5s_infinite_linear] bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500"></div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
              Main UI thread unblocked
            </span>
            <span>Max 10MB limit enforced</span>
          </div>
        </div>
      </div>

      {/* Realistic Table Skeleton Viewport */}
      <div className="flex-1 overflow-hidden relative opacity-75">
        <table className="w-full border-separate border-spacing-0 text-xs">
          {/* Header Row Letters */}
          <thead className="bg-slate-100 sticky top-0">
            <tr>
              <th className="w-14 min-w-[56px] bg-slate-200/90 border-b border-r border-slate-300 px-1 py-1 text-center font-mono text-[10px] text-slate-400">
                #
              </th>
              {dummyCols.map((colIdx) => (
                <th
                  key={`skel-col-${colIdx}`}
                  className="bg-slate-200/90 border-b border-r border-slate-300 px-2 py-0.5 text-center font-mono text-[10px] text-slate-500 font-semibold min-w-[130px]"
                >
                  {getColumnLetter(colIdx)}
                </th>
              ))}
            </tr>

            {/* Header Column Labels Skeleton */}
            <tr>
              <th className="w-14 min-w-[56px] bg-slate-100 border-b border-r border-slate-300 px-1 py-2 text-center text-[10px] text-slate-400">
                Row
              </th>
              {dummyCols.map((colIdx) => (
                <th
                  key={`skel-header-${colIdx}`}
                  className="bg-slate-100 border-b border-r border-slate-300 px-3 py-2 text-left min-w-[130px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-slate-300 rounded w-16 animate-pulse"></div>
                    <div className="w-3 h-3 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Skeleton Body Rows */}
          <tbody className="bg-white divide-y divide-slate-200">
            {dummyRows.map((rowIdx) => (
              <tr key={`skel-row-${rowIdx}`} className="animate-pulse">
                {/* Row Number */}
                <td className="w-14 min-w-[56px] border-r border-b border-slate-200 bg-slate-100 text-center font-mono text-[10px] text-slate-400 py-2">
                  {rowIdx + 1}
                </td>

                {/* Data cell skeleton bars */}
                {dummyCols.map((colIdx) => {
                  const widthIndex = (rowIdx + colIdx) % cellWidths.length;
                  const widthClass = cellWidths[widthIndex];

                  return (
                    <td
                      key={`skel-cell-${rowIdx}-${colIdx}`}
                      className="border-r border-b border-slate-200 px-3 py-2.5 min-w-[130px]"
                    >
                      <div className={`h-2.5 bg-slate-200/80 rounded ${widthClass}`}></div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Skeleton Status Bar */}
      <footer className="bg-slate-100 border-t border-slate-300 px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-3 w-28 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-44 bg-slate-200 rounded animate-pulse"></div>
        </div>
      </footer>
    </div>
  );
};
