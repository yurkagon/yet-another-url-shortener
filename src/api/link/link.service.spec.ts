import { Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';

import { User } from '@/api/user/user.service';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { RedisService } from '@/infra/redis/redis.service';

import { CreateLinkDto } from './dto/create-link.dto';
import { GetLinksQueryDto } from './dto/get-links-query.dto';
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

type LinkCreateArgs = {
  data: {
    originalUrl: string;
    code: string;
    user?: { connect: { id: string } };
  };
};

type LinkFindUniqueArgs = {
  where: { code: string };
};

type LinkFindManyArgs = {
  where?: Record<string, unknown>;
  orderBy?: Record<string, unknown>;
  skip?: number;
  take?: number;
};

type LinkCountArgs = {
  where?: Record<string, unknown>;
};

type ClickCreateArgs = {
  data: {
    link: { connect: { id: string } };
    ipAddress: string;
    userAgent: string;
  };
};

type RetrieveArgs<T = unknown> = {
  key: string;
  ttl?: number;
  strategy: () => Promise<T> | T;
};

type LinkCache = { id: string; originalUrl: string; userId: string | null };

describe('LinkService', () => {
  let service: LinkService;
  let prismaService: {
    link: {
      create: jest.Mock<Promise<unknown>, [LinkCreateArgs]>;
      findUnique: jest.Mock<Promise<unknown>, [LinkFindUniqueArgs]>;
      findMany: jest.Mock<Promise<unknown>, [LinkFindManyArgs]>;
      count: jest.Mock<Promise<number>, [LinkCountArgs]>;
    };
    click: {
      create: jest.Mock<Promise<unknown>, [ClickCreateArgs]>;
    };
  };
  let configService: { getOrThrow: jest.Mock };
  let redisService: {
    retrieve: jest.Mock<Promise<unknown>, [RetrieveArgs]>;
  };

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
        create: jest.fn<Promise<unknown>, [LinkCreateArgs]>(),
        findUnique: jest.fn<Promise<unknown>, [LinkFindUniqueArgs]>(),
        findMany: jest.fn<Promise<unknown>, [LinkFindManyArgs]>(),
        count: jest.fn<Promise<number>, [LinkCountArgs]>(),
      },
      click: {
        create: jest.fn<Promise<unknown>, [ClickCreateArgs]>(),
      },
    };
    configService = {
      getOrThrow: jest.fn().mockReturnValue('https://short.test'),
    };
    redisService = {
      retrieve: jest.fn<Promise<unknown>, [RetrieveArgs]>(),
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
      id: 'link-1',
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

  it('creates a short link for an anonymous caller without owner', async () => {
    prismaService.link.create.mockResolvedValue({
      id: 'link-2',
      code: 'abc12345',
      originalUrl: dto.originalUrl,
      userId: null,
    });

    await expect(service.create(dto, null)).resolves.toBe('https://short.test/l/abc12345');

    const createArgs = prismaService.link.create.mock.calls[0][0];
    expect(createArgs.data).toEqual({
      originalUrl: dto.originalUrl,
      code: 'abc12345',
    });
    expect(createArgs.data.user).toBeUndefined();
  });

  it('finds a link by code', async () => {
    const link = { id: 'link-1', code: 'abc12345', originalUrl: dto.originalUrl };
    prismaService.link.findUnique.mockResolvedValue(link);

    await expect(service.findByCode('abc12345')).resolves.toBe(link);
    expect(prismaService.link.findUnique).toHaveBeenCalledWith({ where: { code: 'abc12345' } });
  });

  it('throws when a code does not exist', async () => {
    prismaService.link.findUnique.mockResolvedValue(null);

    await expect(service.findByCode('missing')).rejects.toThrow(NotFoundException);
  });

  it('resolves redirects through cache and records a click asynchronously', async () => {
    const linkCache: LinkCache = {
      id: 'link-1',
      originalUrl: dto.originalUrl,
      userId: user.id,
    };
    redisService.retrieve.mockImplementation(({ strategy }) => Promise.resolve(strategy()));
    prismaService.link.findUnique.mockResolvedValue({
      id: 'link-1',
      code: 'abc12345',
      originalUrl: dto.originalUrl,
      userId: user.id,
    });
    prismaService.click.create.mockResolvedValue({ id: 'click-1' });

    await expect(service.resolveRedirect('abc12345', '127.0.0.1', 'Mozilla/5.0')).resolves.toBe(
      dto.originalUrl,
    );

    const retrieveArgs = redisService.retrieve.mock.calls[0][0];
    expect(retrieveArgs.key).toBe('link:short-code:abc12345');
    expect(retrieveArgs.ttl).toBe(300);
    expect(retrieveArgs.strategy).toEqual(expect.any(Function));

    // Strategy should return { id, originalUrl, userId }
    const strategyResult = await retrieveArgs.strategy();
    expect(strategyResult).toEqual({
      id: 'link-1',
      originalUrl: dto.originalUrl,
      userId: user.id,
    });

    expect(prismaService.click.create).toHaveBeenCalledWith({
      data: {
        link: {
          connect: { id: linkCache.id },
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      },
    });
  });

  it('stores unknown when redirect IP is empty', async () => {
    const linkCache: LinkCache = {
      id: 'link-1',
      originalUrl: dto.originalUrl,
      userId: user.id,
    };
    redisService.retrieve.mockResolvedValue(linkCache);
    prismaService.click.create.mockResolvedValue({ id: 'click-1' });

    await service.resolveRedirect('abc12345', '', 'Mozilla/5.0');

    const clickCreateArgs = prismaService.click.create.mock.calls[0][0];
    expect(clickCreateArgs.data.ipAddress).toBe('unknown');
  });

  it('returns the redirect URL even when click recording fails', async () => {
    const linkCache: LinkCache = {
      id: 'link-1',
      originalUrl: dto.originalUrl,
      userId: user.id,
    };
    redisService.retrieve.mockResolvedValue(linkCache);
    prismaService.click.create.mockRejectedValue(new Error('database unavailable'));

    await expect(service.resolveRedirect('abc12345', '127.0.0.1', 'Mozilla/5.0')).resolves.toBe(
      dto.originalUrl,
    );
  });

  it('skips click recording for anonymous links (no owner)', async () => {
    const linkCache: LinkCache = {
      id: 'link-anon',
      originalUrl: dto.originalUrl,
      userId: null,
    };
    redisService.retrieve.mockResolvedValue(linkCache);

    await expect(service.resolveRedirect('anon1234', '127.0.0.1', 'Mozilla/5.0')).resolves.toBe(
      dto.originalUrl,
    );

    expect(prismaService.click.create).not.toHaveBeenCalled();
  });

  it('generates a QR code for an existing short link', async () => {
    const buffer = Buffer.from('qr');
    prismaService.link.findUnique.mockResolvedValue({
      id: 'link-1',
      code: 'abc12345',
      originalUrl: dto.originalUrl,
    });
    (QRCode.toBuffer as jest.Mock).mockResolvedValue(buffer);

    await expect(service.generateQrCode('abc12345')).resolves.toBe(buffer);

    expect(QRCode.toBuffer).toHaveBeenCalledWith('https://short.test/l/abc12345', {
      type: 'png',
      width: 300,
      margin: 1,
    });
  });

  describe('findAllByUser', () => {
    const mockLinks = [
      {
        id: 'link-1',
        code: 'aaaa1111',
        originalUrl: 'https://alpha.example.com',
        isArchived: false,
        userId: 'user-1',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
      {
        id: 'link-2',
        code: 'bbbb2222',
        originalUrl: 'https://beta.example.com',
        isArchived: false,
        userId: 'user-1',
        createdAt: new Date('2026-01-02'),
        updatedAt: new Date('2026-01-02'),
      },
      {
        id: 'link-3',
        code: 'cccc3333',
        originalUrl: 'https://gamma.example.com',
        isArchived: true,
        userId: 'user-1',
        createdAt: new Date('2026-01-03'),
        updatedAt: new Date('2026-01-03'),
      },
    ];

    it('returns paginated response with defaults', async () => {
      prismaService.link.findMany.mockResolvedValue(mockLinks);
      prismaService.link.count.mockResolvedValue(3);

      const result = await service.findAllByUser('user-1');

      expect(result).toEqual({
        data: mockLinks,
        total: 3,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(prismaService.link.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('applies search filter as OR condition', async () => {
      const query: GetLinksQueryDto = { search: 'alpha' };
      prismaService.link.findMany.mockResolvedValue([mockLinks[0]]);
      prismaService.link.count.mockResolvedValue(1);

      await service.findAllByUser('user-1', query);

      const findManyArgs = prismaService.link.findMany.mock.calls[0][0];
      expect(findManyArgs.where).toMatchObject({
        userId: 'user-1',
        OR: [
          { code: { contains: 'alpha', mode: 'insensitive' } },
          { originalUrl: { contains: 'alpha', mode: 'insensitive' } },
        ],
      });
    });

    it('applies isArchived filter for status=active', async () => {
      const query: GetLinksQueryDto = { status: 'active' };
      prismaService.link.findMany.mockResolvedValue(mockLinks.slice(0, 2));
      prismaService.link.count.mockResolvedValue(2);

      await service.findAllByUser('user-1', query);

      const findManyArgs = prismaService.link.findMany.mock.calls[0][0];
      expect(findManyArgs.where).toMatchObject({ userId: 'user-1', isArchived: false });
    });

    it('applies isArchived filter for status=archived', async () => {
      const query: GetLinksQueryDto = { status: 'archived' };
      prismaService.link.findMany.mockResolvedValue([mockLinks[2]]);
      prismaService.link.count.mockResolvedValue(1);

      await service.findAllByUser('user-1', query);

      const findManyArgs = prismaService.link.findMany.mock.calls[0][0];
      expect(findManyArgs.where).toMatchObject({ userId: 'user-1', isArchived: true });
    });

    it('computes correct skip and totalPages', async () => {
      const query: GetLinksQueryDto = { page: 2, limit: 2 };
      prismaService.link.findMany.mockResolvedValue([mockLinks[2]]);
      prismaService.link.count.mockResolvedValue(3);

      const result = await service.findAllByUser('user-1', query);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(2);
      expect(prismaService.link.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 2, take: 2 }),
      );
    });
  });

  describe('exportCsv', () => {
    it('returns a CSV string with header and rows', async () => {
      const now = new Date('2026-01-15T12:00:00.000Z');
      prismaService.link.findMany.mockResolvedValue([
        {
          id: 'link-1',
          code: 'abc12345',
          originalUrl: 'https://example.com',
          isArchived: false,
          createdAt: now,
        },
      ]);

      const csv = await service.exportCsv('user-1');

      expect(csv).toContain('id,code,original_url,is_archived,created_at');
      expect(csv).toContain('link-1,abc12345');
      expect(csv).toContain('false');
      expect(csv).toContain(now.toISOString());
    });

    it('quotes URLs with JSON.stringify to escape commas', async () => {
      const now = new Date('2026-01-15T12:00:00.000Z');
      prismaService.link.findMany.mockResolvedValue([
        {
          id: 'link-1',
          code: 'abc12345',
          originalUrl: 'https://example.com/path?a=1&b=2',
          isArchived: false,
          createdAt: now,
        },
      ]);

      const csv = await service.exportCsv('user-1');
      const rows = csv.split('\n');
      expect(rows.length).toBe(2); // header + 1 row
      expect(rows[1]).toContain('"https://example.com/path?a=1&b=2"');
    });
  });
});
