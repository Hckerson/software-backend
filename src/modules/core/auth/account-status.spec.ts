import { UserAccountStatus } from 'generated/prisma/enums';
import { isSuspended } from './account-status';

describe('isSuspended', () => {
    it('is true only for a suspended account', () => {
        expect(isSuspended(UserAccountStatus.SUSPENDED)).toBe(true);
    });

    it('lets an active or pending account through', () => {
        expect(isSuspended(UserAccountStatus.ACTIVE)).toBe(false);
        expect(isSuspended(UserAccountStatus.PENDING)).toBe(false);
    });

    it('does not treat a missing status as suspended', () => {
        expect(isSuspended(undefined)).toBe(false);
    });
});
