import { ConfigService } from '@nestjs/config';
import { smtpSettingsFrom } from './smtp-reset-delivery';

const configOf = (values: Record<string, string>): ConfigService =>
    ({ get: (key: string) => values[key] }) as unknown as ConfigService;

describe('smtpSettingsFrom', () => {
    it('returns null when no host is configured, so delivery falls back to logging', () => {
        expect(smtpSettingsFrom(configOf({}))).toBeNull();
    });

    it('defaults the port to submission and derives a sender from the host', () => {
        const settings = smtpSettingsFrom(configOf({ SMTP_HOST: 'mail.test' }));

        expect(settings).toEqual({
            host: 'mail.test',
            port: 587,
            user: undefined,
            pass: undefined,
            from: 'no-reply@mail.test',
        });
    });

    it('takes an explicit port, credentials and sender', () => {
        const settings = smtpSettingsFrom(
            configOf({
                SMTP_HOST: 'smtp.provider.com',
                SMTP_PORT: '465',
                SMTP_USER: 'apikey',
                SMTP_PASSWORD: 'secret',
                SMTP_FROM: 'billing@meter.app',
            }),
        );

        expect(settings?.port).toBe(465);
        expect(settings?.from).toBe('billing@meter.app');
        expect(settings?.user).toBe('apikey');
    });
});
