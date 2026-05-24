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
      count: jest.Mock;
    };
    link: {
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaService = {
      click: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      link: {
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

  describe('getMyOverview', () => {
    it('returns zeros when the user has no links', async () => {
      prismaService.link.findMany.mockResolvedValue([]);

      await expect(service.getMyOverview('user-1')).resolves.toEqual({
        totalLinks: 0,
        activeLinks: 0,
        archivedLinks: 0,
        totalClicks: 0,
        clicksLast7Days: 0,
        avgClicksPerLink: 0,
      });
      expect(prismaService.click.count).not.toHaveBeenCalled();
    });

    it('aggregates totals across the user links', async () => {
      prismaService.link.findMany.mockResolvedValue([
        { id: 'l-1', isArchived: false },
        { id: 'l-2', isArchived: false },
        { id: 'l-3', isArchived: true },
      ]);
      prismaService.click.count
        .mockResolvedValueOnce(15) // totalClicks
        .mockResolvedValueOnce(7); // clicksLast7Days

      await expect(service.getMyOverview('user-1')).resolves.toEqual({
        totalLinks: 3,
        activeLinks: 2,
        archivedLinks: 1,
        totalClicks: 15,
        clicksLast7Days: 7,
        avgClicksPerLink: 5,
      });

      // Both counts filter on the user's link ids
      const totalCall = prismaService.click.count.mock.calls[0][0];
      expect(totalCall.where.linkId.in).toEqual(['l-1', 'l-2', 'l-3']);
      const last7Call = prismaService.click.count.mock.calls[1][0];
      expect(last7Call.where.linkId.in).toEqual(['l-1', 'l-2', 'l-3']);
      expect(last7Call.where.createdAt.gte).toBeInstanceOf(Date);
    });
  });

  describe('getMyDailyClicks', () => {
    it('queries clicks filtered by the user and aggregates them by day', async () => {
      prismaService.click.findMany.mockResolvedValue([
        { createdAt: new Date('2026-01-01T10:00:00.000Z') },
        { createdAt: new Date('2026-01-02T08:00:00.000Z') },
        { createdAt: new Date('2026-01-01T12:00:00.000Z') },
      ]);

      await expect(service.getMyDailyClicks('user-1')).resolves.toEqual([
        { date: '2026-01-01', value: 2 },
        { date: '2026-01-02', value: 1 },
      ]);

      const args = prismaService.click.findMany.mock.calls[0][0];
      expect(args.where.link).toEqual({ userId: 'user-1' });
      expect(args.where.createdAt.gte).toBeInstanceOf(Date);
    });
  });

  describe('getMyCountryBreakdown', () => {
    it('aggregates country codes across all user clicks', async () => {
      jest
        .mocked(geoip.lookup)
        .mockReturnValueOnce({ country: 'US', range: [0, 0] })
        .mockReturnValueOnce({ country: 'UA', range: [0, 0] });
      prismaService.click.findMany.mockResolvedValue([
        { ipAddress: '8.8.8.8' },
        { ipAddress: '91.198.174.192' },
      ]);

      await expect(service.getMyCountryBreakdown('user-1')).resolves.toEqual({
        US: 1,
        UA: 1,
      });
      expect(prismaService.click.findMany).toHaveBeenCalledWith({
        where: { link: { userId: 'user-1' } },
        select: { ipAddress: true },
      });
    });
  });

  describe('getMyBrowserBreakdown', () => {
    it('aggregates browsers across all user clicks', async () => {
      prismaService.click.findMany.mockResolvedValue([
        {
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        },
        {
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        },
      ]);

      await expect(service.getMyBrowserBreakdown('user-1')).resolves.toEqual({
        Chrome: 1,
        Safari: 1,
      });
      expect(prismaService.click.findMany).toHaveBeenCalledWith({
        where: { link: { userId: 'user-1' } },
        select: { userAgent: true },
      });
    });
  });

  describe('getMyTopLinks', () => {
    it('returns links sorted by click count with default limit', async () => {
      prismaService.link.findMany.mockResolvedValue([
        {
          id: 'l-1',
          code: 'aaa',
          originalUrl: 'https://example.com/a',
          _count: { clicks: 10 },
        },
        {
          id: 'l-2',
          code: 'bbb',
          originalUrl: 'https://example.com/b',
          _count: { clicks: 3 },
        },
      ]);

      await expect(service.getMyTopLinks('user-1')).resolves.toEqual([
        { id: 'l-1', code: 'aaa', originalUrl: 'https://example.com/a', clicks: 10 },
        { id: 'l-2', code: 'bbb', originalUrl: 'https://example.com/b', clicks: 3 },
      ]);

      const args = prismaService.link.findMany.mock.calls[0][0];
      expect(args.where).toEqual({ userId: 'user-1' });
      expect(args.take).toBe(5);
      expect(args.orderBy).toEqual({ clicks: { _count: 'desc' } });
    });
  });
});
