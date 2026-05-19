import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export const Authorization = () => {
  return applyDecorators(UseGuards(AuthGuard('jwt')));
};
