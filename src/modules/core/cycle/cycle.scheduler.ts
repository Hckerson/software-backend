import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CycleService } from './cycle.service';

export const CYCLE_CRON_FLAG = 'BILLING_CYCLE_CRON';

/**
 * Defaults to on. @nestjs/schedule runs in-process, so every API instance
 * would otherwise run every job; set BILLING_CYCLE_CRON=off on all but one
 * instance. The jobs are idempotent, so a double run is wasteful, not wrong.
 */
export const cronEnabled = (config: ConfigService): boolean =>
    (config.get<string>(CYCLE_CRON_FLAG) ?? 'on').toLowerCase() !== 'off';

@Injectable()
export class CycleScheduler {
    private readonly logger = new Logger(CycleScheduler.name);

    constructor(
        private readonly cycleService: CycleService,
        private readonly config: ConfigService,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_2AM, { name: 'billing-cycle' })
    async runDaily(): Promise<void> {
        if (!cronEnabled(this.config)) return;

        try {
            const { renewal, overdue } = await this.cycleService.runAll();

            this.logger.log(
                `Billing cycle: renewed ${renewal.changed} of ${renewal.examined}, ` +
                    `marked ${overdue.changed} of ${overdue.examined} overdue`,
            );
        } catch (cause) {
            this.logger.error('Billing cycle run failed', cause);
        }
    }
}
