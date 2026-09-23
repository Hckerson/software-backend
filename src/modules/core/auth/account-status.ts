import { UserAccountStatus } from 'generated/prisma/enums';

export const SUSPENDED_MESSAGE =
    'This account is suspended. Contact support to restore access.';

/**
 * Suspension has to be enforced in two places: at sign-in, and on every
 * request an existing token makes. Checking only sign-in would leave a
 * suspended customer working for the rest of a seven-day token.
 */
export const isSuspended = (status: UserAccountStatus | undefined): boolean =>
    status === UserAccountStatus.SUSPENDED;
