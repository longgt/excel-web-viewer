import React, { useState, useMemo } from 'react';
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Filter,
  Search,
  CheckSquare,
  Square,
  X,
  RotateCcw,
  Check,
} from 'lucide-react';
import { ColumnFilter, FilterOperator, CellValue } from '../types';
import { extractUniqueColumnValues } from '../utils/filterEvaluator';

interface ColumnFilterModalProps {
  colIndex: number;
  colName: string;
  rows: CellValue[][];
  existingFilter?: ColumnFilter;
  onApplyFilter: (filter: ColumnFilter) => void;
  onClearFilter: (colIndex: number) => void;
  onSortColumn: (colIndex: number, direction: 'asc' | 'desc') => void;
  onClose: () => void;
}

const FILTER_OPERATORS: Array<{ id: FilterOperator; label: string }> = [
  { id: 'contains', label: 'Text contains' },
  { id: 'not_contains', label: 'Text does not contain' },
  { id: 'equals', label: 'Equals' },
  { id: 'not_equals', label: 'Does not equal' },
  { id: 'starts_with', label: 'Starts with' },
  { id: 'ends_with', label: 'Ends with' },
  { id: 'greater_than', label: 'Greater than (>)' },
  { id: 'less_than', label: 'Less than (<)' },
  { id: 'is_empty', label: 'Is empty / blank' },
  { id: 'is_not_empty', label: 'Is not empty' },
];

export const ColumnFilterModal: React.FC<ColumnFilterModalProps> = ({
  colIndex,
  colName,
  rows,
  existingFilter,
  onApplyFilter,
  onClearFilter,
  onSortColumn,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'criteria' | 'values'>('criteria');
  const [operator, setOperator] = useState<FilterOperator>(
    existingFilter?.operator || 'contains'
  );
  const [filterValue, setFilterValue] = useState<string>(
    existingFilter?.value || ''
  );

  // Extract unique column values
  const uniqueValues = useMemo(() => {
    return extractUniqueColumnValues(rows, colIndex);
  }, [rows, colIndex]);

  const [valueSearch, setValueSearch] = useState('');
  const [selectedValues, setSelectedValues] = useState<Set<string>>(() => {
    if (existingFilter?.selectedValues && existingFilter.selectedValues.size > 0) {
      return new Set(existingFilter.selectedValues);
    }
    // Default to all selected
    return new Set(uniqueValues.map((v) => v.value));
  });

  const filteredUniqueValues = useMemo(() => {
    if (!valueSearch.trim()) return uniqueValues;
    const q = valueSearch.toLowerCase();
    return uniqueValues.filter((v) => v.value.toLowerCase().includes(q));
  }, [uniqueValues, valueSearch]);

  const toggleSelectValue = (val: string) => {
    const next = new Set(selectedValues);
    if (next.has(val)) {
      next.delete(val);
    } else {
      next.add(val);
    }
    setSelectedValues(next);
  };

  const selectAllValues = () => {
    setSelectedValues(new Set(uniqueValues.map((v) => v.value)));
  };

  const deselectAllValues = () => {
    setSelectedValues(new Set());
  };

  const handleApply = () => {
    if (activeTab === 'criteria') {
      onApplyFilter({
        colIndex,
        colName,
        operator,
        value: filterValue,
      });
    } else {
      onApplyFilter({
        colIndex,
        colName,
        operator: 'in_list',
        value: `${selectedValues.size} values`,
        selectedValues,
      });
    }
    onClose();
  };

  const handleClear = () => {
    onClearFilter(colIndex);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-800">Filter Column</h3>
              <p className="text-[11px] font-mono text-emerald-700 truncate max-w-[200px]">
                {colName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Sort Actions */}
        <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-white">
          <button
            onClick={() => {
              onSortColumn(colIndex, 'asc');
              onClose();
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
          >
            <ArrowDownAZ className="w-3.5 h-3.5 text-slate-500" />
            <span>Sort A → Z</span>
          </button>
          <button
            onClick={() => {
              onSortColumn(colIndex, 'desc');
              onClose();
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
          >
            <ArrowUpAZ className="w-3.5 h-3.5 text-slate-500" />
            <span>Sort Z → A</span>
          </button>
        </div>

        {/* Tabs: Filter by Criteria vs Filter by Values */}
        <div className="px-3 pt-2 bg-slate-50 border-b border-slate-200 flex gap-2">
          <button
            onClick={() => setActiveTab('criteria')}
            className={`pb-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'criteria'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Filter by Criteria
          </button>
          <button
            onClick={() => setActiveTab('values')}
            className={`pb-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'values'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Filter by Values ({uniqueValues.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 flex-1">
          {activeTab === 'criteria' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Condition operator
                </label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as FilterOperator)}
                  className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  {FILTER_OPERATORS.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>

              {operator !== 'is_empty' && operator !== 'is_not_empty' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Value / Search term
                  </label>
                  <input
                    type="text"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder="Enter text or number to match..."
                    autoFocus
                    className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Matches cell text or numeric comparisons depending on selected operator.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={valueSearch}
                  onChange={(e) => setValueSearch(e.target.value)}
                  placeholder="Search values in column..."
                  className="w-full h-7 pl-7 pr-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <button
                  type="button"
                  onClick={selectAllValues}
                  className="text-emerald-600 hover:text-emerald-800 font-medium hover:underline"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={deselectAllValues}
                  className="text-slate-500 hover:text-slate-700 hover:underline"
                >
                  Clear All
                </button>
              </div>

              {/* Values list */}
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded p-1 divide-y divide-slate-100 bg-slate-50/50">
                {filteredUniqueValues.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No matching values found
                  </div>
                ) : (
                  filteredUniqueValues.map((item) => {
                    const isChecked = selectedValues.has(item.value);
                    return (
                      <label
                        key={item.value}
                        className="flex items-center justify-between px-2 py-1 hover:bg-slate-100 rounded text-xs text-slate-700 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectValue(item.value)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 w-3.5 h-3.5"
                          />
                          <span className="truncate">{item.value}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono pl-2">
                          {item.count}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          {existingFilter ? (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filter
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-slate-300 text-xs text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
