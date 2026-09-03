import type { CookieOptions, Response } from 'express';

export const AUTH_COOKIE = 'access_token';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const options = (): CookieOptions => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SEVEN_DAYS_MS,
});

export const setAuthCookie = (response: Response, token: string): void => {
    response.cookie(AUTH_COOKIE, token, options());
};

export const clearAuthCookie = (response: Response): void => {
    response.clearCookie(AUTH_COOKIE, { ...options(), maxAge: undefined });
};

export const readAuthCookie = (header: string | undefined): string | null => {
    if (!header) return null;

    for (const part of header.split(';')) {
        const separator = part.indexOf('=');

        if (separator === -1) continue;

        if (part.slice(0, separator).trim() === AUTH_COOKIE) {
            return decodeURIComponent(part.slice(separator + 1).trim());
        }
    }

    return null;
};
