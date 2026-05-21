import type { Request, Response } from 'express';

import { AuthController } from './auth.controller';
import { REFRESH_TOKEN_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Pick<AuthService, 'register' | 'login' | 'refresh' | 'logout'>>;

  const response = {} as Response;

  beforeEach(() => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };

    controller = new AuthController(authService as unknown as AuthService);
  });

  it('delegates register to AuthService', async () => {
    const dto: RegisterDto = {
      name: 'Ada',
      email: 'ada@example.com',
      password: 'password123',
    };
    const result = {
      user: {
        id: 'user-1',
        email: dto.email,
        name: dto.name,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    };
    authService.register.mockResolvedValue(result);

    await expect(controller.register(dto, response)).resolves.toBe(result);
    expect(authService.register).toHaveBeenCalledWith(response, dto);
  });

  it('delegates login to AuthService', async () => {
    const dto: LoginDto = { email: 'ada@example.com', password: 'password123' };
    const result = {
      user: {
        id: 'user-1',
        email: dto.email,
        name: 'Ada',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    };
    authService.login.mockResolvedValue(result);

    await expect(controller.login(dto, response)).resolves.toBe(result);
    expect(authService.login).toHaveBeenCalledWith(response, dto);
  });

  it('delegates refresh with the refresh token cookie', async () => {
    authService.refresh.mockResolvedValue(undefined);

    await expect(controller.refresh(response, 'refresh-token')).resolves.toBeUndefined();
    expect(authService.refresh).toHaveBeenCalledWith(response, 'refresh-token');
  });

  it('delegates logout to AuthService', () => {
    controller.logout(response);

    expect(authService.logout).toHaveBeenCalledWith(response);
  });

  it('returns the authenticated request user from me', async () => {
    const user = { id: 'user-1', email: 'ada@example.com' };
    const request = { user } as unknown as Request;

    await expect(controller.me(request)).resolves.toBe(user);
  });

  it('uses the expected refresh token cookie name', () => {
    expect(REFRESH_TOKEN_COOKIE).toBe('refreshToken');
  });
});
