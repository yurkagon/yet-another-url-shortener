import request from 'supertest';

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/api/auth/auth.constants';

import { registerUser } from '../helpers/auth';
import { createE2eApp, type E2eTestApp } from '../helpers/e2e-app';

describe('Auth e2e', () => {
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

  it('registers, authenticates, refreshes, and logs out a user', async () => {
    const { response, cookies } = await registerUser(testApp.server);

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      id: 'user-1',
      name: 'Ada',
      email: 'ada@example.com',
    });
    expect(response.body.user).not.toHaveProperty('password');
    expect(cookies.some((cookie) => cookie.startsWith(`${ACCESS_TOKEN_COOKIE}=`))).toBe(true);
    expect(cookies.some((cookie) => cookie.startsWith(`${REFRESH_TOKEN_COOKIE}=`))).toBe(true);

    const meResponse = await request(testApp.server)
      .get('/v1/auth/me')
      .set('Cookie', cookies)
      .expect(200);
    expect(meResponse.body).toMatchObject({
      id: 'user-1',
      name: 'Ada',
      email: 'ada@example.com',
    });
    expect(meResponse.body).not.toHaveProperty('password');

    const refreshResponse = await request(testApp.server)
      .post('/v1/auth/refresh')
      .set('Cookie', cookies)
      .expect(201);
    const refreshedCookies = refreshResponse.headers['set-cookie'] as unknown as string[];
    expect(refreshedCookies.some((cookie) => cookie.startsWith(`${ACCESS_TOKEN_COOKIE}=`))).toBe(
      true,
    );

    const logoutResponse = await request(testApp.server)
      .post('/v1/auth/logout')
      .set('Cookie', cookies)
      .expect(204);
    const clearedCookies = logoutResponse.headers['set-cookie'] as unknown as string[];
    expect(clearedCookies.some((cookie) => cookie.startsWith(`${ACCESS_TOKEN_COOKIE}=`))).toBe(
      true,
    );
    expect(clearedCookies.some((cookie) => cookie.startsWith(`${REFRESH_TOKEN_COOKIE}=`))).toBe(
      true,
    );
  });

  it('rejects invalid auth payloads and unauthorized protected routes', async () => {
    await request(testApp.server)
      .post('/v1/auth/register')
      .send({
        name: 'A',
        email: 'not-an-email',
        password: 'short',
        role: 'admin',
      })
      .expect(400);

    await request(testApp.server).get('/v1/auth/me').expect(401);
  });
});
