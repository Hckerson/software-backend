import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { TrackUsageDto, UsageQueryDto } from './dto';
import { UsageLogRepo } from '@common/repos/usage-log.repo';
import {
    Prisma,
    SubscriptionStatus,
    UsageMetricType,
    UsageLog,
} from 'generated/prisma/client';
import { SubscriptionRepo } from '@common/repos/subscription.repo';
import { BillingCycleService } from '@common/services/billing-cycle.service';
import {
    LimitCheck,
    UsageValidatorService,
} from '@common/services/usage-validator.service';

type SubscriptionWithPlan = Prisma.SubscriptionGetPayload<{
    include: { plan: true };
}>;

export interface MetricUsage {
    metricType: UsageMetricType;
    amount: number;
    period: string;
}

export const METRIC_TYPES: UsageMetricType[] = [
    UsageMetricType.API_CALLS,
    UsageMetricType.STORAGE_GB,
    UsageMetricType.SEATS,
];

@Injectable()
export class UsageService {
    constructor(
        private usageLogRepo: UsageLogRepo,
        private subscriptionRepo: SubscriptionRepo,
        private billingCycle: BillingCycleService,
        private usageValidator: UsageValidatorService,
    ) {}

    private async activeSubscription(
        userId: string,
    ): Promise<SubscriptionWithPlan> {
        const subscription = await this.subscriptionRepo.findFirst({
            where: { userId, status: SubscriptionStatus.ACTIVE },
            include: { plan: true },
        });

        if (!subscription) {
            throw new NotFoundException(
                `No active subscription found for user ${userId}`,
            );
        }

        return subscription;
    }

    private async consumed(
        subscriptionId: string,
        metricType: UsageMetricType,
        period: string,
    ): Promise<number> {
        const result = await this.usageLogRepo.aggregate({
            where: { subscriptionId, metricType, period },
            _sum: { amount: true },
        });

        return result._sum?.amount ?? 0;
    }

    private limitCheck(
        subscription: SubscriptionWithPlan,
        metricType: UsageMetricType,
        consumed: number,
    ): LimitCheck {
        const limit = this.usageValidator.limitFor(
            subscription.plan.limits,
            metricType,
        );
        const overageRate = this.usageValidator.overageRateFor(
            subscription.plan.overageRates,
            metricType,
        );

        return this.usageValidator.check(
            metricType,
            limit,
            consumed,
            overageRate,
        );
    }

    async trackUsage(
        userId: string,
        trackUsageDto: TrackUsageDto,
    ): Promise<UsageLog> {
        const subscription = await this.activeSubscription(userId);
        const period = this.billingCycle.formatPeriodKey(new Date());
        const already = await this.consumed(
            subscription.id,
            trackUsageDto.metricType,
            period,
        );

        const projected = this.limitCheck(
            subscription,
            trackUsageDto.metricType,
            already + trackUsageDto.amount,
        );

        if (!projected.isAllowed) {
            throw new BadRequestException(
                `Usage limit exceeded for ${trackUsageDto.metricType}. Remaining quota: ${projected.remainingQuota ?? 0}. This metric has no overage rate, so the limit is a hard cap.`,
            );
        }

        const existing = await this.usageLogRepo.findFirst({
            where: {
                subscriptionId: subscription.id,
                metricType: trackUsageDto.metricType,
                period,
            },
        });

        if (existing) {
            return this.usageLogRepo.update({
                where: { id: existing.id },
                data: { amount: existing.amount + trackUsageDto.amount },
            });
        }

        return this.usageLogRepo.create({
            data: {
                subscription: { connect: { id: subscription.id } },
                metricType: trackUsageDto.metricType,
                amount: trackUsageDto.amount,
                period,
            },
        });
    }

    async getCurrentPeriodUsage(userId: string): Promise<MetricUsage[]> {
        const subscription = await this.activeSubscription(userId);
        const period = this.billingCycle.formatPeriodKey(new Date());

        return Promise.all(
            METRIC_TYPES.map(async (metricType) => ({
                metricType,
                period,
                amount: await this.consumed(
                    subscription.id,
                    metricType,
                    period,
                ),
            })),
        );
    }

    async getUsageHistory(
        userId: string,
        query: UsageQueryDto,
    ): Promise<UsageLog[]> {
        const subscriptions = await this.subscriptionRepo.findMany({
            where: { userId },
            select: { id: true },
        });

        if (subscriptions.length === 0) return [];

        return this.usageLogRepo.findMany({
            where: {
                subscriptionId: { in: subscriptions.map((one) => one.id) },
                ...(query.metricType ? { metricType: query.metricType } : {}),
                ...(query.period ? { period: query.period } : {}),
            },
            orderBy: [{ period: 'desc' }, { metricType: 'asc' }],
        });
    }

    async checkLimit(
        userId: string,
        metricType: UsageMetricType,
    ): Promise<LimitCheck> {
        const subscription = await this.activeSubscription(userId);
        const period = this.billingCycle.formatPeriodKey(new Date());
        const consumed = await this.consumed(
            subscription.id,
            metricType,
            period,
        );

        return this.limitCheck(subscription, metricType, consumed);
    }

    async checkAllLimits(userId: string): Promise<LimitCheck[]> {
        const subscription = await this.activeSubscription(userId);
        const period = this.billingCycle.formatPeriodKey(new Date());

        return Promise.all(
            METRIC_TYPES.map(async (metricType) =>
                this.limitCheck(
                    subscription,
                    metricType,
                    await this.consumed(subscription.id, metricType, period),
                ),
            ),
        );
    }
}
