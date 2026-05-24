import { Injectable } from '@nestjs/common';
import geoip from 'geoip-country';
import { UAParser } from 'ua-parser-js';

import { PrismaService } from '@/infra/prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface MyOverview {
  totalLinks: number;
  activeLinks: number;
  archivedLinks: number;
  totalClicks: number;
  clicksLast7Days: number;
  avgClicksPerLink: number;
}

export interface TopLink {
  id: string;
  code: string;
  originalUrl: string;
  clicks: number;
}

@Injectable()
export class StatisticsService {
  constructor(private readonly prismaService: PrismaService) {}

  private async findClicksByCode(code: string) {
    return this.prismaService.click.findMany({
      where: { link: { code } },
    });
  }

  private parseBrowserName(userAgent: string) {
    const parser = new UAParser(userAgent);

    return parser.getBrowser().name ?? 'unknown';
  }

  private parseCountryCode(ipAddress: string) {
    const country = geoip.lookup(ipAddress);

    return country?.country ?? 'unknown';
  }

  private aggregateBrowsers(clicks: { userAgent: string }[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const click of clicks) {
      const browser = this.parseBrowserName(click.userAgent);
      breakdown[browser] = (breakdown[browser] ?? 0) + 1;
    }
    return breakdown;
  }

  private aggregateCountries(clicks: { ipAddress: string }[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const click of clicks) {
      const country = this.parseCountryCode(click.ipAddress);
      breakdown[country] = (breakdown[country] ?? 0) + 1;
    }
    return breakdown;
  }

  private aggregateDaily(clicks: { createdAt: Date }[]) {
    const counts: Record<string, number> = {};
    for (const click of clicks) {
      const day = click.createdAt.toISOString().split('T')[0];
      counts[day] = (counts[day] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  public async getBrowserBreakdown(code: string) {
    const clicks = await this.findClicksByCode(code);
    return this.aggregateBrowsers(clicks);
  }

  public async getCountryBreakdown(code: string) {
    const clicks = await this.findClicksByCode(code);
    return this.aggregateCountries(clicks);
  }

  public async getDailyClicks(code: string) {
    const clicks = await this.findClicksByCode(code);
    return this.aggregateDaily(clicks);
  }

  // ── Aggregates across all of the user's links ─────────────────────────────

  public async getMyOverview(userId: string): Promise<MyOverview> {
    const links = await this.prismaService.link.findMany({
      where: { userId },
      select: { id: true, isArchived: true },
    });

    if (links.length === 0) {
      return {
        totalLinks: 0,
        activeLinks: 0,
        archivedLinks: 0,
        totalClicks: 0,
        clicksLast7Days: 0,
        avgClicksPerLink: 0,
      };
    }

    const linkIds = links.map((l) => l.id);
    const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);

    const [totalClicks, clicksLast7Days] = await Promise.all([
      this.prismaService.click.count({ where: { linkId: { in: linkIds } } }),
      this.prismaService.click.count({
        where: { linkId: { in: linkIds }, createdAt: { gte: sevenDaysAgo } },
      }),
    ]);

    const activeLinks = links.filter((l) => !l.isArchived).length;

    return {
      totalLinks: links.length,
      activeLinks,
      archivedLinks: links.length - activeLinks,
      totalClicks,
      clicksLast7Days,
      avgClicksPerLink: Math.round((totalClicks / links.length) * 10) / 10,
    };
  }

  public async getMyDailyClicks(userId: string, days = 30) {
    const since = new Date(Date.now() - days * DAY_MS);
    const clicks = await this.prismaService.click.findMany({
      where: { link: { userId }, createdAt: { gte: since } },
      select: { createdAt: true },
    });
    return this.aggregateDaily(clicks);
  }

  public async getMyCountryBreakdown(userId: string) {
    const clicks = await this.prismaService.click.findMany({
      where: { link: { userId } },
      select: { ipAddress: true },
    });
    return this.aggregateCountries(clicks);
  }

  public async getMyBrowserBreakdown(userId: string) {
    const clicks = await this.prismaService.click.findMany({
      where: { link: { userId } },
      select: { userAgent: true },
    });
    return this.aggregateBrowsers(clicks);
  }

  public async getMyTopLinks(userId: string, limit = 5): Promise<TopLink[]> {
    const links = await this.prismaService.link.findMany({
      where: { userId },
      orderBy: { clicks: { _count: 'desc' } },
      take: limit,
      select: {
        id: true,
        code: true,
        originalUrl: true,
        _count: { select: { clicks: true } },
      },
    });

    return links.map((l) => ({
      id: l.id,
      code: l.code,
      originalUrl: l.originalUrl,
      clicks: l._count.clicks,
    }));
  }
}
