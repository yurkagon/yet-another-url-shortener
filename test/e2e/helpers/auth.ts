import request from 'supertest';
import type { App } from 'supertest/types';

export const registerUser = async (server: App) => {
  const response = await request(server).post('/v1/auth/register').send({
    name: 'Ada',
    email: 'ada@example.com',
    password: 'password123',
  });

  const cookies = response.headers['set-cookie'] as unknown as string[];

  return { response, cookies };
};
