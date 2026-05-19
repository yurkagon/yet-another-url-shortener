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
    const code = nanoid(8);

    const appUrl = this.configService.getOrThrow<string>('APP_URL');

    const link = await this.prismaService.link.create({
      data: {
        originalUrl: createLinkDto.originalUrl,
        code,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    const shortUrl = `${appUrl}/l/${link.code}`;

    return shortUrl;
  }

  public async getLinksByUser(userId: string) {
    const links = await this.prismaService.link.findMany({
      where: {
        userId,
      },
    });

    return links;
  }

  public async findByCode(code: string) {
    const link = await this.prismaService.link.findUnique({
      where: {
        code,
      },
    });
    if (!link) {
      throw new NotFoundException('Link not found');
    }

    return link;
  }

  public async delete(code: string, userId: string): Promise<void> {
    const link = await this.findByCode(code);

    if (link.userId !== userId) {
      throw new NotFoundException('Link not found');
    }

    await this.prismaService.link.delete({
      where: { code },
    });
  }

  public async resolveRedirect(code: string, ipAddress: string, userAgent: string): Promise<string> {
    const link = await this.findByCode(code);

    void this.prismaService.click
      .create({
        data: {
          link: {
            connect: {
              code: link.code,
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
