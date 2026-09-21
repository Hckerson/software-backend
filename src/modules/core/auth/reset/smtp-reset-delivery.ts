import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { RESET_TOKEN_TTL } from './reset-token';
import type { ResetDelivery } from './reset-delivery';

const DEFAULT_SMTP_PORT = 587;
const IMPLICIT_TLS_PORT = 465;

export interface SmtpSettings {
    host: string;
    port: number;
    user?: string;
    pass?: string;
    from: string;
}

/**
 * Reads SMTP configuration, returning null when the host is unset so the
 * module can fall back to logging the link rather than failing to boot.
 */
export const smtpSettingsFrom = (
    config: ConfigService,
): SmtpSettings | null => {
    const host = config.get<string>('SMTP_HOST');

    if (!host) return null;

    return {
        host,
        port: Number(config.get<string>('SMTP_PORT') ?? DEFAULT_SMTP_PORT),
        user: config.get<string>('SMTP_USER'),
        pass: config.get<string>('SMTP_PASSWORD'),
        from: config.get<string>('SMTP_FROM') ?? `no-reply@${host}`,
    };
};

const body = (resetUrl: string): string =>
    [
        'Someone asked to reset the password for this account.',
        `Open this link within ${RESET_TOKEN_TTL} to choose a new one:`,
        resetUrl,
        'The link can be used once. If this was not you, ignore this email —',
        'nothing has changed.',
    ].join('\n\n');

export class SmtpResetDelivery implements ResetDelivery {
    private readonly logger = new Logger(SmtpResetDelivery.name);
    private readonly transporter: Transporter;

    constructor(private readonly settings: SmtpSettings) {
        this.transporter = createTransport({
            host: settings.host,
            port: settings.port,
            secure: settings.port === IMPLICIT_TLS_PORT,
            auth: settings.user
                ? { user: settings.user, pass: settings.pass }
                : undefined,
        });
    }

    async send(email: string, resetUrl: string): Promise<void> {
        await this.transporter.sendMail({
            from: this.settings.from,
            to: email,
            subject: 'Reset your password',
            text: body(resetUrl),
        });

        this.logger.log('Password reset email dispatched');
    }
}
