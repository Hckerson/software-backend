import { UserRole } from 'generated/prisma/enums';
import { currentUserFrom } from './current-user.decorator';
import type { AuthUser } from '../types/auth.types';

const user: AuthUser = {
    id: 'user-1',
    name: 'Casey Customer',
    email: 'customer@meter.test',
    role: UserRole.USER,
};

describe('currentUserFrom', () => {
    it('returns the requested field, not the whole user', () => {
        expect(currentUserFrom(user, 'id')).toBe('user-1');
        expect(currentUserFrom(user, 'email')).toBe('customer@meter.test');
        expect(currentUserFrom(user, 'role')).toBe(UserRole.USER);
    });

    it('returns the whole user when no field is named', () => {
        expect(currentUserFrom(user)).toEqual(user);
    });

    it('returns undefined for an unauthenticated request', () => {
        expect(currentUserFrom(undefined, 'id')).toBeUndefined();
        expect(currentUserFrom(undefined)).toBeUndefined();
    });

    it('never hands a repository an object where an id is expected', () => {
        const userId = currentUserFrom(user, 'id');

        expect(typeof userId).toBe('string');
    });
});
