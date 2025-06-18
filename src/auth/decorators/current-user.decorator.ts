import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserResponse } from '../types/auth.types';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserResponse => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
); 