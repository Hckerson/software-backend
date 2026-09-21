import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { ExecutionContext } from '@nestjs/common';
import type { JwtAuthGuard, RolesGuard } from '@core/auth/guards';
import {
    CycleTriggerGuard,
    MIN_TOKEN_LENGTH,
    tokenMatches,
} from './cycle-trigger.guard';

const TOKEN = 'a'.repeat(MIN_TOKEN_LENGTH);

const contextWith = (headers: Record<string, string>): ExecutionContext =>
    ({
        switchToHttp: () => ({ getRequest: () => ({ headers }) }),
    }) as unknown as ExecutionContext;

const guardWith = (
    configured: string | undefined,
    jwtResult = false,
    rolesResult = false,
) => {
    const jwt = { canActivate: jest.fn().mockResolvedValue(jwtResult) };
    const roles = { canActivate: jest.fn().mockReturnValue(rolesResult) };
    const config = { get: () => configured };

    return {
        guard: new CycleTriggerGuard(
            config as unknown as ConfigService,
            jwt as unknown as JwtAuthGuard,
            roles as unknown as RolesGuard,
        ),
        jwt,
    };
};

describe('tokenMatches', () => {
    it('accepts the configured token', () => {
        expect(tokenMatches(TOKEN, TOKEN)).toBe(true);
    });

    it('rejects a different token of the same length', () => {
        expect(tokenMatches('b'.repeat(MIN_TOKEN_LENGTH), TOKEN)).toBe(false);
    });

    it('rejects a token of a different length without throwing', () => {
        expect(tokenMatches('short', TOKEN)).toBe(false);
    });

    it('fails closed when no token is configured', () => {
        expect(tokenMatches('', undefined)).toBe(false);
        expect(tokenMatches(TOKEN, undefined)).toBe(false);
    });

    it('treats a configured token below the minimum length as unset', () => {
        expect(tokenMatches('weak', 'weak')).toBe(false);
    });
});

describe('CycleTriggerGuard', () => {
    it('admits an external scheduler holding the right token', async () => {
        const { guard, jwt } = guardWith(TOKEN);

        await expect(
            guard.canActivate(contextWith({ 'x-cycle-token': TOKEN })),
        ).resolves.toBe(true);
        expect(jwt.canActivate).not.toHaveBeenCalled();
    });

    it('refuses a wrong token rather than falling back to a session', async () => {
        const { guard, jwt } = guardWith(TOKEN, true, true);

        await expect(
            guard.canActivate(contextWith({ 'x-cycle-token': 'wrong' })),
        ).rejects.toBeInstanceOf(UnauthorizedException);
        expect(jwt.canActivate).not.toHaveBeenCalled();
    });

    it('refuses any token when the feature is not configured', async () => {
        const { guard } = guardWith(undefined);

        await expect(
            guard.canActivate(contextWith({ 'x-cycle-token': TOKEN })),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('falls back to an admin session when no token is offered', async () => {
        const { guard } = guardWith(TOKEN, true, true);

        await expect(guard.canActivate(contextWith({}))).resolves.toBe(true);
    });

    it('refuses a signed-in non-admin', async () => {
        const { guard } = guardWith(TOKEN, true, false);

        await expect(guard.canActivate(contextWith({}))).resolves.toBe(false);
    });
});
