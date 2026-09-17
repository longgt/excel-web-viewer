import React, { useEffect, useRef } from 'react';
import {
  Copy,
  ClipboardCopy,
  Table,
  Filter,
  Bookmark,
  BookmarkCheck,
  Check,
} from 'lucide-react';
import { CellValue } from '../types';

interface CellContextMenuProps {
  x: number;
  y: number;
  cellAddress: string;
  cellValue: string;
  columnName?: string;
  rowValues?: CellValue[];
  headers?: string[];
  isRowHighlighted?: boolean;
  onClose: () => void;
  onCopyValue: () => void;
  onCopyReference?: () => void;
  onCopyRowTsv?: () => void;
  onCopyRowCsv?: () => void;
  onToggleHighlight?: () => void;
  onFilterByValue?: () => void;
}

export const CellContextMenu: React.FC<CellContextMenuProps> = ({
  x,
  y,
  cellAddress,
  cellValue,
  columnName,
  isRowHighlighted,
  onClose,
  onCopyValue,
  onCopyReference,
  onCopyRowTsv,
  onCopyRowCsv,
  onToggleHighlight,
  onFilterByValue,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const shortcutKey = isMac ? '⌘C' : 'Ctrl+C';

  // Handle outside click & escape key
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  // Ensure menu stays within screen viewport
  const menuWidth = 230;
  const menuHeight = 270;
  const adjustedX = Math.max(8, Math.min(x, window.innerWidth - menuWidth - 8));
  const adjustedY = Math.max(8, Math.min(y, window.innerHeight - menuHeight - 8));

  const displayValPreview = cellValue ? (cellValue.length > 22 ? cellValue.slice(0, 22) + '…' : cellValue) : '(empty)';

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Cell Context Menu"
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
      }}
      className="fixed z-50 w-[230px] bg-white border border-slate-200 rounded-lg shadow-xl text-xs py-1 select-none animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header Info */}
      <div className="px-3 py-1.5 bg-slate-50 text-slate-500 text-[11px] flex items-center justify-between font-mono">
        <span className="font-semibold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
          {cellAddress}
        </span>
        <span className="truncate max-w-[130px] text-slate-600 font-sans" title={cellValue}>
          {displayValPreview}
        </span>
      </div>

      {/* Primary Copy Actions */}
      <div className="py-1">
        <button
          id="context-menu-copy"
          onClick={() => {
            onCopyValue();
            onClose();
          }}
          className="w-full px-3 py-1.5 flex items-center justify-between text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Copy className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium">Copy</span>
          </div>
          <kbd className="text-[10px] font-mono text-slate-400 group-hover:text-emerald-700 bg-slate-100 group-hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-slate-200 group-hover:border-emerald-200">
            {shortcutKey}
          </kbd>
        </button>

        {onCopyReference && (
          <button
            id="context-menu-copy-ref"
            onClick={() => {
              onCopyReference();
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ClipboardCopy className="w-3.5 h-3.5 text-slate-400" />
            <span>Copy with Header</span>
          </button>
        )}

        {onCopyRowTsv && (
          <button
            id="context-menu-copy-row"
            onClick={() => {
              onCopyRowTsv();
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Table className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Row (TSV)</span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono">Excel</span>
          </button>
        )}

        {onCopyRowCsv && (
          <button
            id="context-menu-copy-csv"
            onClick={() => {
              onCopyRowCsv();
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Table className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Row (CSV)</span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono">CSV</span>
          </button>
        )}
      </div>

      {/* Row and Filter Actions */}
      <div className="py-1">
        {onFilterByValue && cellValue && (
          <button
            id="context-menu-filter"
            onClick={() => {
              onFilterByValue();
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer truncate"
            title={`Filter ${columnName || 'column'} by "${cellValue}"`}
          >
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              Filter by &quot;{displayValPreview}&quot;
            </span>
          </button>
        )}

        {onToggleHighlight && (
          <button
            id="context-menu-toggle-highlight"
            onClick={() => {
              onToggleHighlight();
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {isRowHighlighted ? (
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-600 fill-amber-300" />
              ) : (
                <Bookmark className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{isRowHighlighted ? 'Unhighlight Row' : 'Highlight Row'}</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
