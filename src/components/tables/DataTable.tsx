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
}) {
  const { columns, fetchData, initialPageSize = 5, filters = [], className, renderActions, actionsHeader = 'Actions' } = props;

  const [page, setPage] = useState(1);
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
        console.log(res);
        
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
    setPage(1);
  }

  function handleFilterChange(name: string, value?: string) {
    setActiveFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  }

  function toggleSort(key: string) {
    // If clicking new column, start with asc; if same, toggle; if desc -> undefined
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
    setPage(1);
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] ${className || ''}`}>
      <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            placeholder="Search..."
            value={query}
            onChange={handleSearchChange}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-transparent"
          />
          {filters.map((f) => (
            <select
              key={f.name}
              value={activeFilters[f.name] ?? ''}
              onChange={(e) => handleFilterChange(f.name, e.target.value || undefined)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-base bg-white dark:bg-transparent"
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
        <div className="text-gray-600 text-sm">{loading ? 'Loading...' : `${total} items`}</div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {columns.map((col) => {
                const active = (col.sortKey || col.key) === sortBy;
                const indicator = active ? (sortOrder === 'asc' ? '▲' : sortOrder === 'desc' ? '▼' : '') : '';
                return (
                  <TableCell
                    key={col.key}
                    isHeader
                    className={`px-6 py-4 font-semibold text-gray-700 text-start text-sm dark:text-gray-300`}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.sortKey || col.key)}
                        className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
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

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (renderActions ? 1 : 0)} className="px-6 py-8 text-center text-gray-500">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              items.map((row: any, idx) => (
                <TableRow key={row.id ?? idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  {columns.map((col) => (
                    <TableCell key={col.key} className="px-6 py-4 text-gray-700 text-start text-base dark:text-gray-300">
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </TableCell>
                  ))}
                  {renderActions && (
                    <TableCell className="px-6 py-4 text-start">
                      <div className="flex items-center gap-2">
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

      <div className="p-4">
        <Pagination page={page} size={size} total={total} onPageChange={(p) => setPage(p)} onSizeChange={(s) => { setSize(s); setPage(1); }} />
      </div>
    </div>
  );
}
