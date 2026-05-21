import { HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

import { LinkRedirectController } from './link-redirect.controller';
import { LinkService } from './link.service';

jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
}));

describe('LinkRedirectController', () => {
  let controller: LinkRedirectController;
  let linkService: jest.Mocked<Pick<LinkService, 'resolveRedirect'>>;
  let response: jest.Mocked<Pick<Response, 'redirect'>>;

  beforeEach(() => {
    linkService = {
      resolveRedirect: jest.fn(),
    };
    response = {
      redirect: jest.fn(),
    };

    controller = new LinkRedirectController(linkService as unknown as LinkService);
  });

  it('resolves the code and redirects to the original URL', async () => {
    linkService.resolveRedirect.mockResolvedValue('https://example.com/article');

    await controller.redirect(
      'abc12345',
      '127.0.0.1',
      'Mozilla/5.0',
      response as unknown as Response,
    );

    expect(linkService.resolveRedirect).toHaveBeenCalledWith('abc12345', '127.0.0.1', 'Mozilla/5.0');
    expect(response.redirect).toHaveBeenCalledWith(HttpStatus.FOUND, 'https://example.com/article');
  });
});
