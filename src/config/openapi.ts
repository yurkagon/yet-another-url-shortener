export const OPENAPI_TITLE = 'URL Shortener API';
export const OPENAPI_DESCRIPTION = [
  'REST API for creating short links and tracking clicks.',
  'Authentication uses access and refresh JWT tokens stored in httpOnly cookies.',
].join('\n\n');
export const OPENAPI_VERSION = '1.0.0';

export const OPENAPI_JSON_PATH = '/openapi.json';
export const OPENAPI_DOCS_PATH = '/docs';
export const OPENAPI_SERVER_URL = '/';
export const ACCESS_TOKEN_SECURITY_NAME = 'accessTokenCookie';
export const REFRESH_TOKEN_SECURITY_NAME = 'refreshTokenCookie';
