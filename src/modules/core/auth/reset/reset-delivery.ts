import { Injectable, Logger } from '@nestjs/common';

export const RESET_DELIVERY = 'RESET_DELIVERY';

export interface ResetDelivery {
    send(email: string, resetUrl: string): Promise<void>;
}

@Injectable()
export class LoggingResetDelivery implements ResetDelivery {
    private readonly logger = new Logger(LoggingResetDelivery.name);

    send(email: string, resetUrl: string): Promise<void> {
        this.logger.warn(
            `No email provider configured. Reset link for ${email}: ${resetUrl}`,
        );

        return Promise.resolve();
    }
}
