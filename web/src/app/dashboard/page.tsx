'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { CreateLinkForm } from '@/components/link/create-link-form';
import { LinksTable } from '@/components/link/links-table';
import { useLinks } from '@/hooks/use-links';
import { linkApi } from '@/lib/api';

type StatusFilter = 'all' | 'active' | 'archived';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'list' | 'grid';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(searchParams.get('new') === '1');

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      router.replace('/dashboard');
    }
  }, []);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [exporting, setExporting] = useState(false);
  const [view, setView] = useState<ViewMode>('list');

  // Debounce search input
  const handleSearchChange = (value: string) => {
    setQuery(value);
    clearTimeout((handleSearchChange as { _t?: ReturnType<typeof setTimeout> })._t);
    (handleSearchChange as { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(() => {
      setDebouncedQuery(value);
      setPage(1);
    }, 300);
  };

  const { data, isLoading } = useLinks({
    search: debouncedQuery || undefined,
    page,
    limit: 20,
    sortOrder,
    status,
  });

  const links = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const activeCount = status === 'active' ? total : '—';
  const archivedCount = status === 'archived' ? total : '—';

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const blob = await linkApi.exportCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'links.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const paginationRange = () => {
    const pages: number[] = [];
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages, page + 1);
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  };

  return (
    <div className="flex h-full flex-col gap-5 p-7">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-[family-name:var(--font-hand)] text-[26px] font-bold">
            Your links
          </h1>
          <span className="text-[11px] text-[color:var(--wf-muted)]">
            {total} {status === 'archived' ? 'archived' : status === 'active' ? 'active' : 'total'}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className="wf-btn-outline inline-flex items-center justify-center px-3 py-1.5 text-[12px] disabled:opacity-50"
          >
            {exporting ? '⋯' : '⇩'} CSV
          </button>
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="wf-btn-solid inline-flex items-center justify-center px-3 py-1.5 text-[12px]"
          >
            + New link
          </button>
        </div>
      </div>

      {/* Inline create form */}
      {showCreate && (
        <div className="wf-box p-4">
          <CreateLinkForm onSuccess={() => setShowCreate(false)} />
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2.5">
        <input
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by slug or destination…"
          className="wf-input h-9 w-[280px] text-[12px]"
          style={{ minHeight: 32 }}
        />

        {/* Status filter */}
        <div className="relative">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter);
              setPage(1);
            }}
            className="wf-input h-9 cursor-pointer appearance-none px-3 py-1.5 pr-7 text-[12px]"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[color:var(--wf-muted)]">
            ▾
          </span>
        </div>

        {/* Date / sort order toggle */}
        <button
          type="button"
          onClick={() => {
            setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
            setPage(1);
          }}
          className="wf-btn-outline px-3 py-1.5 text-[12px]"
          title="Toggle sort order"
        >
          Date {sortOrder === 'desc' ? '↓' : '↑'}
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-[12px] ${view === 'list' ? 'wf-btn-outline' : 'wf-btn-ghost'}`}
          >
            ≡ List
          </button>
          <button
            type="button"
            onClick={() => setView('grid')}
            className={`px-3 py-1.5 text-[12px] ${view === 'grid' ? 'wf-btn-outline' : 'wf-btn-ghost'}`}
          >
            ▦ Grid
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="wf-box flex-1 overflow-hidden p-0">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-[12px] text-[color:var(--wf-muted)]">
            Loading…
          </div>
        ) : (
          <LinksTable links={links} view={view} />
        )}
      </div>

      {/* Footer / pagination */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[color:var(--wf-muted)]">
          Showing {links.length} of {total}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="wf-btn-outline px-2.5 py-1 text-[12px] disabled:opacity-40"
            >
              ←
            </button>
            {paginationRange().map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`px-2.5 py-1 text-[12px] ${p === page ? 'wf-btn-outline' : 'wf-btn-ghost'}`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="wf-btn-outline px-2.5 py-1 text-[12px] disabled:opacity-40"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
