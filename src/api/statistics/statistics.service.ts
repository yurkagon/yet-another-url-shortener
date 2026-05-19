import { Injectable } from '@nestjs/common';
import { UAParser } from 'ua-parser-js';

import { PrismaService } from '@/infra/prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private readonly prismaService: PrismaService) {}

  private async getClicksByLink(code: string) {
    const clicks = await this.prismaService.click.findMany({
      where: {
        code,
      },
    });

    return clicks;
  }

  private getBrowserByUserAgent(userAgent: string) {
    const parser = new UAParser(userAgent);

    return parser.getBrowser().name ?? 'unknown';
  }

  public async getBrowserStats(code: string) {
    const clicks = await this.getClicksByLink(code);

    const browsers: Record<string, number> = {};

    for (const click of clicks) {
      const browser = this.getBrowserByUserAgent(click.userAgent);

      if (browsers[browser]) {
        browsers[browser]++;
      } else {
        browsers[browser] = 1;
      }
    }

    return browsers;
  }
}
