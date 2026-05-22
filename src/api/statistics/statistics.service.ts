import { Injectable } from '@nestjs/common';
import geoip from 'geoip-country';
import { UAParser } from 'ua-parser-js';

import { PrismaService } from '@/infra/prisma/prisma.service';

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

  public async getBrowserBreakdown(code: string) {
    const clicks = await this.findClicksByCode(code);

    const breakdown: Record<string, number> = {};

    for (const click of clicks) {
      const browser = this.parseBrowserName(click.userAgent);
      breakdown[browser] = (breakdown[browser] ?? 0) + 1;
    }

    return breakdown;
  }

  public async getCountryBreakdown(code: string) {
    const clicks = await this.findClicksByCode(code);

    const breakdown: Record<string, number> = {};

    for (const click of clicks) {
      const country = this.parseCountryCode(click.ipAddress);
      breakdown[country] = (breakdown[country] ?? 0) + 1;
    }

    return breakdown;
  }

  public async getDailyClicks(code: string) {
    const clicks = await this.findClicksByCode(code);

    const counts: Record<string, number> = {};
    clicks.forEach((click) => {
      const day = click.createdAt.toISOString().split('T')[0];
      counts[day] = (counts[day] ?? 0) + 1;
    });

    return Object.entries(counts)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
