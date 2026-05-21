import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import type { App } from 'supertest/types';

import { AppModule } from '@/app.module';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { RedisService } from '@/infra/redis/redis.service';

import { createE2eStore, resetE2eStore, type E2eStore } from '../mocks/e2e-store';
import { createPrismaMock, type PrismaMock } from '../mocks/prisma.mock';
import { createRedisMock, type RedisMock } from '../mocks/redis.mock';

export type E2eTestApp = {
  app: INestApplication<App>;
  server: App;
  store: E2eStore;
  prisma: PrismaMock;
  redis: RedisMock;
  reset: () => void;
  close: () => Promise<void>;
};

const setE2eEnv = () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'e2e-secret';
  process.env.JWT_EXPIRATION_TIME = '15m';
  process.env.JWT_REFRESH_EXPIRATION_TIME = '7d';
  process.env.COOKIE_DOMAIN = 'localhost';
  process.env.APP_URL = 'http://short.test';
};

export const createE2eApp = async (): Promise<E2eTestApp> => {
  setE2eEnv();

  const store = createE2eStore();
  const prisma = createPrismaMock(store);
  const redis = createRedisMock(store);

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(RedisService)
    .useValue(redis)
    .compile();

  const app = moduleRef.createNestApplication();
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.use(cookieParser());

  await app.init();

  return {
    app,
    server: app.getHttpServer() as App,
    store,
    prisma,
    redis,
    reset: () => {
      resetE2eStore(store);
      jest.clearAllMocks();
    },
    close: () => app.close(),
  };
};
