'use client';

import Link from 'next/link';
import { use } from 'react';
import { toast } from 'sonner';

import { BrowserChart } from '@/components/statistics/browser-chart';
import { ClicksChart } from '@/components/statistics/clicks-chart';
import { CountryChart } from '@/components/statistics/country-chart';
import { QrPlaceholder } from '@/components/wf/qr-placeholder';
import { formatShortLinkLabel } from '@/lib/brand';
import { useBrowserStats, useCountryStats, useTimelineStats } from '@/hooks/use-statistics';

interface Props {
  params: Promise<{ code: string }>;
}

const APP_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') ?? 'http://localhost:3000';

export default function AnalyticsPage({ params }: Props) {
  const { code } = use(params);
  const shortUrl = `${APP_URL}/l/${code}`;

  const { data: timeline = [], isLoading: loadingTimeline } = useTimelineStats(code);
  const { data: browsers = {}, isLoading: loadingBrowser } = useBrowserStats(code);
  const { data: countries = {}, isLoading: loadingCountry } = useCountryStats(code);

  const totalClicks = timeline.reduce((sum, d) => sum + d.value, 0);
  const browserCount = Object.keys(browsers).length;
  const countryCount = Object.keys(countries).length;
  const topCountry =
    Object.entries(countries).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const topBrowser =
    Object.entries(browsers).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  const copy = () => {
    void navigator.clipboard.writeText(shortUrl);
    toast.success('Copied!');
  };

  const stats: { label: string; value: string; delta?: string }[] = [
    { label: 'Clicks', value: totalClicks.toLocaleString(), delta: '+12%' },
    { label: 'Unique', value: '—', delta: '' },
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
            <button type="button" className="wf-btn-outline px-3 py-1.5 text-[12px]">
              ⬇ QR
            </button>
            <button type="button" className="wf-btn-outline px-3 py-1.5 text-[12px]">
              ✎ Edit
            </button>
            <button type="button" className="wf-btn-outline px-3 py-1.5 text-[12px]">
              ⋯
            </button>
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
              <button type="button" className="wf-btn-ghost px-2.5 py-1 text-[11px]">
                24h
              </button>
              <button type="button" className="wf-btn-outline px-2.5 py-1 text-[11px]">
                7d
              </button>
              <button type="button" className="wf-btn-ghost px-2.5 py-1 text-[11px]">
                30d
              </button>
              <button type="button" className="wf-btn-ghost px-2.5 py-1 text-[11px]">
                All
              </button>
            </div>
          </div>
          {loadingTimeline ? <ChartSkeleton /> : <ClicksChart data={timeline} />}
          <div className="flex gap-5 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm bg-foreground" />
              Total clicks
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm bg-[color:var(--wf-accent)]" />
              Unique visitors
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
              {loadingCountry ? (
                <ChartSkeleton small />
              ) : (
                <CountryChart data={countries} />
              )}
            </div>
          </div>

          <div className="wf-box p-4">
            <div className="flex flex-col gap-2.5">
              <span className="font-[family-name:var(--font-hand)] text-[14px] font-bold">
                Browsers
              </span>
              {loadingBrowser ? (
                <ChartSkeleton small />
              ) : (
                <BrowserChart data={browsers} />
              )}
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
