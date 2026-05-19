import { Controller, Get, HttpStatus, Param, Res, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';

import { ClientIp, UserAgent } from '@/common/decorators/http.decorator';

import { LinkService } from './link.service';

@ApiExcludeController()
@Controller({ path: 'l', version: VERSION_NEUTRAL })
export class LinkRedirectController {
  constructor(private readonly linkService: LinkService) {}

  @Get(':shortCode')
  public async redirect(
    @Param('shortCode') shortCode: string,
    @ClientIp() ipAddress: string,
    @UserAgent() userAgent: string,
    @Res() res: Response,
  ): Promise<void> {
    const originalUrl = await this.linkService.resolveRedirect(shortCode, ipAddress, userAgent);
  
    res.redirect(HttpStatus.FOUND, originalUrl);
  }
}
