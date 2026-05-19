import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
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

  @Delete(':shortCode')
  @HttpCode(HttpStatus.NO_CONTENT)
  public delete(@Param('shortCode') shortCode: string, @AuthorizedUser() user: User): Promise<void> {
    return this.linkService.delete(shortCode, user);
  }
}
