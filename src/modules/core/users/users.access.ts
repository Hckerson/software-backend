import { ForbiddenException } from '@nestjs/common';
import { UserRole } from 'generated/prisma/enums';
import type { AuthUser } from '@core/auth/types/auth.types';
import type { UpdateUserDto } from './dto';

const PRIVILEGED_FIELDS = ['role', 'status'] as const;

export const isAdmin = (actor: AuthUser | undefined): boolean =>
    actor?.role === UserRole.ADMIN;

export const assertCanActOn = (
    actor: AuthUser | undefined,
    targetId: string,
): void => {
    if (!actor) throw new ForbiddenException();
    if (isAdmin(actor) || actor.id === targetId) return;

    throw new ForbiddenException('You may only access your own account');
};

/**
 * An administrator suspending or demoting their own account locks themselves
 * out, and if they are the last administrator, locks everyone out. Privileged
 * changes to your own record go through another administrator.
 */
export const assertNotSelfPrivileged = (
    actor: AuthUser | undefined,
    targetId: string,
    dto: UpdateUserDto,
): void => {
    if (actor?.id !== targetId) return;

    for (const field of PRIVILEGED_FIELDS) {
        if (dto[field] !== undefined) {
            throw new ForbiddenException(
                `You cannot change your own '${field}'. Ask another administrator.`,
            );
        }
    }
};

export const scopeUpdate = (
    actor: AuthUser | undefined,
    dto: UpdateUserDto,
): UpdateUserDto => {
    if (isAdmin(actor)) return dto;

    const scoped: UpdateUserDto = { ...dto };

    for (const field of PRIVILEGED_FIELDS) {
        if (scoped[field] !== undefined) {
            throw new ForbiddenException(
                `Only an administrator may change '${field}'`,
            );
        }
    }

    return scoped;
};
