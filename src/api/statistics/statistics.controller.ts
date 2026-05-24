import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { type User } from '@/api/user/user.service';
import { Authorization } from '@/common/decorators/authorization.decorator';
import { AuthorizedUser } from '@/common/decorators/authorized-user.decorator';

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

  // ── Aggregates across the authenticated user's links ──────────────────────

  @Get('me/overview')
  public getMyOverview(@AuthorizedUser() user: User) {
    return this.statisticsService.getMyOverview(user.id);
  }

  @Get('me/timeline')
  public getMyTimeline(@AuthorizedUser() user: User) {
    return this.statisticsService.getMyDailyClicks(user.id);
  }

  @Get('me/country')
  public getMyCountryBreakdown(@AuthorizedUser() user: User) {
    return this.statisticsService.getMyCountryBreakdown(user.id);
  }

  @Get('me/browser')
  public getMyBrowserBreakdown(@AuthorizedUser() user: User) {
    return this.statisticsService.getMyBrowserBreakdown(user.id);
  }

  @Get('me/top-links')
  public getMyTopLinks(@AuthorizedUser() user: User) {
    return this.statisticsService.getMyTopLinks(user.id);
  }
}
