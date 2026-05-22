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
    expect(testApp.prisma.click.create).toHaveBeenCalledTimes(1);
    const [clickCreateArgs] = testApp.prisma.click.create.mock.calls[0];
    expect(clickCreateArgs.data.userAgent).toBe('Mozilla/5.0');
    expect(clickCreateArgs.data.link.connect.id).toEqual(expect.any(String));

    await request(testApp.server)
      .get('/v1/link/mock-code/qr')
      .set('Cookie', cookies)
      .expect(200)
      .expect('Content-Type', /image\/png/);
  });

  it('returns paginated links', async () => {
    const { cookies } = await registerUser(testApp.server);
    const userId = testApp.store.users[0].id;

    // Seed 3 links directly into the store
    const now = new Date();
    testApp.store.links.push(
      {
        id: 'link-a',
        code: 'aaaa1111',
        originalUrl: 'https://alpha.example.com',
        isArchived: false,
        userId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'link-b',
        code: 'bbbb2222',
        originalUrl: 'https://beta.example.com',
        isArchived: false,
        userId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'link-c',
        code: 'cccc3333',
        originalUrl: 'https://gamma.example.com',
        isArchived: false,
        userId,
        createdAt: now,
        updatedAt: now,
      },
    );

    const res = await request(testApp.server)
      .get('/v1/link?page=1&limit=2')
      .set('Cookie', cookies)
      .expect(200);

    const body = res.body as { data: unknown[]; total: number; totalPages: number };
    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(3);
    expect(body.totalPages).toBe(2);
  });

  it('filters links by search term', async () => {
    const { cookies } = await registerUser(testApp.server);
    const userId = testApp.store.users[0].id;
    const now = new Date();
    testApp.store.links.push(
      {
        id: 'link-a',
        code: 'gh-home1',
        originalUrl: 'https://github.com',
        isArchived: false,
        userId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'link-b',
        code: 'yt-video',
        originalUrl: 'https://youtube.com',
        isArchived: false,
        userId,
        createdAt: now,
        updatedAt: now,
      },
    );

    const res = await request(testApp.server)
      .get('/v1/link?search=github')
      .set('Cookie', cookies)
      .expect(200);

    const body = res.body as { data: Array<{ code: string }>; total: number };
    expect(body.data).toHaveLength(1);
    expect(body.data[0].code).toBe('gh-home1');
  });

  it('filters links by status', async () => {
    const { cookies } = await registerUser(testApp.server);
    const userId = testApp.store.users[0].id;
    const now = new Date();
    testApp.store.links.push(
      {
        id: 'link-a',
        code: 'active01',
        originalUrl: 'https://active.example.com',
        isArchived: false,
        userId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'link-b',
        code: 'arch0001',
        originalUrl: 'https://archived.example.com',
        isArchived: true,
        userId,
        createdAt: now,
        updatedAt: now,
      },
    );

    const res = await request(testApp.server)
      .get('/v1/link?status=active')
      .set('Cookie', cookies)
      .expect(200);

    const body = res.body as { data: Array<{ code: string }>; total: number };
    expect(body.total).toBe(1);
    expect(body.data[0].code).toBe('active01');
  });

  it('exports links as CSV', async () => {
    const { cookies } = await registerUser(testApp.server);
    const userId = testApp.store.users[0].id;
    const now = new Date();
    testApp.store.links.push({
      id: 'link-a',
      code: 'csv00001',
      originalUrl: 'https://example.com',
      isArchived: false,
      userId,
      createdAt: now,
      updatedAt: now,
    });

    const res = await request(testApp.server)
      .get('/v1/link/export/csv')
      .set('Cookie', cookies)
      .expect(200);

    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain('id,code,original_url,is_archived,created_at');
    expect(res.text).toContain('csv00001');
  });
});
