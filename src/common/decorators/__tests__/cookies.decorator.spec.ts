import type { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { Cookies } from '../cookies.decorator';

describe('Cookies', () => {
  const createContext = (cookies: Record<string, string>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ cookies }),
      }),
    }) as ExecutionContext;

  const getFactory = () => {
    class TestController {
      public handler() {}
    }

    Cookies('refreshToken')(TestController.prototype, 'handler', 0);

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'handler') as Record<
      string,
      { factory: (data: unknown, ctx: ExecutionContext) => unknown }
    >;

    return Object.values(metadata)[0].factory;
  };

  it('returns all cookies when key is not provided', () => {
    const factory = getFactory();
    const cookies = { refreshToken: 'refresh-token', theme: 'dark' };

    expect(factory(undefined, createContext(cookies))).toBe(cookies);
  });

  it('returns a single cookie by key', () => {
    const factory = getFactory();

    expect(factory('refreshToken', createContext({ refreshToken: 'refresh-token' }))).toBe(
      'refresh-token',
    );
  });

  it('returns undefined when the cookie is missing', () => {
    const factory = getFactory();

    expect(factory('missing', createContext({ refreshToken: 'refresh-token' }))).toBeUndefined();
  });
});
