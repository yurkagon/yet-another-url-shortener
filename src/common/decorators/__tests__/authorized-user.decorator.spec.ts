import type { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { User } from '@/api/user/user.service';

import { AuthorizedUser } from '../authorized-user.decorator';

describe('AuthorizedUser', () => {
  const user: User = {
    id: 'user-1',
    name: 'Ada',
    email: 'ada@example.com',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  const createContext = (requestUser: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user: requestUser }),
      }),
    }) as ExecutionContext;

  const getFactory = () => {
    class TestController {
      public handler() {}
    }

    AuthorizedUser()(TestController.prototype, 'handler', 0);

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'handler') as Record<
      string,
      { factory: (data: unknown, ctx: ExecutionContext) => unknown }
    >;

    return Object.values(metadata)[0].factory;
  };

  it('returns the authenticated user when no field is requested', () => {
    const factory = getFactory();

    expect(factory(undefined, createContext(user))).toBe(user);
  });

  it('returns a requested user field', () => {
    const factory = getFactory();

    expect(factory('email', createContext(user))).toBe(user.email);
  });

  it('returns undefined when request user is missing and a field is requested', () => {
    const factory = getFactory();

    expect(factory('email', createContext(undefined))).toBeUndefined();
  });
});
