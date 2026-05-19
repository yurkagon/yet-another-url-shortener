import { Body, Controller, Post } from '@nestjs/common';
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
}
