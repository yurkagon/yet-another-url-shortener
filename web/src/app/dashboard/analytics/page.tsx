'use client';

import Link from 'next/link';

import { BrowserChart } from '@/components/statistics/browser-chart';
import { ClicksChart } from '@/components/statistics/clicks-chart';
import { CountryChart } from '@/components/statistics/country-chart';
import {
  useMyBrowserStats,
  useMyCountryStats,
  useMyOverview,
  useMyTimeline,
  useMyTopLinks,
} from '@/hooks/use-statistics';
import { formatShortLinkLabel } from '@/lib/brand';

export default function AnalyticsPage() {
  const { data: overview, isLoading: loadingOverview } = useMyOverview();
  const { data: timeline = [], isLoading: loadingTimeline } = useMyTimeline();
  const { data: countries = {}, isLoading: loadingCountry } = useMyCountryStats();
  const { data: browsers = {}, isLoading: loadingBrowser } = useMyBrowserStats();
  const { data: topLinks = [], isLoading: loadingTop } = useMyTopLinks();

  const topCountry =
    Object.entries(countries).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const countryCount = Object.keys(countries).length;

  const stats: { label: string; value: string; delta?: string }[] = [
    {
      label: 'Total clicks',
      value: loadingOverview ? '…' : (overview?.totalClicks ?? 0).toLocaleString(),
      delta: loadingOverview
        ? undefined
        : `${(overview?.clicksLast7Days ?? 0).toLocaleString()} last 7d`,
    },
    {
      label: 'Total links',
      value: loadingOverview ? '…' : (overview?.totalLinks ?? 0).toLocaleString(),
      delta: loadingOverview
        ? undefined
        : `${overview?.activeLinks ?? 0} active · ${overview?.archivedLinks ?? 0} archived`,
    },
    {
      label: 'Avg clicks / link',
      value: loadingOverview ? '…' : (overview?.avgClicksPerLink ?? 0).toString(),
    },
    {
      label: 'Top country',
      value: loadingCountry ? '…' : topCountry,
      delta: loadingCountry ? undefined : `${countryCount} total`,
    },
  ];

  return (
    <div className="flex h-full flex-col gap-5 p-7">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-[family-name:var(--font-hand)] text-[26px] font-bold">
            Analytics
          </h1>
          <span className="text-[11px] text-[color:var(--wf-muted)]">
            aggregate stats across all your links
          </span>
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
      <div className="flex gap-4">
        {/* Timeline chart + top links */}
        <div className="wf-box flex flex-[1.7] flex-col gap-3 p-5">
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="font-[family-name:var(--font-hand)] text-[15px] font-bold">
                Clicks over time
              </span>
              <span className="text-[10px] text-[color:var(--wf-muted)]">
                last 30 days · daily granularity · all links
              </span>
            </div>
          </div>
          {loadingTimeline ? <ChartSkeleton /> : <ClicksChart data={timeline} />}
          <div className="flex gap-5 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm bg-[#E5563C]" />
              Total clicks
            </span>
          </div>

          {/* Top links — nested under the chart */}
          <div className="mt-2 flex flex-col gap-2 border-t border-[color:var(--wf-line)] pt-4">
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="font-[family-name:var(--font-hand)] text-[14px] font-bold">
                  Top performing links
                </span>
                <span className="text-[10px] text-[color:var(--wf-muted)]">
                  your 5 most-clicked short links
                </span>
              </div>
            </div>

            {loadingTop ? (
              <div className="flex h-[120px] items-center justify-center text-[12px] text-[color:var(--wf-muted)]">
                Loading…
              </div>
            ) : topLinks.length === 0 ? (
              <div className="flex h-[120px] items-center justify-center text-[12px] text-[color:var(--wf-muted)]">
                No links yet. Create one from the dashboard to see stats here.
              </div>
            ) : (
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-[color:var(--wf-line)] text-[10px] uppercase tracking-wider text-[color:var(--wf-muted)]">
                    <th className="py-2 pr-3 font-normal">Short link</th>
                    <th className="py-2 pr-3 font-normal">Destination</th>
                    <th className="py-2 text-right font-normal">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {topLinks.map((link) => (
                    <tr
                      key={link.id}
                      className="border-b border-[color:var(--wf-line)] last:border-b-0"
                    >
                      <td className="py-2 pr-3">
                        <Link
                          href={`/dashboard/${link.code}`}
                          className="font-[family-name:var(--font-mono)] text-[color:var(--wf-accent)] hover:underline"
                        >
                          {formatShortLinkLabel(link.code)}
                        </Link>
                      </td>
                      <td className="max-w-[420px] truncate py-2 pr-3 text-[color:var(--wf-muted)]">
                        {link.originalUrl}
                      </td>
                      <td className="py-2 text-right font-[family-name:var(--font-hand)] text-[14px] font-bold">
                        {link.clicks.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
