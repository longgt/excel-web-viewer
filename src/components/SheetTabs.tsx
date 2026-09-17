import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, FileSpreadsheet, Plus } from 'lucide-react';
import { SheetData } from '../types';

interface SheetTabsProps {
  sheetNames: string[];
  activeSheetName: string;
  sheets: Record<string, SheetData>;
  onSelectSheet: (sheetName: string) => void;
}

export const SheetTabs: React.FC<SheetTabsProps> = ({
  sheetNames,
  activeSheetName,
  sheets,
  onSelectSheet,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -150 : 150;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#f3f4f6] border-t border-[#cbd5e1] px-2 py-0.5 flex items-center justify-between gap-2 select-none shrink-0 z-20 shadow-xs">
      <div className="flex items-center gap-1 min-w-0">
        {/* Navigation scroll buttons for many sheets */}
        <div className="flex items-center gap-0.5 border-r border-[#cbd5e1] pr-1 mr-1">
          <button
            onClick={() => scrollTabs('left')}
            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            title="Scroll sheets left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scrollTabs('right')}
            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            title="Scroll sheets right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable sheet tabs list */}
        <div
          ref={scrollContainerRef}
          className="flex items-end gap-1 overflow-x-auto no-scrollbar pt-1 scroll-smooth"
        >
          {sheetNames.map((sheetName) => {
            const isActive = sheetName === activeSheetName;
            const sheet = sheets[sheetName];
            const rowCount = sheet ? sheet.rowCount : 0;
            const tabColor = sheet?.tabColor;

            return (
              <button
                key={sheetName}
                id={`tab-sheet-${sheetName.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => onSelectSheet(sheetName)}
                style={{
                  borderBottom: isActive
                    ? `3px solid ${tabColor || '#107c41'}`
                    : tabColor
                    ? `2.5px solid ${tabColor}`
                    : '2.5px solid transparent',
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-t text-[11px] font-medium transition-all shrink-0 cursor-pointer border-t border-x ${
                  isActive
                    ? 'bg-white text-slate-900 border-[#cbd5e1] shadow-2xs font-semibold'
                    : 'bg-[#e2e8f0]/80 text-slate-600 border-transparent hover:bg-slate-200/90 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: isActive ? (tabColor || '#107c41') : '#64748b' }}
                />
                <span className="truncate max-w-[140px]">{sheetName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-slate-300/60 text-slate-600'
                  }`}
                >
                  {rowCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sheets counter & Excel Ready status */}
      <div className="text-[11px] text-slate-500 font-medium shrink-0 px-2 flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-[#107c41]"></span>
          <span>Ready</span>
        </span>
        <span className="text-slate-300">|</span>
        <span>{sheetNames.length} {sheetNames.length === 1 ? 'Sheet' : 'Sheets'}</span>
      </div>
    </div>
  );
};

