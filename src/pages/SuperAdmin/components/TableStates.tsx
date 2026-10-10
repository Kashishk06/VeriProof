import React from 'react';
import { Loader2, AlertCircle, FileSearch, RefreshCw } from 'lucide-react';

export const TableLoadingState: React.FC<{ message?: string }> = ({ message = 'Loading data...' }) => (
  <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
    <Loader2 size={24} className="animate-spin text-purple-400" />
    <span className="text-xs font-mono">{message}</span>
  </div>
);

export const TableEmptyState: React.FC<{
  title?: string;
  description?: string;
  isFiltered?: boolean;
  onClearFilters?: () => void;
}> = ({
  title,
  description,
  isFiltered = false,
  onClearFilters
}) => (
  <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-3">
    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
      <FileSearch size={22} />
    </div>
    <div className="space-y-1">
      <h4 className="text-sm font-bold text-slate-300">
        {title || (isFiltered ? 'No records match the selected filters.' : 'No records found.')}
      </h4>
      <p className="text-xs text-slate-500 max-w-sm">
        {description || (isFiltered ? 'Try adjusting your search criteria or resetting the active filters.' : 'There are currently no records available in this section.')}
      </p>
    </div>
    {isFiltered && onClearFilters && (
      <button
        onClick={onClearFilters}
        className="mt-2 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors"
      >
        Clear All Filters
      </button>
    )}
  </div>
);

export const TableErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({
  message = 'Unable to load data. Please try again.',
  onRetry
}) => (
  <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-3">
    <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
      <AlertCircle size={22} />
    </div>
    <div className="space-y-1">
      <h4 className="text-sm font-bold text-red-400">Data Synchronization Error</h4>
      <p className="text-xs text-slate-400 max-w-sm">{message}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-2 px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold transition-colors flex items-center gap-1.5"
      >
        <RefreshCw size={12} />
        Retry Operation
      </button>
    )}
  </div>
);
