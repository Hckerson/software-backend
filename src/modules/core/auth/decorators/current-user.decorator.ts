import { AuthUser } from '../types/auth.types';
import { RequestWithUser } from '@common/interfaces/req';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentUserField = keyof AuthUser;

export const currentUserFrom = (
    user: AuthUser | undefined,
    field?: CurrentUserField,
): AuthUser | AuthUser[CurrentUserField] | undefined => {
    if (!user) return undefined;

    return field ? user[field] : user;
};

export const CurrentUser = createParamDecorator(
    (field: CurrentUserField | undefined, ctx: ExecutionContext) => {
        const request: RequestWithUser = ctx.switchToHttp().getRequest();

        return currentUserFrom(request.user, field);
    },
);
