import { StreamableFile } from '@nestjs/common';

import { User } from '@/api/user/user.service';

import { CreateLinkDto } from './dto/create-link.dto';
import { GetLinksQueryDto } from './dto/get-links-query.dto';
import { LinkController } from './link.controller';
import { LinkService } from './link.service';

jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
}));

describe('LinkController', () => {
  let controller: LinkController;
  let linkService: jest.Mocked<
    Pick<LinkService, 'create' | 'generateQrCode' | 'findAllByUser' | 'exportCsv'>
  >;

  const user: User = {
    id: 'user-1',
    email: 'ada@example.com',
    name: 'Ada',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  beforeEach(() => {
    linkService = {
      create: jest.fn(),
      generateQrCode: jest.fn(),
      findAllByUser: jest.fn(),
      exportCsv: jest.fn(),
    };

    controller = new LinkController(linkService as unknown as LinkService);
  });

  it('delegates link creation to LinkService for an authenticated user', async () => {
    const dto: CreateLinkDto = { originalUrl: 'https://example.com' };
    linkService.create.mockResolvedValue('https://short.test/l/abc12345');

    await expect(controller.create(dto, user)).resolves.toBe('https://short.test/l/abc12345');
    expect(linkService.create).toHaveBeenCalledWith(dto, user);
  });

  it('passes null user to LinkService for an anonymous caller', async () => {
    const dto: CreateLinkDto = { originalUrl: 'https://example.com' };
    linkService.create.mockResolvedValue('https://short.test/l/anon1234');

    await expect(controller.create(dto, undefined)).resolves.toBe('https://short.test/l/anon1234');
    expect(linkService.create).toHaveBeenCalledWith(dto, null);
  });

  it('delegates findAll to LinkService with query params', async () => {
    const query: GetLinksQueryDto = { page: 1, limit: 10, search: 'github', status: 'active' };
    const mockResult = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    linkService.findAllByUser.mockResolvedValue(mockResult);

    await expect(controller.findAll(user, query)).resolves.toBe(mockResult);
    expect(linkService.findAllByUser).toHaveBeenCalledWith(user.id, query);
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

  it('sends CSV with correct headers', async () => {
    const csvContent = 'id,code,original_url,is_archived,created_at\nlink-1,abc12345,...';
    linkService.exportCsv.mockResolvedValue(csvContent);

    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    await controller.exportCsv(user, res as never);

    expect(linkService.exportCsv).toHaveBeenCalledWith(user.id);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="links.csv"',
    );
    expect(res.send).toHaveBeenCalledWith(csvContent);
  });
});
