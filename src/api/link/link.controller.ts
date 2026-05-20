import { Body, Controller, Get, Param, Post, StreamableFile } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';

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

  @ApiOperation({ summary: 'Generate QR code for short link' })
  @ApiProduces('image/png')
  @ApiOkResponse({
    description: 'PNG QR code image',
    schema: { type: 'string', format: 'binary' },
  })
  @Get(':code/qr')
  public async generateQrCode(@Param('code') code: string) {
    const buffer = await this.linkService.generateQrCode(code);

    return new StreamableFile(buffer, {
      type: 'image/png',
      disposition: `inline; filename="link-${code}.png"`,
      length: buffer.length,
    });
  }
}
