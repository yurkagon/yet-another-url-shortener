import type { INestApplication } from '@nestjs/common';
import type { Response } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/api/auth/auth.constants';
import {
  ACCESS_TOKEN_SECURITY_NAME,
  OPENAPI_DESCRIPTION,
  OPENAPI_DOCS_PATH,
  OPENAPI_JSON_PATH,
  OPENAPI_SERVER_URL,
  OPENAPI_TITLE,
  OPENAPI_VERSION,
  REFRESH_TOKEN_SECURITY_NAME,
} from '@/config/openapi';

export const useSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle(OPENAPI_TITLE)
    .setDescription(OPENAPI_DESCRIPTION)
    .setVersion(OPENAPI_VERSION)
    .addServer(OPENAPI_SERVER_URL, 'Versioned API')
    .addCookieAuth(
      ACCESS_TOKEN_COOKIE,
      {
        type: 'apiKey',
        in: 'cookie',
        description: 'Access JWT cookie. Issued on register/login and used by protected routes.',
      },
      ACCESS_TOKEN_SECURITY_NAME,
    )
    .addCookieAuth(
      REFRESH_TOKEN_COOKIE,
      {
        type: 'apiKey',
        in: 'cookie',
        description: 'Refresh JWT cookie. Issued on register/login and required for token refresh.',
      },
      REFRESH_TOKEN_SECURITY_NAME,
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get(OPENAPI_JSON_PATH, (_req: unknown, res: Response) => {
    res.json(document);
  });

  app.use(
    OPENAPI_DOCS_PATH,
    apiReference({
      url: OPENAPI_JSON_PATH,
      title: OPENAPI_TITLE,
      layout: 'modern',
      theme: 'kepler',
      darkMode: true,
      persistAuth: true,
      hideClientButton: true,
      showDeveloperTools: 'never',
      showSidebar: true,
      operationTitleSource: 'summary',
      defaultHttpClient: {
        targetKey: 'shell',
        clientKey: 'curl',
      },
      authentication: {
        preferredSecurityScheme: ACCESS_TOKEN_SECURITY_NAME,
      },
    }),
  );
};
