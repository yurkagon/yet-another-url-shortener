import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Authorization } from '@/common/decorators/authorization.decorator';

import { StatisticsService } from './statistics.service';

@ApiTags('Statistics')
@Authorization()
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('link/:code/browser')
  public getBrowserBreakdown(@Param('code') code: string) {
    return this.statisticsService.getBrowserBreakdown(code);
  }

  @Get('link/:code/country')
  public getCountryBreakdown(@Param('code') code: string) {
    return this.statisticsService.getCountryBreakdown(code);
  }

  @Get('link/:code/timeline')
  public getDailyClicks(@Param('code') code: string) {
    return this.statisticsService.getDailyClicks(code);
  }
}
