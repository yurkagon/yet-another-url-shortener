import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

describe('StatisticsController', () => {
  let controller: StatisticsController;
  let statisticsService: jest.Mocked<
    Pick<StatisticsService, 'getBrowserBreakdown' | 'getCountryBreakdown' | 'getDailyClicks'>
  >;

  beforeEach(() => {
    statisticsService = {
      getBrowserBreakdown: jest.fn(),
      getCountryBreakdown: jest.fn(),
      getDailyClicks: jest.fn(),
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
});
