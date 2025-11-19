import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../ui/table';

import Pagination from '../ui/pagination/Pagination';
import { ChevronDown, ChevronUp, Search, Filter, XCircle } from 'lucide-react';

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortKey?: string;
  className?: string; 
  hideMobileLabel?: boolean; 
};

export type FetchParams = {
  page: number;
  size: number;
  query?: string;
  filters?: Record<string, string | undefined>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export default function DataTable<T extends { id?: string | number }>(props: {
  columns: Column<T>[];
  fetchData: (p: FetchParams) => Promise<{ items: T[]; total: number }>;
  initialPageSize?: number;
  filters?: { name: string; options: { label: string; value: string }[] }[];
  className?: string;
  renderActions?: (row: T) => React.ReactNode;
  actionsHeader?: React.ReactNode;
  toolbarSlot?: React.ReactNode;
  emptyState?: {
    title?: string;
    description?: string;
    action?: React.ReactNode;
  };
}) {
  const {
    columns,
    fetchData,
    initialPageSize = 10,
    filters = [],
    className,
    renderActions,
    actionsHeader = 'Thao tác',
    toolbarSlot,
    emptyState,
  } = props;

  // State management
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(initialPageSize);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string | undefined>>({});
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>();
  const [, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchData({ page, size, query, filters: activeFilters, sortBy, sortOrder })
      .then((res) => {
        if (!mounted) return;
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err) => {
        console.error(err);
        if (!mounted) return;
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [page, size, query, fetchData, activeFilters, sortBy, sortOrder]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setPage(0);
  };

  const handleFilterChange = (name: string, value?: string) => {
    setActiveFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const toggleSort = (key: string) => {
    if (sortBy !== key) {
      setSortBy(key);
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortBy(undefined);
      setSortOrder(undefined);
    }
    setPage(0);
  };

  const clearAllFilters = () => {
    setQuery('');
    setActiveFilters({});
    setSortBy(undefined);
    setSortOrder(undefined);
    setPage(0);
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in duration-300">
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-full mb-4">
        <Search className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-medium text-slate-900 dark:text-white"> {/* Tăng size title */}
        {emptyState?.title || 'Không tìm thấy dữ liệu'}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm text-base"> {/* Tăng text-sm -> text-base */}
        {emptyState?.description || 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để tìm kết quả phù hợp.'}
      </p>
      {(query || Object.keys(activeFilters).some(k => activeFilters[k])) && (
         <button 
           onClick={clearAllFilters}
           className="mt-4 text-base text-brand-600 dark:text-brand-400 font-medium hover:underline flex items-center gap-1"
         >
           <XCircle className="w-5 h-5" /> Xóa bộ lọc
         </button>
      )}
      {emptyState?.action && <div className="mt-6">{emptyState.action}</div>}
    </div>
  );

  const containerClass = [
    'flex flex-col w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClass}>
      {/* --- TOOLBAR SECTION --- */}
      <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
          <div className="relative w-full md:max-w-xs group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
            </div>
            {/* Input Text: Tăng lên text-base */}
            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              placeholder="Tìm kiếm..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-base transition-all"
            />
          </div>
          
          {filters.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
               <Filter className="w-5 h-5 text-slate-400 shrink-0 md:hidden" />
               {filters.map((f) => (
                <div key={f.name} className="relative shrink-0">
                  {/* Select: Tăng lên text-base */}
                  <select
                    value={activeFilters[f.name] ?? ''}
                    onChange={(e) => handleFilterChange(f.name, e.target.value || undefined)}
                    className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 pl-3 pr-8 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                  >
                    <option value="">Tất cả {f.name}</option>
                    {f.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ))}
            </div>
          )}
        </div>

        {toolbarSlot && (
          <div className="flex items-center justify-end shrink-0">
            {toolbarSlot}
          </div>
        )}
      </div>

      {/* --- TABLE CONTENT --- */}
      <div className="relative w-full overflow-x-auto bg-slate-50/50 dark:bg-slate-900/50 min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center">
            <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium text-brand-600 mt-2">Đang tải...</span>
            </div>
          </div>
        )}

        <Table className="w-full text-left border-collapse block md:table">
          {/* --- HEADER --- */}
          <TableHeader className="hidden md:table-header-group bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
            <TableRow className="md:table-row block">
              {columns.map((col) => {
                const active = (col.sortKey || col.key) === sortBy;
                return (
                  <TableCell
                    key={col.key}
                    isHeader
                    // HEADER: Tăng từ text-xs -> text-sm
                    className={`md:table-cell block py-3 px-4 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap ${col.className || ''}`}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => toggleSort(col.sortKey || col.key)}
                        className={`group inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ${active ? 'text-brand-600 dark:text-brand-400 font-bold' : ''}`}
                      >
                        {col.header}
                        <span className="flex flex-col w-3">
                            {active && sortOrder === 'asc' && <ChevronUp className="w-3 h-3" />}
                            {active && sortOrder === 'desc' && <ChevronDown className="w-3 h-3" />}
                            {!active && <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />}
                        </span>
                      </button>
                    ) : (
                      col.header
                    )}
                  </TableCell>
                );
              })}
              {renderActions && (
                <TableCell isHeader className="md:table-cell block py-3 px-4 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                  {actionsHeader}
                </TableCell>
              )}
            </TableRow>
          </TableHeader>

          {/* --- BODY --- */}
          <TableBody className="block md:table-row-group bg-white dark:bg-slate-900">
            {items.length === 0 && !loading ? (
              <TableRow className="block md:table-row">
                 <TableCell colSpan={columns.length + (renderActions ? 1 : 0)} className="block md:table-cell w-full">
                    {renderEmptyState()}
                 </TableCell>
              </TableRow>
            ) : (
              items.map((row, idx) => (
                <TableRow
                  key={(row.id as string) || idx}
                  className="block md:table-row mb-4 md:mb-0 border-y md:border-y-0 border-slate-200 dark:border-slate-800 md:border-b hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      // CELL: Tăng từ text-sm -> text-base
                      className={`
                        block md:table-cell 
                        px-4 py-4 md:py-5 
                        text-base text-slate-700 dark:text-slate-200
                        border-b border-slate-100 dark:border-slate-800 md:border-none 
                        last:border-b-0 md:last:border-none
                        flex justify-between items-center md:block
                        ${col.className || ''}
                      `}
                    >
                        {/* Mobile Label: Tăng từ text-xs -> text-sm */}
                        <span className="md:hidden font-semibold text-slate-500 dark:text-slate-400 text-sm uppercase mr-4">
                           {col.header}
                        </span>
                        
                        <div className="text-right md:text-left w-full md:w-auto break-words">
                          {col.render ? col.render(row) : (row as any)[col.key]}
                        </div>
                    </TableCell>
                  ))}

                  {renderActions && (
                    <TableCell className="block md:table-cell px-4 py-3 md:py-5 border-t border-slate-100 dark:border-slate-800 md:border-t-0 bg-slate-50/50 md:bg-transparent dark:bg-slate-800/30 md:dark:bg-transparent">
                      <div className="flex justify-end items-center gap-2 w-full">
                         <span className="md:hidden font-semibold text-slate-500 text-sm uppercase mr-auto">
                           {actionsHeader}
                         </span>
                         {renderActions(row)}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- PAGINATION --- */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-b-xl">
        <Pagination
          page={page}
          size={size}
          total={total}
          onPageChange={(p) => setPage(p)}
          onSizeChange={(s) => {
            setSize(s);
            setPage(0);
          }}
        />
      </div>
    </div>
  );
}