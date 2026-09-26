export const RESET_PURPOSE = 'password-reset';

export const RESET_TOKEN_TTL = '30m';

export interface ResetTokenPayload {
    sub: string;
    email: string;
    purpose: typeof RESET_PURPOSE;
    iat?: number;
}

export const isResetToken = (
    payload: Partial<ResetTokenPayload>,
): payload is ResetTokenPayload =>
    payload.purpose === RESET_PURPOSE &&
    typeof payload.sub === 'string' &&
    typeof payload.email === 'string';

export const wasIssuedBefore = (
    issuedAtSeconds: number | undefined,
    lastResetAt: Date | null,
): boolean => {
    if (!lastResetAt || issuedAtSeconds === undefined) return false;

    return issuedAtSeconds * 1000 < lastResetAt.getTime();
};
