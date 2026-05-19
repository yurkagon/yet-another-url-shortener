import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { type User } from '@/api/user/user.service';
import { Authorization } from '@/common/decorators/authorization.decorator';
import { AuthorizedUser } from '@/common/decorators/authorized-user.decorator';

import { CreateLinkDto } from './dto/create-link.dto';
import { LinkService } from './link.service';

@ApiTags('Link')
@Authorization()
@Controller('link')
export class LinkController {
  constructor(private readonly linkService: LinkService) {}

  @Post()
  public create(@Body() createLinkDto: CreateLinkDto, @AuthorizedUser() user: User) {
    return this.linkService.create(createLinkDto, user);
  }

  @Get()
  public getLinks(@AuthorizedUser("id") userId: string) {
    return this.linkService.getLinksByUser(userId);
  }

  @Delete(':code')
  @HttpCode(HttpStatus.NO_CONTENT)
  public delete(@Param('code') code: string, @AuthorizedUser('id') userId: string): Promise<void> {
    return this.linkService.delete(code, userId);
  }
}
