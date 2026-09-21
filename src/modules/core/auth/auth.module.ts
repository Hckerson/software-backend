import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '@core/users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from '@common/database/prisma.service';
import { JWT_ALGORITHM, privateKeyFrom, publicKeyFrom } from './auth.keys';
import { RESET_DELIVERY, LoggingResetDelivery } from './reset/reset-delivery';
import {
    SmtpResetDelivery,
    smtpSettingsFrom,
} from './reset/smtp-reset-delivery';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                privateKey: privateKeyFrom(config),
                publicKey: publicKeyFrom(config),
                signOptions: {
                    algorithm: JWT_ALGORITHM,
                    expiresIn: '7d',
                },
                verifyOptions: { algorithms: [JWT_ALGORITHM] },
            }),
        }),
    ],
    providers: [
        AuthService,
        JwtStrategy,
        PrismaService,
        {
            provide: RESET_DELIVERY,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const settings = smtpSettingsFrom(config);

                return settings
                    ? new SmtpResetDelivery(settings)
                    : new LoggingResetDelivery();
            },
        },
    ],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
