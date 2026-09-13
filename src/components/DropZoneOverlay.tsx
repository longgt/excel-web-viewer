import React from 'react';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';

interface DropZoneOverlayProps {
  isDragging: boolean;
}

export const DropZoneOverlay: React.FC<DropZoneOverlayProps> = ({ isDragging }) => {
  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 bg-emerald-950/70 backdrop-blur-xs flex items-center justify-center p-6 transition-all animate-in fade-in duration-150 pointer-events-none">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-dashed border-emerald-500 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <UploadCloud className="w-8 h-8 animate-bounce" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Drop Excel or CSV file</h3>
          <p className="text-xs text-slate-500 mt-1">
            Supports .xlsx, .xls, .csv, .tsv files with multiple sheets
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
          <FileSpreadsheet className="w-4 h-4" />
          <span>Release to parse workbook instantly</span>
        </div>
      </div>
    </div>
  );
};
