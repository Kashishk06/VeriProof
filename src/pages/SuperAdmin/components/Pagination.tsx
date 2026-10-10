import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalItems <= pageSize && currentPage === 1) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 px-1 border-t border-white/5 text-xs text-slate-400">
      <div className="font-mono text-[11px]">
        Showing <span className="text-white font-semibold">{startItem}</span> - <span className="text-white font-semibold">{endItem}</span> of <span className="text-white font-semibold">{totalItems}</span> records
      </div>
      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg bg-[#050816] border border-white/10 hover:border-white/20 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-7 h-7 px-2 rounded-lg font-mono text-[11px] font-semibold transition-colors ${
              currentPage === page
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'bg-[#050816] text-slate-400 hover:text-white border border-white/5 hover:border-white/10'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg bg-[#050816] border border-white/10 hover:border-white/20 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
