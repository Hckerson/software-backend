import { createHash, timingSafeEqual } from 'node:crypto';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { JwtAuthGuard, RolesGuard } from '@core/auth/guards';

export const CYCLE_TOKEN_HEADER = 'x-cycle-token';
export const CYCLE_TOKEN_ENV = 'CYCLE_TRIGGER_TOKEN';
export const MIN_TOKEN_LENGTH = 32;

const digest = (value: string): Buffer =>
    createHash('sha256').update(value).digest();

/**
 * Hashing both sides first gives timingSafeEqual equal-length inputs, so the
 * comparison leaks neither the token's contents nor its length. A token
 * shorter than MIN_TOKEN_LENGTH is treated as unset: the path fails closed.
 */
export const tokenMatches = (
    offered: string,
    expected: string | undefined,
): boolean => {
    if (!expected || expected.length < MIN_TOKEN_LENGTH) return false;

    return timingSafeEqual(digest(offered), digest(expected));
};

/**
 * Lets an external scheduler run the cycle without holding an admin session.
 * A request that offers a token is judged on the token alone; one that does
 * not falls through to the ordinary admin JWT check.
 */
@Injectable()
export class CycleTriggerGuard implements CanActivate {
    constructor(
        private readonly config: ConfigService,
        private readonly jwt: JwtAuthGuard,
        private readonly roles: RolesGuard,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const offered = request.headers[CYCLE_TOKEN_HEADER];

        if (typeof offered === 'string') {
            if (
                tokenMatches(offered, this.config.get<string>(CYCLE_TOKEN_ENV))
            ) {
                return true;
            }

            throw new UnauthorizedException('Invalid cycle trigger token');
        }

        const authenticated = await (this.jwt.canActivate(
            context,
        ) as Promise<boolean>);

        return authenticated && this.roles.canActivate(context);
    }
}
