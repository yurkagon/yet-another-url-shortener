import { ConflictException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/infra/prisma/prisma.service';
import { RedisService } from '@/infra/redis/redis.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let prismaService: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let redisService: {
    retrieve: jest.Mock;
  };

  const dto: CreateUserDto = {
    name: 'Ada',
    email: 'ada@example.com',
    password: 'hashed-password',
  };
  const user = {
    id: 'user-1',
    name: dto.name,
    email: dto.email,
    password: dto.password,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  beforeEach(() => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };
    redisService = {
      retrieve: jest.fn(
        <T>({ strategy }: { key: string; strategy: () => Promise<T> | T; ttl?: number }) =>
          Promise.resolve(strategy()) as Promise<T>,
      ),
    };

    service = new UserService(
      prismaService as unknown as PrismaService,
      redisService as unknown as RedisService,
    );
  });

  it('creates a user when the email is unique', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);
    prismaService.user.create.mockResolvedValue(user);

    await expect(service.create(dto)).resolves.toBe(user);
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: dto.email } });
    expect(prismaService.user.create).toHaveBeenCalledWith({ data: dto });
  });

  it('throws when creating a duplicate email', async () => {
    prismaService.user.findUnique.mockResolvedValue(user);

    await expect(service.create(dto)).rejects.toThrow(ConflictException);
    expect(prismaService.user.create).not.toHaveBeenCalled();
  });

  it('finds all users without passwords', async () => {
    const safeUsers = [{ id: user.id, name: user.name, email: user.email }];
    prismaService.user.findMany.mockResolvedValue(safeUsers);

    await expect(service.findAll()).resolves.toBe(safeUsers);
    expect(prismaService.user.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it('finds a user by email with password', async () => {
    prismaService.user.findUnique.mockResolvedValue(user);

    await expect(service.findByEmail(dto.email)).resolves.toBe(user);
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        password: true,
      },
    });
  });

  it('finds a user by id with password', async () => {
    prismaService.user.findUnique.mockResolvedValue(user);

    await expect(service.findById(user.id)).resolves.toBe(user);
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        password: true,
      },
    });
  });

  it('throws when user id does not exist', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });

  it('finds a user by id for auth via cache strategy', async () => {
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    prismaService.user.findUnique.mockResolvedValue(safeUser);

    await expect(service.findByIdForAuth(user.id)).resolves.toEqual(safeUser);
    expect(redisService.retrieve).toHaveBeenCalledWith(
      expect.objectContaining({
        key: `user:id:${user.id}`,
        ttl: 60,
      }),
    );
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it('throws when user id does not exist for auth lookup', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(service.findByIdForAuth('missing')).rejects.toThrow(NotFoundException);
  });
});
