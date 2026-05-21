'use client';

import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

import { BrowserChart } from '@/components/statistics/browser-chart';
import { ClicksChart } from '@/components/statistics/clicks-chart';
import { CountryChart } from '@/components/statistics/country-chart';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <Badge variant="secondary" className="font-mono text-sm">
              {code}
            </Badge>
          </div>
          <a
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:underline flex items-center gap-1"
          >
            {shortUrl}
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalClicks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Browsers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{Object.keys(browsers).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{Object.keys(countries).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clicks over time</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTimeline ? (
            <ChartSkeleton />
          ) : (
            <ClicksChart data={timeline} />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Browsers</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBrowser ? <ChartSkeleton /> : <BrowserChart data={browsers} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Countries</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCountry ? <ChartSkeleton /> : <CountryChart data={countries} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm animate-pulse">
      Loading…
    </div>
  );
}
