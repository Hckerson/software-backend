import { RESET_PURPOSE, isResetToken, wasIssuedBefore } from './reset-token';

describe('isResetToken', () => {
    it('accepts a well-formed reset token payload', () => {
        expect(
            isResetToken({
                sub: 'user-1',
                email: 'a@b.c',
                purpose: RESET_PURPOSE,
            }),
        ).toBe(true);
    });

    it('rejects a session token reused as a reset token', () => {
        expect(isResetToken({ sub: 'user-1', email: 'a@b.c' })).toBe(false);
    });

    it('rejects a payload with the wrong purpose', () => {
        expect(
            isResetToken({
                sub: 'user-1',
                email: 'a@b.c',
                purpose: 'login' as never,
            }),
        ).toBe(false);
    });
});

describe('wasIssuedBefore', () => {
    const resetAt = new Date('2026-09-03T12:00:00Z');
    const seconds = (iso: string) => Math.floor(Date.parse(iso) / 1000);

    it('rejects a token issued before the last successful reset', () => {
        expect(wasIssuedBefore(seconds('2026-09-03T11:00:00Z'), resetAt)).toBe(
            true,
        );
    });

    it('accepts a token issued after the last reset', () => {
        expect(wasIssuedBefore(seconds('2026-09-03T13:00:00Z'), resetAt)).toBe(
            false,
        );
    });

    it('accepts any token when the account has never been reset', () => {
        expect(wasIssuedBefore(seconds('2020-01-01T00:00:00Z'), null)).toBe(
            false,
        );
    });

    it('does not reject when the token carries no iat', () => {
        expect(wasIssuedBefore(undefined, resetAt)).toBe(false);
    });
});
