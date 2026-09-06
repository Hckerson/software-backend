import { ForbiddenException } from '@nestjs/common';
import { UserRole } from 'generated/prisma/enums';
import { assertCanActOn, isAdmin, scopeUpdate } from './users.access';
import type { AuthUser } from '@core/auth/types/auth.types';

const customer: AuthUser = {
    id: 'user-1',
    name: 'Casey',
    email: 'customer@meter.test',
    role: UserRole.USER,
};

const admin: AuthUser = {
    id: 'user-2',
    name: 'Ada',
    email: 'admin@meter.test',
    role: UserRole.ADMIN,
};

describe('assertCanActOn', () => {
    it('allows a user to act on their own account', () => {
        expect(() => assertCanActOn(customer, customer.id)).not.toThrow();
    });

    it('blocks a user from acting on someone else', () => {
        expect(() => assertCanActOn(customer, admin.id)).toThrow(
            ForbiddenException,
        );
    });

    it('allows an admin to act on anyone', () => {
        expect(() => assertCanActOn(admin, customer.id)).not.toThrow();
    });

    it('blocks an unauthenticated caller', () => {
        expect(() => assertCanActOn(undefined, customer.id)).toThrow(
            ForbiddenException,
        );
    });
});

describe('scopeUpdate', () => {
    it('refuses a self-service role change', () => {
        expect(() => scopeUpdate(customer, { role: UserRole.ADMIN })).toThrow(
            ForbiddenException,
        );
    });

    it('refuses a self-service status change', () => {
        expect(() => scopeUpdate(customer, { status: 'ACTIVE' })).toThrow(
            ForbiddenException,
        );
    });

    it('permits ordinary profile fields', () => {
        const dto = { fullName: 'Casey C', bio: 'hi' };

        expect(scopeUpdate(customer, dto)).toEqual(dto);
    });

    it('lets an admin change role and status', () => {
        const dto = { role: UserRole.ADMIN };

        expect(scopeUpdate(admin, dto)).toEqual(dto);
    });
});

describe('isAdmin', () => {
    it('is true only for the admin role', () => {
        expect(isAdmin(admin)).toBe(true);
        expect(isAdmin(customer)).toBe(false);
        expect(isAdmin(undefined)).toBe(false);
    });
});
