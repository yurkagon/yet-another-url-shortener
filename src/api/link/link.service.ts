import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@generated/prisma/client';
import { PrismaClientKnownRequestError } from '@generated/prisma/internal/prismaNamespace';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';

import { type User } from '@/api/user/user.service';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { RedisService } from '@/infra/redis/redis.service';

import { CreateLinkDto } from './dto/create-link.dto';
import { GetLinksQueryDto } from './dto/get-links-query.dto';
import { UpdateLinkDto } from './dto/update-link.dto';

type LinkCache = { id: string; originalUrl: string; userId: string | null };

@Injectable()
export class LinkService {
  private readonly logger = new Logger(LinkService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  public async create(createLinkDto: CreateLinkDto, user: User | null) {
    const appUrl = this.configService.getOrThrow<string>('APP_URL');
    const code = nanoid(8);

    const link = await this.prismaService.link.create({
      data: {
        originalUrl: createLinkDto.originalUrl,
        code,
        ...(user ? { user: { connect: { id: user.id } } } : {}),
      },
    });

    const shortUrl = `${appUrl}/l/${link.code}`;

    return shortUrl;
  }

  public async findAllByUser(userId: string, query: GetLinksQueryDto = {}) {
    const { search, page = 1, limit = 20, sortOrder = 'desc', status = 'all' } = query;

    const where: Prisma.LinkWhereInput = { userId };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { originalUrl: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') where.isArchived = false;
    if (status === 'archived') where.isArchived = true;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaService.link.findMany({
        where,
        orderBy: { createdAt: sortOrder },
        skip,
        take: limit,
        include: { _count: { select: { clicks: true } } },
      }),
      this.prismaService.link.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async findByCode(code: string) {
    const link = await this.prismaService.link.findUnique({
      where: { code },
    });
    if (!link) {
      throw new NotFoundException('Link not found');
    }

    return link;
  }

  public async findById(id: string) {
    const link = await this.prismaService.link.findUnique({
      where: { id },
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
    const link = await this.redisService.retrieve<LinkCache>({
      key: `link:short-code:${code}`,
      ttl: 60 * 5,
      strategy: async () => {
        const found = await this.findByCode(code);
        return { id: found.id, originalUrl: found.originalUrl, userId: found.userId };
      },
    });

    // Anonymous links (no owner) are not tracked.
    if (link.userId) {
      void this.prismaService.click
        .create({
          data: {
            link: {
              connect: { id: link.id },
            },
            ipAddress: ipAddress || 'unknown',
            userAgent,
          },
        })
        .catch((error: unknown) => {
          this.logger.warn('Failed to record click', error);
        });
    }

    return link.originalUrl;
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

  public async update(id: string, userId: string, dto: UpdateLinkDto) {
    const link = await this.findById(id);

    if (link.userId !== userId) {
      throw new NotFoundException('Link not found');
    }

    try {
      const updated = await this.prismaService.link.update({
        where: { id },
        data: dto,
      });

      // Invalidate Redis cache for the old code (covers both URL and code changes)
      if (dto.originalUrl || dto.code) {
        await this.redisService.del(`link:short-code:${link.code}`);
      }

      return updated;
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('This slug is already taken');
      }
      throw err;
    }
  }

  public async delete(id: string, userId: string) {
    const link = await this.findById(id);

    if (link.userId !== userId) {
      throw new NotFoundException('Link not found');
    }

    await this.prismaService.link.delete({ where: { id } });
  }

  public async exportCsv(userId: string): Promise<string> {
    const links = await this.prismaService.link.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'id,code,original_url,is_archived,created_at';
    const rows = links.map(
      (l) =>
        `${l.id},${l.code},${JSON.stringify(l.originalUrl)},${l.isArchived},${l.createdAt.toISOString()}`,
    );

    return [header, ...rows].join('\n');
  }
}
