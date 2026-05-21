import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AuthGuard } from '@nestjs/passport';

import { Authorization } from '../authorization.decorator';

jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn(() => class JwtAuthGuard {}),
}));

describe('Authorization', () => {
  it('applies the JWT auth guard to a route handler', () => {
    class TestController {
      @Authorization()
      public handler() {}
    }

    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      TestController.prototype.handler,
    ) as unknown[];

    expect(AuthGuard).toHaveBeenCalledWith('jwt');
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBeDefined();
  });
});
