import { StreamableFile } from '@nestjs/common';

import { User } from '@/api/user/user.service';

import { CreateLinkDto } from './dto/create-link.dto';
import { LinkController } from './link.controller';
import { LinkService } from './link.service';

jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
}));

describe('LinkController', () => {
  let controller: LinkController;
  let linkService: jest.Mocked<Pick<LinkService, 'create' | 'generateQrCode'>>;

  beforeEach(() => {
    linkService = {
      create: jest.fn(),
      generateQrCode: jest.fn(),
    };

    controller = new LinkController(linkService as unknown as LinkService);
  });

  it('delegates link creation to LinkService', async () => {
    const dto: CreateLinkDto = { originalUrl: 'https://example.com' };
    const user: User = {
      id: 'user-1',
      email: 'ada@example.com',
      name: 'Ada',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };
    linkService.create.mockResolvedValue('https://short.test/l/abc12345');

    await expect(controller.create(dto, user)).resolves.toBe('https://short.test/l/abc12345');
    expect(linkService.create).toHaveBeenCalledWith(dto, user);
  });

  it('wraps generated QR code bytes in a StreamableFile', async () => {
    const buffer = Buffer.from('png-bytes');
    linkService.generateQrCode.mockResolvedValue(buffer);

    const result = await controller.generateQrCode('abc12345');

    expect(result).toBeInstanceOf(StreamableFile);
    expect(result.getHeaders()).toEqual({
      type: 'image/png',
      disposition: 'inline; filename="link-abc12345.png"',
      length: buffer.length,
    });
    expect(linkService.generateQrCode).toHaveBeenCalledWith('abc12345');
  });
});
