import { ForbiddenException } from '@nestjs/common';
import { UserAccountStatus, UserRole } from 'generated/prisma/enums';
import {
    assertCanActOn,
    assertNotSelfPrivileged,
    isAdmin,
    scopeUpdate,
} from './users.access';
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

describe('assertNotSelfPrivileged', () => {
    it('stops an admin suspending their own account', () => {
        expect(() =>
            assertNotSelfPrivileged(admin, admin.id, {
                status: UserAccountStatus.SUSPENDED,
            }),
        ).toThrow(ForbiddenException);
    });

    it('stops an admin demoting themselves', () => {
        expect(() =>
            assertNotSelfPrivileged(admin, admin.id, { role: UserRole.USER }),
        ).toThrow(ForbiddenException);
    });

    it('lets an admin suspend someone else', () => {
        expect(() =>
            assertNotSelfPrivileged(admin, customer.id, {
                status: UserAccountStatus.SUSPENDED,
            }),
        ).not.toThrow();
    });

    it('lets anyone edit their own ordinary profile fields', () => {
        expect(() =>
            assertNotSelfPrivileged(admin, admin.id, { fullName: 'Ada L.' }),
        ).not.toThrow();
    });
});

describe('isAdmin', () => {
    it('is true only for the admin role', () => {
        expect(isAdmin(admin)).toBe(true);
        expect(isAdmin(customer)).toBe(false);
        expect(isAdmin(undefined)).toBe(false);
    });
});
