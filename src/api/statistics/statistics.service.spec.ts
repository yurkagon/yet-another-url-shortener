import geoip from 'geoip-country';

import { PrismaService } from '@/infra/prisma/prisma.service';

import { StatisticsService } from './statistics.service';

jest.mock('geoip-country', () => ({
  __esModule: true,
  default: {
    lookup: jest.fn(),
  },
}));

describe('StatisticsService', () => {
  let service: StatisticsService;
  let prismaService: {
    click: {
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaService = {
      click: {
        findMany: jest.fn(),
      },
    };

    service = new StatisticsService(prismaService as unknown as PrismaService);
    jest.mocked(geoip.lookup).mockReset();
  });

  it('groups clicks by browser name', async () => {
    prismaService.click.findMany.mockResolvedValue([
      {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      },
      {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      },
      {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      },
    ]);

    await expect(service.getBrowserBreakdown('abc12345')).resolves.toEqual({
      Chrome: 2,
      Safari: 1,
    });
    expect(prismaService.click.findMany).toHaveBeenCalledWith({
      where: { link: { code: 'abc12345' } },
    });
  });

  it('uses unknown for clicks without a browser name', async () => {
    prismaService.click.findMany.mockResolvedValue([{ userAgent: '' }]);

    await expect(service.getBrowserBreakdown('abc12345')).resolves.toEqual({ unknown: 1 });
  });

  it('groups clicks by country code', async () => {
    jest
      .mocked(geoip.lookup)
      .mockReturnValueOnce({ country: 'US', range: [0, 0] })
      .mockReturnValueOnce({ country: 'UA', range: [0, 0] })
      .mockReturnValueOnce({ country: 'US', range: [0, 0] });
    prismaService.click.findMany.mockResolvedValue([
      { ipAddress: '8.8.8.8' },
      { ipAddress: '91.198.174.192' },
      { ipAddress: '1.1.1.1' },
    ]);

    await expect(service.getCountryBreakdown('abc12345')).resolves.toEqual({
      US: 2,
      UA: 1,
    });
  });

  it('uses unknown when geo lookup misses', async () => {
    jest.mocked(geoip.lookup).mockReturnValue(null);
    prismaService.click.findMany.mockResolvedValue([{ ipAddress: 'unknown' }]);

    await expect(service.getCountryBreakdown('abc12345')).resolves.toEqual({ unknown: 1 });
  });

  it('groups daily clicks and sorts them by date', async () => {
    prismaService.click.findMany.mockResolvedValue([
      { createdAt: new Date('2026-01-02T10:00:00.000Z') },
      { createdAt: new Date('2026-01-01T08:00:00.000Z') },
      { createdAt: new Date('2026-01-02T12:00:00.000Z') },
    ]);

    await expect(service.getDailyClicks('abc12345')).resolves.toEqual([
      { date: '2026-01-01', value: 1 },
      { date: '2026-01-02', value: 2 },
    ]);
  });
});
