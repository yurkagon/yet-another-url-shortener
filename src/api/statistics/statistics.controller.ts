import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Authorization } from '@/common/decorators/authorization.decorator';

import { StatisticsService } from './statistics.service';

@ApiTags('Statistics')
@Authorization()
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('link/:code')
  public getBrowserStats(@Param('code') code: string) {
    return this.statisticsService.getBrowserStats(code);
  }
}
