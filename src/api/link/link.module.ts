import { Module } from '@nestjs/common';

import { LinkController } from './link.controller';
import { LinkRedirectController } from './link-redirect.controller';
import { LinkService } from './link.service';

@Module({
  controllers: [LinkController, LinkRedirectController],
  providers: [LinkService],
})
export class LinkModule {}
