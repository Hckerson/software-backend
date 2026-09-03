import { generateKeyPairSync } from 'node:crypto';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const encode = (pem) => Buffer.from(pem, 'utf8').toString('base64');

process.stdout.write(
    [
        '# backend/.env',
        `JWT_PRIVATE_KEY=${encode(privateKey)}`,
        `JWT_PUBLIC_KEY=${encode(publicKey)}`,
        '',
        '# frontend/.env.local  (public half only - never copy the private key here)',
        `AUTH_JWT_PUBLIC_KEY=${encode(publicKey)}`,
        '',
    ].join('\n'),
);
