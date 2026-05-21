import { Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';

import { User } from '@/api/user/user.service';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { RedisService } from '@/infra/redis/redis.service';

import { CreateLinkDto } from './dto/create-link.dto';
import { LinkService } from './link.service';

jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
}));

jest.mock('qrcode', () => ({
  __esModule: true,
  default: {
    toBuffer: jest.fn(),
  },
}));

describe('LinkService', () => {
  let service: LinkService;
  let prismaService: {
    link: {
      create: jest.Mock;
      findUnique: jest.Mock;
    };
    click: {
      create: jest.Mock;
    };
  };
  let configService: { getOrThrow: jest.Mock };
  let redisService: jest.Mocked<Pick<RedisService, 'retrieve'>>;

  const dto: CreateLinkDto = { originalUrl: 'https://example.com/article' };
  const user: User = {
    id: 'user-1',
    email: 'ada@example.com',
    name: 'Ada',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    prismaService = {
      link: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      click: {
        create: jest.fn(),
      },
    };
    configService = {
      getOrThrow: jest.fn().mockReturnValue('https://short.test'),
    };
    redisService = {
      retrieve: jest.fn(),
    };

    service = new LinkService(
      prismaService as unknown as PrismaService,
      configService as unknown as ConfigService,
      redisService as unknown as RedisService,
    );

    jest.mocked(nanoid).mockReturnValue('abc12345');
    (QRCode.toBuffer as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a short link for the authenticated user', async () => {
    prismaService.link.create.mockResolvedValue({
      code: 'abc12345',
      originalUrl: dto.originalUrl,
      userId: user.id,
    });

    await expect(service.create(dto, user)).resolves.toBe('https://short.test/l/abc12345');

    expect(configService.getOrThrow).toHaveBeenCalledWith('APP_URL');
    expect(nanoid).toHaveBeenCalledWith(8);
    expect(prismaService.link.create).toHaveBeenCalledWith({
      data: {
        originalUrl: dto.originalUrl,
        code: 'abc12345',
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });
  });

  it('finds a link by code', async () => {
    const link = { code: 'abc12345', originalUrl: dto.originalUrl };
    prismaService.link.findUnique.mockResolvedValue(link);

    await expect(service.findByCode('abc12345')).resolves.toBe(link);
    expect(prismaService.link.findUnique).toHaveBeenCalledWith({ where: { code: 'abc12345' } });
  });

  it('throws when a code does not exist', async () => {
    prismaService.link.findUnique.mockResolvedValue(null);

    await expect(service.findByCode('missing')).rejects.toThrow(NotFoundException);
  });

  it('resolves redirects through cache and records a click asynchronously', async () => {
    redisService.retrieve.mockImplementation(async ({ strategy }) => strategy());
    prismaService.link.findUnique.mockResolvedValue({
      code: 'abc12345',
      originalUrl: dto.originalUrl,
    });
    prismaService.click.create.mockResolvedValue({ id: 'click-1' });

    await expect(service.resolveRedirect('abc12345', '127.0.0.1', 'Mozilla/5.0')).resolves.toBe(
      dto.originalUrl,
    );

    expect(redisService.retrieve).toHaveBeenCalledWith({
      key: 'link:short-code:abc12345',
      ttl: 300,
      strategy: expect.any(Function),
    });
    expect(prismaService.click.create).toHaveBeenCalledWith({
      data: {
        link: {
          connect: { code: 'abc12345' },
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      },
    });
  });

  it('stores unknown when redirect IP is empty', async () => {
    redisService.retrieve.mockResolvedValue(dto.originalUrl);
    prismaService.click.create.mockResolvedValue({ id: 'click-1' });

    await service.resolveRedirect('abc12345', '', 'Mozilla/5.0');

    expect(prismaService.click.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ipAddress: 'unknown' }),
      }),
    );
  });

  it('returns the redirect URL even when click recording fails', async () => {
    redisService.retrieve.mockResolvedValue(dto.originalUrl);
    prismaService.click.create.mockRejectedValue(new Error('database unavailable'));

    await expect(service.resolveRedirect('abc12345', '127.0.0.1', 'Mozilla/5.0')).resolves.toBe(
      dto.originalUrl,
    );
  });

  it('generates a QR code for an existing short link', async () => {
    const buffer = Buffer.from('qr');
    prismaService.link.findUnique.mockResolvedValue({ code: 'abc12345', originalUrl: dto.originalUrl });
    (QRCode.toBuffer as jest.Mock).mockResolvedValue(buffer);

    await expect(service.generateQrCode('abc12345')).resolves.toBe(buffer);

    expect(QRCode.toBuffer).toHaveBeenCalledWith('https://short.test/l/abc12345', {
      type: 'png',
      width: 300,
      margin: 1,
    });
  });
});
