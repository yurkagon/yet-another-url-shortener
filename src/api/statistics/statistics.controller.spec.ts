import { User } from '@/api/user/user.service';

import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

describe('StatisticsController', () => {
  let controller: StatisticsController;
  let statisticsService: jest.Mocked<
    Pick<
      StatisticsService,
      | 'getBrowserBreakdown'
      | 'getCountryBreakdown'
      | 'getDailyClicks'
      | 'getMyOverview'
      | 'getMyDailyClicks'
      | 'getMyCountryBreakdown'
      | 'getMyBrowserBreakdown'
      | 'getMyTopLinks'
    >
  >;

  const user: User = {
    id: 'user-1',
    email: 'ada@example.com',
    name: 'Ada',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  beforeEach(() => {
    statisticsService = {
      getBrowserBreakdown: jest.fn(),
      getCountryBreakdown: jest.fn(),
      getDailyClicks: jest.fn(),
      getMyOverview: jest.fn(),
      getMyDailyClicks: jest.fn(),
      getMyCountryBreakdown: jest.fn(),
      getMyBrowserBreakdown: jest.fn(),
      getMyTopLinks: jest.fn(),
    };

    controller = new StatisticsController(statisticsService as unknown as StatisticsService);
  });

  it('delegates browser breakdown requests', async () => {
    const breakdown = { Chrome: 2 };
    statisticsService.getBrowserBreakdown.mockResolvedValue(breakdown);

    await expect(controller.getBrowserBreakdown('abc12345')).resolves.toBe(breakdown);
    expect(statisticsService.getBrowserBreakdown).toHaveBeenCalledWith('abc12345');
  });

  it('delegates country breakdown requests', async () => {
    const breakdown = { US: 1, unknown: 1 };
    statisticsService.getCountryBreakdown.mockResolvedValue(breakdown);

    await expect(controller.getCountryBreakdown('abc12345')).resolves.toBe(breakdown);
    expect(statisticsService.getCountryBreakdown).toHaveBeenCalledWith('abc12345');
  });

  it('delegates daily click timeline requests', async () => {
    const timeline = [{ date: '2026-01-01', value: 3 }];
    statisticsService.getDailyClicks.mockResolvedValue(timeline);

    await expect(controller.getDailyClicks('abc12345')).resolves.toBe(timeline);
    expect(statisticsService.getDailyClicks).toHaveBeenCalledWith('abc12345');
  });

  describe('me/* aggregates', () => {
    it('delegates overview to service with the authenticated user id', async () => {
      const overview = {
        totalLinks: 2,
        activeLinks: 2,
        archivedLinks: 0,
        totalClicks: 5,
        clicksLast7Days: 2,
        avgClicksPerLink: 2.5,
      };
      statisticsService.getMyOverview.mockResolvedValue(overview);

      await expect(controller.getMyOverview(user)).resolves.toBe(overview);
      expect(statisticsService.getMyOverview).toHaveBeenCalledWith(user.id);
    });

    it('delegates the timeline aggregate', async () => {
      const timeline = [{ date: '2026-01-01', value: 1 }];
      statisticsService.getMyDailyClicks.mockResolvedValue(timeline);

      await expect(controller.getMyTimeline(user)).resolves.toBe(timeline);
      expect(statisticsService.getMyDailyClicks).toHaveBeenCalledWith(user.id);
    });

    it('delegates the country aggregate', async () => {
      const breakdown = { US: 3 };
      statisticsService.getMyCountryBreakdown.mockResolvedValue(breakdown);

      await expect(controller.getMyCountryBreakdown(user)).resolves.toBe(breakdown);
      expect(statisticsService.getMyCountryBreakdown).toHaveBeenCalledWith(user.id);
    });

    it('delegates the browser aggregate', async () => {
      const breakdown = { Chrome: 4 };
      statisticsService.getMyBrowserBreakdown.mockResolvedValue(breakdown);

      await expect(controller.getMyBrowserBreakdown(user)).resolves.toBe(breakdown);
      expect(statisticsService.getMyBrowserBreakdown).toHaveBeenCalledWith(user.id);
    });

    it('delegates the top-links aggregate', async () => {
      const top = [{ id: 'l-1', code: 'aaa', originalUrl: 'https://example.com/a', clicks: 7 }];
      statisticsService.getMyTopLinks.mockResolvedValue(top);

      await expect(controller.getMyTopLinks(user)).resolves.toBe(top);
      expect(statisticsService.getMyTopLinks).toHaveBeenCalledWith(user.id);
    });
  });
});
