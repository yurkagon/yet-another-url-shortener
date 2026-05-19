import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { LinkModule } from '@/api/link/link.module';
import { StatisticsModule } from '@/api/statistics/statistics.module';
import { UserModule } from '@/api/user/user.module';

@Module({
  imports: [AuthModule, UserModule, LinkModule, StatisticsModule],
})
export class ApiModule { }
