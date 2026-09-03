import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '@core/users/users.service';
import { PrismaService } from '@common/database/prisma.service';
import type { Request } from 'express';
import { readAuthCookie } from '../auth.cookie';
import { JWT_ALGORITHM, publicKeyFrom } from '../auth.keys';
import type { AuthUser, JwtPayload } from '../types/auth.types';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly prisma: PrismaService,
    ) {
        const publicKey = publicKeyFrom(configService);

        const fromCookie = (request: Request): string | null =>
            readAuthCookie(request.headers.cookie);

        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                fromCookie,
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false,
            secretOrKey: publicKey,
            algorithms: [JWT_ALGORITHM],
        });
    }

    async validate(payload: JwtPayload): Promise<AuthUser> {
        const user = await this.usersService.findOne(payload.sub);
        if (!user) throw new UnauthorizedException();
        return {
            id: user.id,
            role: user.role,
            email: user.email,
            name: user.fullName,
        };
    }
}
