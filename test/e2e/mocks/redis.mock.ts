import type { E2eStore } from './e2e-store';

export const createRedisMock = (store: E2eStore) => ({
  retrieve: jest.fn(
    async <T>({ key, strategy }: { key: string; strategy: () => Promise<T> | T; ttl?: number }) => {
      const cached = store.redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }

      const data = await strategy();
      store.redis.set(key, JSON.stringify(data));

      return data;
    },
  ),
});

export type RedisMock = ReturnType<typeof createRedisMock>;
