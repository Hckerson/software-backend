import type { ConfigService } from '@nestjs/config';

export const JWT_ALGORITHM = 'RS256';

const decode = (value: string): string =>
    Buffer.from(value, 'base64').toString('utf8');

const read = (config: ConfigService, name: string): string => {
    const raw = config.get<string>(name);

    if (!raw) {
        throw new Error(
            `${name} is not defined. Run "pnpm keys:generate" and copy the output into .env`,
        );
    }

    const pem = raw.includes('-----BEGIN') ? raw : decode(raw);

    if (!pem.includes('-----BEGIN')) {
        throw new Error(`${name} is not a valid PEM key`);
    }

    return pem;
};

export const privateKeyFrom = (config: ConfigService): string =>
    read(config, 'JWT_PRIVATE_KEY');

export const publicKeyFrom = (config: ConfigService): string =>
    read(config, 'JWT_PUBLIC_KEY');
