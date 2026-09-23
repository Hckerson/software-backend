import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RESET_DELIVERY, type ResetDelivery } from './reset/reset-delivery';
import {
    RESET_PURPOSE,
    RESET_TOKEN_TTL,
    isResetToken,
    wasIssuedBefore,
    type ResetTokenPayload,
} from './reset/reset-token';
import { Prisma } from 'generated/prisma/client';
import { UserRole } from 'generated/prisma/enums';
import { PasswordUtil } from './utils/password.util';
import { SUSPENDED_MESSAGE, isSuspended } from './account-status';
import { metricBuilder } from 'src/lib/metric-builder';
import { UsersService, type PublicUser } from '@core/users/users.service';
import type { AuthResponse, JwtPayload } from './types/auth.types';
import { LoginDto, RegisterDto, ResetPasswordDto, OnboardingDto } from './dto';

import {
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
        private readonly config: ConfigService,
        @Inject(RESET_DELIVERY)
        private readonly resetDelivery: ResetDelivery,
    ) {}

    // ─── Registration & Login ──────────────────────────────────────────────────

    async register(dto: RegisterDto): Promise<AuthResponse> {
        const passwordHash = await PasswordUtil.hash(dto.password);
        const data = metricBuilder<Prisma.UserCreateInput>({
            passwordHash,
            role: dto.role,
            email: dto.email,
            fullName: dto.fullName,
            phoneNumber: dto.phoneNumber,
        });

        const user = await this.usersService.create(data);
        const accessToken = this.generateToken(user);

        return { user: this.toAuthUser(user), accessToken };
    }

    async login(dto: LoginDto): Promise<AuthResponse> {
        const user = await this.authenticateUser(dto.email, dto.password);
        const accessToken = this.generateToken(user);

        return { user: this.toAuthUser(user), accessToken };
    }

    // ─── Password & Profile ─────────────────────────────────────────────────────

    async forgotPassword(email: string): Promise<{ message: string }> {
        const user = await this.usersService.findByEmail(email);

        if (user) {
            const token = this.jwtService.sign(
                { sub: user.id, email: user.email, purpose: RESET_PURPOSE },
                { expiresIn: RESET_TOKEN_TTL },
            );
            const base =
                this.config.get<string>('FRONTEND_URL') ??
                'http://localhost:3000';

            // A delivery failure must not change the response: propagating it
            // would make a 500 mean "this email exists" and undo E4.
            try {
                await this.resetDelivery.send(
                    user.email,
                    `${base}/auth/reset-password?token=${token}`,
                );
            } catch (cause) {
                this.logger.error('Reset delivery failed', cause);
            }
        }

        return {
            message: 'If the email exists, reset instructions were sent.',
        };
    }

    async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
        let payload: ResetTokenPayload;

        try {
            payload = this.jwtService.verify<ResetTokenPayload>(dto.token);
        } catch {
            throw new UnauthorizedException('Invalid or expired token.');
        }

        if (!isResetToken(payload)) {
            throw new UnauthorizedException('Invalid or expired token.');
        }

        const user = await this.usersService.findByEmail(payload.email);

        if (!user || wasIssuedBefore(payload.iat, user.passwordResetAt)) {
            throw new UnauthorizedException('Invalid or expired token.');
        }

        const passwordHash = await PasswordUtil.hash(dto.password);

        await this.usersService.updateCredentials(user.id, {
            passwordHash,
            passwordResetAt: new Date(),
        });

        return { message: 'Password reset successful.' };
    }

    async onboarding(
        userId: string,
        dto: OnboardingDto,
    ): Promise<{ message: string }> {
        const user = await this.usersService.findOne(userId);
        if (!user) throw new NotFoundException('User not found');

        await this.usersService.update(userId, {
            bio: dto.bio,
            phoneNumber: dto.phoneNumber,
        });
        return { message: 'Onboarding completed.' };
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private toAuthUser(user: PublicUser) {
        return {
            id: user.id,
            name: user.fullName,
            email: user.email,
            role: user.role,
        };
    }

    private generateToken(user: {
        id: string;
        email: string;
        role: UserRole;
    }): string {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return this.jwtService.sign(payload);
    }

    private async authenticateUser(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const passwordValid = await PasswordUtil.compare(
            password,
            user.passwordHash,
        );
        if (!passwordValid)
            throw new UnauthorizedException('Invalid credentials');

        // Only after the password is proven: checking status first would tell
        // an anonymous caller that this email exists and is suspended.
        if (isSuspended(user.status)) {
            throw new ForbiddenException(SUSPENDED_MESSAGE);
        }

        return user;
    }
}
