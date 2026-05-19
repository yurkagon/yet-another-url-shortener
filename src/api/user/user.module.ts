import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';

import { UserService } from './user.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
