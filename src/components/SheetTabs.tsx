import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
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
    <div className="bg-slate-100 border-t border-slate-300 px-2 py-1 flex items-center justify-between gap-2 select-none shrink-0 z-20">
      <div className="flex items-center gap-1 min-w-0">
        {/* Navigation scroll buttons for many sheets */}
        <div className="flex items-center gap-0.5 border-r border-slate-300 pr-1 mr-1">
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
          className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 scroll-smooth"
        >
          {sheetNames.map((sheetName) => {
            const isActive = sheetName === activeSheetName;
            const sheet = sheets[sheetName];
            const rowCount = sheet ? sheet.rowCount : 0;

            return (
              <button
                key={sheetName}
                id={`tab-sheet-${sheetName.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => onSelectSheet(sheetName)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-t-md text-xs font-medium transition-all shrink-0 cursor-pointer border-t border-x ${
                  isActive
                    ? 'bg-white text-emerald-800 border-slate-300 border-t-2 border-t-emerald-600 shadow-xs font-semibold'
                    : 'bg-slate-200/80 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
                <span className="truncate max-w-[140px]">{sheetName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-800'
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

      {/* Sheets counter */}
      <div className="text-[11px] text-slate-500 font-medium shrink-0 px-2 flex items-center gap-1">
        <span>{sheetNames.length}</span>
        <span className="hidden sm:inline">
          {sheetNames.length === 1 ? 'Sheet available' : 'Sheets available'}
        </span>
      </div>
    </div>
  );
};
