import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { UserModule } from '@/api/user/user.module';
import { LinkModule } from './link/link.module';

@Module({
  imports: [AuthModule, UserModule, LinkModule],
})
export class ApiModule {}
