'use client';

import { useState } from 'react';

import { CreateLinkForm } from '@/components/link/create-link-form';
import { LinksTable } from '@/components/link/links-table';
import { useLinks } from '@/hooks/use-links';

export default function DashboardPage() {
  const { data: links = [], isLoading } = useLinks();
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = links.filter(
    (l) =>
      l.code.toLowerCase().includes(query.toLowerCase()) ||
      l.originalUrl.toLowerCase().includes(query.toLowerCase()),
  );

  const totalLinks = links.length;
  const archived = 0;

  return (
    <div className="flex h-full flex-col gap-5 p-7">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-[family-name:var(--font-hand)] text-[26px] font-bold">
            Your links
          </h1>
          <span className="text-[11px] text-[color:var(--wf-muted)]">
            {totalLinks} active · {archived} archived
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="wf-btn-outline inline-flex items-center justify-center px-3 py-1.5 text-[12px]"
          >
            ⇪ Import
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
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by slug or destination…"
          className="wf-input h-9 w-[280px] text-[12px]"
          style={{ minHeight: 32 }}
        />
        <button type="button" className="wf-btn-outline px-3 py-1.5 text-[12px]">
          Date ▾
        </button>
        <button type="button" className="wf-btn-outline px-3 py-1.5 text-[12px]">
          Status ▾
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button type="button" className="wf-btn-outline px-3 py-1.5 text-[12px]">
            ≡ List
          </button>
          <button type="button" className="wf-btn-ghost px-3 py-1.5 text-[12px]">
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
          <LinksTable links={filtered} />
        )}
      </div>

      {/* Footer / pagination */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[color:var(--wf-muted)]">
          Showing {filtered.length} of {totalLinks}
        </span>
        <div className="flex items-center gap-1.5">
          <button type="button" className="wf-btn-outline px-2.5 py-1 text-[12px]">
            ←
          </button>
          <button type="button" className="wf-btn-outline px-2.5 py-1 text-[12px]">
            1
          </button>
          <button type="button" className="wf-btn-ghost px-2.5 py-1 text-[12px]">
            2
          </button>
          <button type="button" className="wf-btn-ghost px-2.5 py-1 text-[12px]">
            3
          </button>
          <button type="button" className="wf-btn-outline px-2.5 py-1 text-[12px]">
            →
          </button>
        </div>
      </div>
    </div>
  );
}
