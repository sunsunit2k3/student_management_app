import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../ui/table';

import Pagination from '../ui/pagination/Pagination';

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortKey?: string; // default uses key
};

export type FetchParams = {
  page: number;
  size: number;
  query?: string;
  filters?: Record<string, string | undefined>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export default function DataTable<T>(props: {
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
    initialPageSize = 5,
    filters = [],
    className,
    renderActions,
    actionsHeader = 'Actions',
    toolbarSlot,
    emptyState,
  } = props;

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(initialPageSize);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string | undefined>>({});
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchData({ page, size, query, filters: activeFilters, sortBy, sortOrder })
      .then((res) => {
        if (!mounted) return;
        setItems(res.items);
        setTotal(res.total);
      })
      .catch(() => {
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
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setPage(0);
  }

  function handleFilterChange(name: string, value?: string) {
    setActiveFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  }

  function toggleSort(key: string) {
    if (sortBy !== key) {
      setSortBy(key);
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else if (sortOrder === 'desc') {
      setSortBy(undefined);
      setSortOrder(undefined);
    } else {
      setSortOrder('asc');
    }
    setPage(0);
  }

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-500">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 17.5V6.5C4 5.39543 4.89543 4.5 6 4.5H18C19.1046 4.5 20 5.39543 20 6.5V17.5C20 18.6046 19.1046 19.5 18 19.5H6C4.89543 19.5 4 18.6046 4 17.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 9H15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 12H13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">{emptyState?.title || 'Không có dữ liệu'}</p>
      <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
        {emptyState?.description || 'Hãy thử thay đổi bộ lọc hoặc tạo bản ghi mới.'}
      </p>
      {emptyState?.action && <div className="mt-4">{emptyState.action}</div>}
    </div>
  );

  const rootClassName = [
    'overflow-hidden rounded-3xl border border-[var(--color-gray-100)] bg-gradient-to-b from-white to-[var(--color-gray-50)] shadow-xl shadow-[rgba(16,24,40,0.12)] dark:border-white/5 dark:from-white/5 dark:to-white/0',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClassName}>
      <div className="border-b border-[var(--color-gray-100)] bg-white/70 px-5 py-5 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-wrap gap-3">
            <div className="relative min-w-[220px] flex-1">
              <input
                type="text"
                value={query}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm..."
                className="w-full rounded-2xl border border-[var(--color-gray-200)] bg-white/90 py-2.5 pl-11 pr-4 text-base text-[var(--color-gray-700)] shadow-inner shadow-[rgba(16,24,40,0.08)] outline-none transition focus:border-[var(--color-brand-400)] focus:ring-4 focus:ring-[var(--color-brand-100)] dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)] dark:text-white/60">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M15.5 15.5L20 20"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18 10C18 13.3137 15.3137 16 12 16C8.68629 16 6 13.3137 6 10C6 6.68629 8.68629 4 12 4C15.3137 4 18 6.68629 18 10Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
            {filters.map((f) => (
              <select
                key={f.name}
                value={activeFilters[f.name] ?? ''}
                onChange={(e) => handleFilterChange(f.name, e.target.value || undefined)}
                className="min-w-[160px] rounded-2xl border border-[var(--color-gray-200)] bg-white/90 px-4 py-2.5 text-base text-[var(--color-gray-700)] shadow-inner shadow-[rgba(16,24,40,0.08)] outline-none transition focus:border-[var(--color-brand-400)] focus:ring-4 focus:ring-[var(--color-brand-100)] dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                <option value="">All {f.name}</option>
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
          <div className="flex w-full flex-col gap-2 text-sm text-[var(--color-gray-500)] dark:text-gray-400 lg:w-auto lg:flex-row lg:items-center lg:justify-end">
            <span className="inline-flex justify-end font-medium text-[var(--color-gray-600)] dark:text-gray-200">
              {loading ? 'Đang tải...' : `${total} bản ghi`}
            </span>
            {toolbarSlot && <div className="flex justify-start lg:justify-end">{toolbarSlot}</div>}
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-[var(--color-gray-100)] bg-[color:var(--color-brand-50)] text-xs uppercase tracking-wide text-[var(--color-gray-500)] dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            <TableRow>
              {columns.map((col) => {
                const active = (col.sortKey || col.key) === sortBy;
                const indicator = active ? (sortOrder === 'asc' ? '▲' : sortOrder === 'desc' ? '▼' : '') : '';
                return (
                  <TableCell
                    key={col.key}
                    isHeader
                    className={`px-6 py-4 font-semibold text-[var(--color-gray-600)] text-start text-xs tracking-wide dark:text-gray-200`}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.sortKey || col.key)}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition hover:text-[var(--color-gray-900)] dark:hover:text-white ${active ? 'bg-[var(--color-brand-100)] text-[var(--color-brand-600)] dark:bg-white/10 dark:text-white' : ''}`}
                      >
                        {col.header}
                        <span className="opacity-70">{indicator}</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1">{col.header}</span>
                    )}
                  </TableCell>
                );
              })}
              {renderActions && (
                <TableCell isHeader className="px-6 py-4 font-semibold text-gray-700 text-start text-sm dark:text-gray-300">
                  {actionsHeader}
                </TableCell>
              )}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-[var(--color-gray-100)] bg-white dark:divide-white/5 dark:bg-white/5">
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (renderActions ? 1 : 0)} className="px-6 py-8">
                  {renderEmptyState()}
                </TableCell>
              </TableRow>
            ) : (
              items.map((row: any, idx) => (
                <TableRow
                  key={row.id ?? idx}
                  className="group transition hover:bg-[color:var(--color-brand-50)] dark:hover:bg-white/5"
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className="px-6 py-5 text-[var(--color-gray-700)] text-start text-base dark:text-gray-200">
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </TableCell>
                  ))}
                  {renderActions && (
                    <TableCell className="px-6 py-4 text-start">
                      <div className="flex flex-wrap items-center gap-2">
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

      <div className="border-t border-[var(--color-gray-100)] bg-white/90 px-5 py-4 dark:border-white/10 dark:bg-white/5">
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
