import { Injectable } from '@nestjs/common';

interface PlanLimits {
    [key: string]: number;
}

@Injectable()
export class UsageValidatorService {
    validateUsageAgainstLimit(
        currentUsage: number,
        planLimit: number,
    ): {
        isAllowed: boolean;
        remainingQuota: number;
        percentageUsed: number;
    } {
        const percentageUsed = (currentUsage / planLimit) * 100;
        const remainingQuota = Math.max(0, planLimit - currentUsage);

        return {
            isAllowed: currentUsage <= planLimit,
            remainingQuota,
            percentageUsed,
        };
    }

    checkUsageThreshold(
        currentUsage: number,
        planLimit: number,
        thresholdPercentage: number = 80,
    ): boolean {
        const percentageUsed = (currentUsage / planLimit) * 100;
        return percentageUsed >= thresholdPercentage;
    }

    extractLimitsFromPlanFeatures(features: any): PlanLimits {
        if (!features || typeof features !== 'object') return {};
        const typedFeatures = features as Record<string, number>;
        return {
            apiCalls: typedFeatures.apiCalls || 10000,
            storage: typedFeatures.storage || 5,
            seats: typedFeatures.seats || 1,
        };
    }

    calculateUsagePercentage(current: number, limit: number): number {
        if (limit === 0) return 0;
        return Math.min((current / limit) * 100, 100);
    }

    isNearLimit(
        current: number,
        limit: number,
        threshold: number = 0.8,
    ): boolean {
        return current >= limit * threshold;
    }
}
