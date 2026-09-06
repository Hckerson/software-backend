import { Injectable } from '@nestjs/common';
import { UsageMetricType } from 'generated/prisma/client';

export const UNLIMITED = null;

export interface LimitCheck {
    metricType: UsageMetricType;
    limit: number | null;
    consumed: number;
    remainingQuota: number | null;
    percentageUsed: number;
    isAllowed: boolean;
}

const NEAR_LIMIT_PERCENT = 80;
const FULL = 100;

@Injectable()
export class UsageValidatorService {
    limitFor(limits: unknown, metricType: UsageMetricType): number | null {
        if (!limits || typeof limits !== 'object') return UNLIMITED;

        const value = (limits as Record<string, unknown>)[metricType];

        return typeof value === 'number' && value > 0 ? value : UNLIMITED;
    }

    check(
        metricType: UsageMetricType,
        limit: number | null,
        consumed: number,
    ): LimitCheck {
        if (limit === UNLIMITED) {
            return {
                metricType,
                limit: UNLIMITED,
                consumed,
                remainingQuota: UNLIMITED,
                percentageUsed: 0,
                isAllowed: true,
            };
        }

        return {
            metricType,
            limit,
            consumed,
            remainingQuota: Math.max(0, limit - consumed),
            percentageUsed: (consumed / limit) * FULL,
            isAllowed: consumed <= limit,
        };
    }

    isNearLimit(check: LimitCheck, threshold = NEAR_LIMIT_PERCENT): boolean {
        return check.limit !== UNLIMITED && check.percentageUsed >= threshold;
    }
}
