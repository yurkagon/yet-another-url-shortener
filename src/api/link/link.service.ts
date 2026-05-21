import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';

import { type User } from '@/api/user/user.service';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { RedisService } from '@/infra/redis/redis.service';

import { CreateLinkDto } from './dto/create-link.dto';

@Injectable()
export class LinkService {
  private readonly logger = new Logger(LinkService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  public async create(createLinkDto: CreateLinkDto, user: User) {
    const appUrl = this.configService.getOrThrow<string>('APP_URL');
    const code = nanoid(8);

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

  public async findAllByUser(userId: string) {
    return this.prismaService.link.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
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

  public async resolveRedirect(
    code: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<string> {
    const originalUrl = await this.redisService.retrieve<string>({
      key: `link:short-code:${code}`,
      ttl: 60 * 5,
      strategy: async () => {
        const link = await this.findByCode(code);
        return link.originalUrl;
      },
    });

    void this.prismaService.click
      .create({
        data: {
          link: {
            connect: { code },
          },
          ipAddress: ipAddress || 'unknown',
          userAgent,
        },
      })
      .catch((error: unknown) => {
        this.logger.warn('Failed to record click', error);
      });

    return originalUrl;
  }

  public async generateQrCode(code: string): Promise<Buffer> {
    await this.findByCode(code);

    const appUrl = this.configService.getOrThrow<string>('APP_URL');
    const shortUrl = `${appUrl}/l/${code}`;

    return QRCode.toBuffer(shortUrl, {
      type: 'png',
      width: 300,
      margin: 1,
    });
  }
}
