import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';

import { ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';

import { type User } from '@/api/user/user.service';
import { Authorization } from '@/common/decorators/authorization.decorator';
import { AuthorizedUser } from '@/common/decorators/authorized-user.decorator';

import { CreateLinkDto } from './dto/create-link.dto';
import { GetLinksQueryDto } from './dto/get-links-query.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { LinkService } from './link.service';

@ApiTags('Link')
@Authorization()
@Controller('link')
export class LinkController {
  constructor(private readonly linkService: LinkService) {}

  @Get()
  public findAll(@AuthorizedUser() user: User, @Query() query: GetLinksQueryDto) {
    return this.linkService.findAllByUser(user.id, query);
  }

  @Post()
  public create(@Body() createLinkDto: CreateLinkDto, @AuthorizedUser() user: User) {
    return this.linkService.create(createLinkDto, user);
  }

  // ── Mutations by id ─────────────────────────────────────────────────────────

  @Patch(':id')
  public update(@Param('id') id: string, @Body() dto: UpdateLinkDto, @AuthorizedUser() user: User) {
    return this.linkService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  public async remove(@Param('id') id: string, @AuthorizedUser() user: User) {
    await this.linkService.delete(id, user.id);
  }

  // ── Read-only by code ────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Export all user links as CSV' })
  @ApiProduces('text/csv')
  @Get('export/csv')
  public async exportCsv(@AuthorizedUser() user: User, @Res() res: Response) {
    const csv = await this.linkService.exportCsv(user.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="links.csv"');
    res.send(csv);
  }

  @Get(':code')
  public findOne(@Param('code') code: string) {
    return this.linkService.findByCode(code);
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
