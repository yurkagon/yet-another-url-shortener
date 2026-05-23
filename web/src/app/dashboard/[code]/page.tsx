'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { BrowserChart } from '@/components/statistics/browser-chart';
import { ClicksChart } from '@/components/statistics/clicks-chart';
import { CountryChart } from '@/components/statistics/country-chart';
import { QrCodeModal } from '@/components/link/qr-code-modal';
import { QrPlaceholder } from '@/components/wf/qr-placeholder';
import { formatShortLinkLabel } from '@/lib/brand';
import { useBrowserStats, useCountryStats, useTimelineStats } from '@/hooks/use-statistics';
import { useUpdateLink, useDeleteLink } from '@/hooks/use-links';
import { linkService, ApiError } from '@/services';
import { useQuery } from '@tanstack/react-query';

interface Props {
  params: Promise<{ code: string }>;
}

const APP_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') ?? 'http://localhost:3000';

export default function AnalyticsPage({ params }: Props) {
  const { code } = use(params);
  const shortUrl = `${APP_URL}/l/${code}`;
  const router = useRouter();

  const { data: linkData } = useQuery({
    queryKey: ['link', code],
    queryFn: () => linkService.getByCode(code),
  });
  const linkId = linkData?.id ?? '';

  const { data: timeline = [], isLoading: loadingTimeline } = useTimelineStats(code);
  const { data: browsers = {}, isLoading: loadingBrowser } = useBrowserStats(code);
  const { data: countries = {}, isLoading: loadingCountry } = useCountryStats(code);

  const totalClicks = timeline.reduce((sum, d) => sum + d.value, 0);
  const browserCount = Object.keys(browsers).length;
  const countryCount = Object.keys(countries).length;
  const topCountry = Object.entries(countries).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const topBrowser = Object.entries(browsers).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  // ── modals / dropdowns ─────────────────────────────────────────────────────
  const [showQr, setShowQr] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editUrl, setEditUrl] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const updateLink = useUpdateLink(linkId);
  const deleteLink = useDeleteLink(linkId);

  const copy = () => {
    void navigator.clipboard.writeText(shortUrl);
    toast.success('Copied!');
  };

  const openEdit = () => {
    setEditUrl(linkData?.originalUrl ?? '');
    setEditSlug(code);
    setSlugError('');
    setShowEdit(true);
  };

  const handleEditSave = () => {
    if (!editUrl.trim()) return;
    setSlugError('');

    const patch: { originalUrl?: string; code?: string } = {};
    if (editUrl.trim() !== linkData?.originalUrl) patch.originalUrl = editUrl.trim();
    if (editSlug.trim() !== code) patch.code = editSlug.trim();

    if (Object.keys(patch).length === 0) { setShowEdit(false); return; }

    updateLink.mutate(patch, {
      onSuccess: () => {
        toast.success('Link updated');
        setShowEdit(false);
        // If slug changed — navigate to new URL
        if (patch.code) router.replace(`/dashboard/${patch.code}`);
      },
      onError: (err: unknown) => {
        if (err instanceof ApiError && err.status === 409) {
          setSlugError('This slug is already taken');
        } else {
          toast.error('Failed to update link');
        }
      },
    });
  };

  const handleArchive = () => {
    setShowMenu(false);
    updateLink.mutate(
      { isArchived: true },
      {
        onSuccess: () => {
          toast.success('Link archived');
          router.push('/dashboard');
        },
        onError: () => toast.error('Failed to archive link'),
      },
    );
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (!confirm(`Delete link "${code}"? This cannot be undone.`)) return;
    deleteLink.mutate(undefined, {
      onSuccess: () => {
        toast.success('Link deleted');
        router.push('/dashboard');
      },
      onError: () => toast.error('Failed to delete link'),
    });
  };

  const stats: { label: string; value: string; delta?: string }[] = [
    { label: 'Clicks', value: totalClicks.toLocaleString() },
    { label: 'Browsers', value: browserCount.toString() },
    { label: 'Top country', value: topCountry, delta: `${countryCount} total` },
    { label: 'Top browser', value: topBrowser },
  ];

  return (
    <div className="flex h-full flex-col gap-5 p-7">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px] text-[color:var(--wf-muted)]">
        <Link href="/dashboard" className="hover:text-foreground">
          Links
        </Link>
        <span>›</span>
        <span className="text-foreground">{code}</span>
      </nav>

      {/* Hero header */}
      <div className="wf-box p-5">
        <div className="flex items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <QrPlaceholder size={80} />
            <div className="flex flex-col gap-1.5">
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-[family-name:var(--font-mono)] text-[22px] text-[color:var(--wf-accent)] hover:underline"
              >
                {formatShortLinkLabel(code)}
              </a>
              <span className="text-[11px] text-[color:var(--wf-muted)]">↳ {shortUrl}</span>
              <span className="text-[10px] text-[color:var(--wf-muted)]">active</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={copy}
              className="wf-btn-outline px-3 py-1.5 text-[12px]"
            >
              ⎘ Copy
            </button>
            <button
              type="button"
              onClick={() => setShowQr(true)}
              className="wf-btn-outline px-3 py-1.5 text-[12px]"
            >
              ⬇ QR
            </button>
            <button
              type="button"
              onClick={openEdit}
              className="wf-btn-outline px-3 py-1.5 text-[12px]"
            >
              ✎ Edit
            </button>

            {/* "..." dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenu((v) => !v)}
                className="wf-btn-outline px-3 py-1.5 text-[12px]"
              >
                ⋯
              </button>
              {showMenu && (
                <div className="wf-box absolute right-0 top-full z-50 mt-1 flex min-w-[140px] flex-col overflow-hidden p-1">
                  <button
                    type="button"
                    onClick={handleArchive}
                    className="rounded px-3 py-2 text-left text-[12px] hover:bg-[color:var(--wf-tint)]"
                  >
                    📦 Archive
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded px-3 py-2 text-left text-[12px] text-red-600 hover:bg-[color:var(--wf-tint)]"
                  >
                    🗑 Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="flex gap-3">
        {stats.map(({ label, value, delta }) => (
          <div key={label} className="wf-box flex-1 p-3.5">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-[color:var(--wf-muted)]">
                {label}
              </span>
              <span className="font-[family-name:var(--font-hand)] text-[20px] font-bold leading-tight">
                {value}
              </span>
              {delta && (
                <span className="text-[10px] text-[color:var(--wf-accent)]">{delta}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* QR modal */}
      <QrCodeModal code={showQr ? code : null} onClose={() => setShowQr(false)} />

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="wf-box w-full max-w-md p-6">
            <h2 className="font-[family-name:var(--font-hand)] text-[18px] font-bold">
              Edit link
            </h2>

            {/* Slug */}
            <label className="mt-4 block">
              <span className="text-[10px] uppercase tracking-wider text-[color:var(--wf-muted)]">
                Slug
              </span>
              <input
                className={`wf-input mt-1 w-full font-[family-name:var(--font-mono)] text-[13px] ${slugError ? 'border-red-500' : ''}`}
                value={editSlug}
                onChange={(e) => { setEditSlug(e.target.value); setSlugError(''); }}
                placeholder="my-slug"
                onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
              />
              {slugError && (
                <span className="mt-1 block text-[11px] text-red-600">{slugError}</span>
              )}
            </label>

            {/* Destination URL */}
            <label className="mt-3 block">
              <span className="text-[10px] uppercase tracking-wider text-[color:var(--wf-muted)]">
                Destination URL
              </span>
              <input
                className="wf-input mt-1 w-full text-[13px]"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://example.com/new-url"
                onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                autoFocus
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="wf-btn-ghost px-4 py-1.5 text-[12px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={updateLink.isPending}
                className="wf-btn-solid px-4 py-1.5 text-[12px] disabled:opacity-50"
              >
                {updateLink.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="flex flex-1 gap-4">
        {/* Timeline chart */}
        <div className="wf-box flex flex-[1.7] flex-col gap-3 p-5">
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="font-[family-name:var(--font-hand)] text-[15px] font-bold">
                Clicks over time
              </span>
              <span className="text-[10px] text-[color:var(--wf-muted)]">
                last 30 days · daily granularity
              </span>
            </div>
            <div className="flex gap-1">
              <button type="button" className="wf-btn-ghost px-2.5 py-1 text-[11px]">24h</button>
              <button type="button" className="wf-btn-outline px-2.5 py-1 text-[11px]">7d</button>
              <button type="button" className="wf-btn-ghost px-2.5 py-1 text-[11px]">30d</button>
              <button type="button" className="wf-btn-ghost px-2.5 py-1 text-[11px]">All</button>
            </div>
          </div>
          {loadingTimeline ? <ChartSkeleton /> : <ClicksChart data={timeline} />}
          <div className="flex gap-5 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm bg-[#E5563C]" />
              Total clicks
            </span>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-1 flex-col gap-4">
          <div className="wf-box p-4">
            <div className="flex flex-col gap-2.5">
              <span className="font-[family-name:var(--font-hand)] text-[14px] font-bold">
                Top countries
              </span>
              {loadingCountry ? <ChartSkeleton small /> : <CountryChart data={countries} />}
            </div>
          </div>

          <div className="wf-box p-4">
            <div className="flex flex-col gap-2.5">
              <span className="font-[family-name:var(--font-hand)] text-[14px] font-bold">
                Browsers
              </span>
              {loadingBrowser ? <ChartSkeleton small /> : <BrowserChart data={browsers} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton({ small }: { small?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center text-[12px] text-[color:var(--wf-muted)] ${
        small ? 'h-[160px]' : 'h-[220px]'
      }`}
    >
      Loading…
    </div>
  );
}
