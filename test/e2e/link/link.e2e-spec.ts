import request from 'supertest';

import { registerUser } from '../helpers/auth';
import { createE2eApp, type E2eTestApp } from '../helpers/e2e-app';

describe('Link e2e', () => {
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

  it('creates links, redirects by short code, and exposes QR code bytes', async () => {
    const { cookies } = await registerUser(testApp.server);

    const createResponse = await request(testApp.server)
      .post('/v1/link')
      .set('Cookie', cookies)
      .send({ originalUrl: 'https://example.com/article' })
      .expect(201);

    expect(createResponse.text).toBe('http://short.test/l/mock-code');

    await request(testApp.server)
      .get('/l/mock-code')
      .set('User-Agent', 'Mozilla/5.0')
      .expect(302)
      .expect('Location', 'https://example.com/article');
    expect(testApp.prisma.click.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          link: { connect: { code: 'mock-code' } },
          userAgent: 'Mozilla/5.0',
        }),
      }),
    );

    await request(testApp.server)
      .get('/v1/link/mock-code/qr')
      .set('Cookie', cookies)
      .expect(200)
      .expect('Content-Type', /image\/png/);
  });
});
