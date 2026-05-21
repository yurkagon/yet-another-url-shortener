import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import type { Response } from 'express';

import { UserService, UserWithPassword } from '@/api/user/user.service';

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<Pick<UserService, 'create' | 'findByEmail' | 'findById'>>;
  let configService: { getOrThrow: jest.Mock };
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync' | 'verifyAsync'>>;
  let response: jest.Mocked<Pick<Response, 'cookie' | 'clearCookie'>>;

  const user: UserWithPassword = {
    id: 'user-1',
    name: 'Ada',
    email: 'ada@example.com',
    password: 'hashed-password',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  beforeEach(() => {
    userService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };
    configService = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          JWT_EXPIRATION_TIME: '15m',
          JWT_REFRESH_EXPIRATION_TIME: '7d',
          COOKIE_DOMAIN: 'localhost',
        };

        return values[key];
      }),
    };
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };
    response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    service = new AuthService(
      userService as unknown as UserService,
      configService as unknown as ConfigService,
      jwtService as unknown as JwtService,
    );

    jest.mocked(hash).mockReset();
    jest.mocked(verify).mockReset();
  });

  it('registers a user, sets auth cookies, and returns a safe user', async () => {
    const dto: RegisterDto = {
      name: 'Ada',
      email: 'ada@example.com',
      password: 'password123',
    };
    jest.mocked(hash).mockResolvedValue('hashed-password');
    userService.create.mockResolvedValue(user);
    jwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');

    await expect(service.register(response as unknown as Response, dto)).resolves.toEqual({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });

    expect(hash).toHaveBeenCalledWith(dto.password);
    expect(userService.create).toHaveBeenCalledWith({
      name: dto.name,
      email: dto.email,
      password: 'hashed-password',
    });
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      1,
      { userId: user.id, tokenType: 'access' },
      { expiresIn: '15m' },
    );
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      2,
      { userId: user.id, tokenType: 'refresh' },
      { expiresIn: '7d' },
    );
    expect(response.cookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      'access-token',
      expect.objectContaining({ httpOnly: true, maxAge: 900000 }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      'refresh-token',
      expect.objectContaining({ httpOnly: true, maxAge: 604800000 }),
    );
  });

  it('logs in an existing user with a valid password', async () => {
    const dto: LoginDto = { email: user.email, password: 'password123' };
    userService.findByEmail.mockResolvedValue(user);
    jest.mocked(verify).mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');

    const result = await service.login(response as unknown as Response, dto);

    expect(result.user).not.toHaveProperty('password');
    expect(userService.findByEmail).toHaveBeenCalledWith(dto.email);
    expect(verify).toHaveBeenCalledWith(user.password, dto.password);
    expect(response.cookie).toHaveBeenCalledTimes(2);
  });

  it('rejects login when the user does not exist', async () => {
    userService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login(response as unknown as Response, {
        email: 'missing@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(UnauthorizedException);
    expect(verify).not.toHaveBeenCalled();
  });

  it('rejects login when the password is invalid', async () => {
    userService.findByEmail.mockResolvedValue(user);
    jest.mocked(verify).mockResolvedValue(false);

    await expect(
      service.login(response as unknown as Response, { email: user.email, password: 'bad-password' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(response.cookie).not.toHaveBeenCalled();
  });

  it('refreshes tokens for a valid refresh token', async () => {
    jwtService.verifyAsync.mockResolvedValue({ userId: user.id, tokenType: 'refresh' });
    userService.findById.mockResolvedValue(user);
    jwtService.signAsync.mockResolvedValueOnce('new-access-token').mockResolvedValueOnce('new-refresh-token');

    await expect(
      service.refresh(response as unknown as Response, 'refresh-token'),
    ).resolves.toBeUndefined();

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('refresh-token');
    expect(userService.findById).toHaveBeenCalledWith(user.id);
    expect(response.cookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      'new-access-token',
      expect.any(Object),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      'new-refresh-token',
      expect.any(Object),
    );
  });

  it('rejects refresh without a token', async () => {
    await expect(service.refresh(response as unknown as Response, '')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects an invalid refresh token', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

    await expect(service.refresh(response as unknown as Response, 'bad-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a refresh request with a non-refresh token', async () => {
    jwtService.verifyAsync.mockResolvedValue({ userId: user.id, tokenType: 'access' });

    await expect(service.refresh(response as unknown as Response, 'access-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('clears auth cookies on logout', () => {
    service.logout(response as unknown as Response);

    expect(response.clearCookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      expect.objectContaining({ httpOnly: true, path: '/', domain: 'localhost' }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      expect.objectContaining({ httpOnly: true, path: '/', domain: 'localhost' }),
    );
  });
});
