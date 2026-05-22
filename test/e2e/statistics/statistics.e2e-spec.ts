import type { ClickModel, LinkModel } from '@generated/prisma/models';
import request from 'supertest';

import { registerUser } from '../helpers/auth';
import { createE2eApp, type E2eTestApp } from '../helpers/e2e-app';

describe('Statistics e2e', () => {
  let testApp: E2eTestApp;

  beforeAll(async () => {
    testApp = await createE2eApp();
  });

  beforeEach(() => {
    testApp.reset();
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it('returns statistics for authenticated users', async () => {
    const { cookies } = await registerUser(testApp.server);
    const link: LinkModel = {
      id: 'link-1',
      code: 'mock-code',
      originalUrl: 'https://example.com/article',
      isArchived: false,
      userId: 'user-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const clicks: ClickModel[] = [
      {
        id: 'click-1',
        linkId: 'link-1',
        ipAddress: '8.8.8.8',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        createdAt: new Date('2026-01-02T10:00:00.000Z'),
        updatedAt: new Date('2026-01-02T10:00:00.000Z'),
      },
      {
        id: 'click-2',
        linkId: 'link-1',
        ipAddress: '1.1.1.1',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        createdAt: new Date('2026-01-02T12:00:00.000Z'),
        updatedAt: new Date('2026-01-02T12:00:00.000Z'),
      },
      {
        id: 'click-3',
        linkId: 'link-1',
        ipAddress: '91.198.174.192',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        createdAt: new Date('2026-01-03T08:00:00.000Z'),
        updatedAt: new Date('2026-01-03T08:00:00.000Z'),
      },
    ];
    testApp.store.links.push(link);
    testApp.store.clicks.push(...clicks);

    await request(testApp.server)
      .get('/v1/statistics/link/mock-code/browser')
      .set('Cookie', cookies)
      .expect(200)
      .expect({ Chrome: 2, Safari: 1 });

    await request(testApp.server)
      .get('/v1/statistics/link/mock-code/timeline')
      .set('Cookie', cookies)
      .expect(200)
      .expect([
        { date: '2026-01-02', value: 2 },
        { date: '2026-01-03', value: 1 },
      ]);

    const countryResponse = await request(testApp.server)
      .get('/v1/statistics/link/mock-code/country')
      .set('Cookie', cookies)
      .expect(200);
    const countryBreakdown = countryResponse.body as Record<string, number>;
    expect(Object.values(countryBreakdown).reduce((sum, value) => sum + value, 0)).toBe(3);
  });
});
