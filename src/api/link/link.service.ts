import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';

import { type User } from '@/api/user/user.service';
import { PrismaService } from '@/infra/prisma/prisma.service';

import { CreateLinkDto } from './dto/create-link.dto';

@Injectable()
export class LinkService {
  private readonly logger = new Logger(LinkService.name);

  constructor(private readonly prismaService: PrismaService, private readonly configService: ConfigService) {}

  public async create(createLinkDto: CreateLinkDto, user: User) {
    const shortCode = nanoid(8);

    const appUrl = this.configService.getOrThrow<string>('APP_URL');

    const link = await this.prismaService.link.create({
      data: {
        originalUrl: createLinkDto.originalUrl,
        shortCode,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    const shortUrl = `${appUrl}/l/${shortCode}`;

    return shortUrl;
  }

  public async findByShortCode(shortCode: string) {
    const link = await this.prismaService.link.findUnique({
      where: {
        shortCode,
      },
    });
    if (!link) {
      throw new NotFoundException('Link not found');
    }

    return link;
  }

  public async resolveRedirect(
    shortCode: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<string> {
    const link = await this.findByShortCode(shortCode);

    void this.prismaService.click
      .create({
        data: {
          link: {
            connect: {
              id: link.id,
            },
          },
          ipAddress: ipAddress || 'unknown',
          userAgent,
        },
      })
      .catch((error: unknown) => {
        this.logger.warn('Failed to record click', error);
      });

    return link.originalUrl;
  }
}
