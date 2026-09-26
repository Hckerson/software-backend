import { Injectable } from '@nestjs/common';
import { Prisma, UsageMetricType } from 'generated/prisma/client';
import { UsageLogRepo } from '@common/repos/usage-log.repo';
import { InvoiceGeneratorService } from './invoice-generator.service';
import { UsageValidatorService } from './usage-validator.service';

type SubscriptionWithPlan = Prisma.SubscriptionGetPayload<{
    include: { plan: true };
}>;

const NOTHING = 0;

/**
 * The one place overage is turned into money. The cycle bills it and the
 * upcoming-invoice estimate previews it, and those two must never disagree
 * about what a customer owes.
 */
@Injectable()
export class OverageCalculatorService {
    constructor(
        private usageLogRepo: UsageLogRepo,
        private usageValidator: UsageValidatorService,
        private invoiceGenerator: InvoiceGeneratorService,
    ) {}

    async totalFor(
        subscription: SubscriptionWithPlan,
        period: string,
    ): Promise<number> {
        let total = NOTHING;

        for (const metricType of Object.values(UsageMetricType)) {
            total += await this.chargeFor(subscription, metricType, period);
        }

        return total;
    }

    private async chargeFor(
        subscription: SubscriptionWithPlan,
        metricType: UsageMetricType,
        period: string,
    ): Promise<number> {
        const limit = this.usageValidator.limitFor(
            subscription.plan.limits,
            metricType,
        );

        if (limit === null) return NOTHING;

        const overageRate = this.usageValidator.overageRateFor(
            subscription.plan.overageRates,
            metricType,
        );

        if (overageRate === null) return NOTHING;

        const used = await this.usageLogRepo.aggregate({
            where: { subscriptionId: subscription.id, metricType, period },
            _sum: { amount: true },
        });

        return this.invoiceGenerator.calculateOverageCharge(
            used._sum?.amount ?? NOTHING,
            limit,
            overageRate,
        );
    }
}
