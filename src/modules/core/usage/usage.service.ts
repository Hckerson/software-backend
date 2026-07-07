import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { TrackUsageDto, UsageQueryDto } from './dto';
import { UsageLogRepo } from '@common/repos/usage-log.repo';
import { Prisma, UsageMetricType, UsageLog } from 'generated/prisma/client';
import { SubscriptionRepo } from '@common/repos/subscription.repo';
import { BillingCycleService } from '@common/services/billing-cycle.service';
import { UsageValidatorService } from '@common/services/usage-validator.service';

type SubscriptionWithPlan = Prisma.SubscriptionGetPayload<{
    include: { plan: true };
}>;

@Injectable()
export class UsageService {
    constructor(
        private usageLogRepo: UsageLogRepo,
        private subscriptionRepo: SubscriptionRepo,
        private billingCycle: BillingCycleService,
        private usageValidator: UsageValidatorService,
    ) {}

    async trackUsage(
        userId: string,
        trackUsageDto: TrackUsageDto,
    ): Promise<UsageLog> {
        const subscriptions = await this.subscriptionRepo.findMany({
            where: {
                userId,
                status: 'ACTIVE',
            },
        });

        if (subscriptions.length === 0) {
            throw new NotFoundException(
                `No active subscription found for user ${userId}`,
            );
        }

        const sub = subscriptions[0] as SubscriptionWithPlan;
        const period = this.billingCycle.formatPeriodKey(new Date());

        const planFeatures =
            sub.plan.features && typeof sub.plan.features === 'object'
                ? (sub.plan.features as Record<string, number>)
                : {};
        const limits =
            this.usageValidator.extractLimitsFromPlanFeatures(planFeatures);
        const currentUsageResult = await this.usageLogRepo.aggregate({
            where: {
                subscriptionId: sub.id,
                metricType: trackUsageDto.metricType,
                period,
            },
            _sum: { amount: true },
        });
        const currentUsage = currentUsageResult._sum?.amount || 0;

        const limitKey = this.getLimitKeyForMetric(trackUsageDto.metricType);
        const planLimit = limits[limitKey] || 0;

        const totalUsage = currentUsage + trackUsageDto.amount;
        const validation = this.usageValidator.validateUsageAgainstLimit(
            totalUsage,
            planLimit,
        );

        if (!validation.isAllowed) {
            throw new BadRequestException(
                `Usage limit exceeded for ${trackUsageDto.metricType}. Remaining quota: ${validation.remainingQuota}`,
            );
        }

        const existingLog = await this.usageLogRepo.findFirst({
            where: {
                subscriptionId: sub.id,
                metricType: trackUsageDto.metricType,
                period,
            },
        });

        if (existingLog) {
            return await this.usageLogRepo.update({
                where: { id: existingLog.id },
                data: { amount: existingLog.amount + trackUsageDto.amount },
            });
        }

        return await this.usageLogRepo.create({
            data: {
                subscription: { connect: { id: sub.id } },
                metricType: trackUsageDto.metricType,
                amount: trackUsageDto.amount,
                period,
            },
        });
    }

    async getCurrentPeriodUsage(
        userId: string,
        metricType?: UsageMetricType,
    ): Promise<
        | UsageLog
        | UsageLog[]
        | { amount: number; metricType: UsageMetricType; period: string }
    > {
        const subscription = await this.subscriptionRepo.findMany({
            where: {
                userId,
                status: 'ACTIVE',
            },
        });

        if (subscription.length === 0) {
            throw new NotFoundException(
                `No active subscription found for user ${userId}`,
            );
        }

        const sub = subscription[0];
        const period = this.billingCycle.formatPeriodKey(new Date());

        if (metricType) {
            const usage = await this.usageLogRepo.findFirst({
                where: {
                    subscriptionId: sub.id,
                    metricType,
                    period,
                },
            });
            return usage || { amount: 0, metricType, period };
        }

        return await this.usageLogRepo.findMany({
            where: { subscriptionId: sub.id },
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getUsageHistory(
        userId: string,
        query: UsageQueryDto,
    ): Promise<UsageLog[]> {
        const subscriptions = await this.subscriptionRepo.findMany({
            where: { userId },
        });

        if (subscriptions.length === 0) {
            throw new NotFoundException(
                `No subscription found for user ${userId}`,
            );
        }

        const sub = subscriptions[0];
        return await this.usageLogRepo.findMany({
            where: { subscriptionId: sub.id },
        });
    }

    async checkLimit(
        userId: string,
        metricType: UsageMetricType,
    ): Promise<{
        isAllowed: boolean;
        remainingQuota: number;
        percentageUsed: number;
    }> {
        const subscriptions = await this.subscriptionRepo.findMany({
            where: {
                userId,
                status: 'ACTIVE',
            },
        });

        if (subscriptions.length === 0) {
            throw new NotFoundException(
                `No active subscription found for user ${userId}`,
            );
        }

        const sub = subscriptions[0] as SubscriptionWithPlan;
        const period = this.billingCycle.formatPeriodKey(new Date());

        const currentUsageResult = await this.usageLogRepo.aggregate({
            where: {
                subscriptionId: sub.id,
                metricType,
                period,
            },
            _sum: { amount: true },
        });
        const currentUsage = currentUsageResult._sum?.amount || 0;

        const planFeatures =
            sub.plan.features && typeof sub.plan.features === 'object'
                ? (sub.plan.features as Record<string, number>)
                : {};
        const limits =
            this.usageValidator.extractLimitsFromPlanFeatures(planFeatures);
        const limitKey = this.getLimitKeyForMetric(metricType);
        const planLimit = limits[limitKey] || 0;

        return this.usageValidator.validateUsageAgainstLimit(
            currentUsage,
            planLimit,
        );
    }

    private getLimitKeyForMetric(metricType: UsageMetricType): string {
        const mapping = {
            [UsageMetricType.API_CALLS]: 'apiCalls',
            [UsageMetricType.STORAGE_GB]: 'storage',
            [UsageMetricType.SEATS]: 'seats',
        };
        return mapping[metricType] || metricType.toLowerCase();
    }
}
