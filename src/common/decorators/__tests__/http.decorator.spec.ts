import type { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

const createContext = (request: {
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {},
        socket: {},
        ...request,
      }),
    }),
  }) as ExecutionContext;

const getFactory = (decorator: (target: object, key: string | symbol, index: number) => void) => {
  class TestController {
    public handler() {}
  }

  decorator(TestController.prototype, 'handler', 0);

  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestController,
    'handler',
  ) as Record<string, { factory: (data: unknown, ctx: ExecutionContext) => unknown }>;

  return Object.values(metadata)[0].factory;
};

describe('UserAgent', () => {
  it('returns user-agent header', async () => {
    const { UserAgent } = await import('../http.decorator');
    const factory = getFactory(UserAgent());

    expect(factory(undefined, createContext({ headers: { 'user-agent': 'Mozilla/5.0' } }))).toBe(
      'Mozilla/5.0',
    );
  });

  it('returns unknown when user-agent is missing', async () => {
    const { UserAgent } = await import('../http.decorator');
    const factory = getFactory(UserAgent());

    expect(factory(undefined, createContext({}))).toBe('unknown');
  });
});

describe('ClientIp', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.resetModules();
  });

  it('returns an empty string in development', async () => {
    process.env.NODE_ENV = 'test';
    jest.resetModules();

    const { ClientIp } = await import('../http.decorator');
    const factory = getFactory(ClientIp());

    expect(factory(undefined, createContext({ ip: '127.0.0.1' }))).toBe('');
  });

  it('prefers Cloudflare connecting IP in production', async () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();

    const { ClientIp } = await import('../http.decorator');
    const factory = getFactory(ClientIp());

    expect(
      factory(
        undefined,
        createContext({
          headers: { 'cf-connecting-ip': '203.0.113.10' },
          ip: '127.0.0.1',
        }),
      ),
    ).toBe('203.0.113.10');
  });

  it('uses first Cloudflare IP when header value is an array', async () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();

    const { ClientIp } = await import('../http.decorator');
    const factory = getFactory(ClientIp());

    expect(
      factory(
        undefined,
        createContext({
          headers: { 'cf-connecting-ip': ['203.0.113.10', '203.0.113.11'] },
          ip: '127.0.0.1',
        }),
      ),
    ).toBe('203.0.113.10');
  });

  it('falls back to request IP, socket address, then unknown in production', async () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();

    const { ClientIp } = await import('../http.decorator');
    const factory = getFactory(ClientIp());

    expect(factory(undefined, createContext({ ip: '127.0.0.1' }))).toBe('127.0.0.1');
    expect(factory(undefined, createContext({ socket: { remoteAddress: '10.0.0.1' } }))).toBe(
      '10.0.0.1',
    );
    expect(factory(undefined, createContext({}))).toBe('unknown');
  });
});
