import { Injectable } from '@nestjs/common';
import { UsageMetricType } from 'generated/prisma/client';

export const UNLIMITED = null;
export const NO_OVERAGE = null;

export interface LimitCheck {
    metricType: UsageMetricType;
    limit: number | null;
    consumed: number;
    remainingQuota: number | null;
    percentageUsed: number;
    isAllowed: boolean;
    overageRate: number | null;
    overageUnits: number;
    overageCharge: number;
}

const FULL = 100;
const NOTHING = 0;

@Injectable()
export class UsageValidatorService {
    limitFor(limits: unknown, metricType: UsageMetricType): number | null {
        if (!limits || typeof limits !== 'object') return UNLIMITED;

        const value = (limits as Record<string, unknown>)[metricType];

        return typeof value === 'number' && value > 0 ? value : UNLIMITED;
    }

    /**
     * Price per unit beyond the limit. A metric with no rate is a hard cap,
     * which is why the absence of a rate and a rate of zero mean the same
     * thing: nothing is billable, so nothing may exceed.
     */
    overageRateFor(
        overageRates: unknown,
        metricType: UsageMetricType,
    ): number | null {
        if (!overageRates || typeof overageRates !== 'object')
            return NO_OVERAGE;

        const value = (overageRates as Record<string, unknown>)[metricType];

        return typeof value === 'number' && value > 0 ? value : NO_OVERAGE;
    }

    check(
        metricType: UsageMetricType,
        limit: number | null,
        consumed: number,
        overageRate: number | null = NO_OVERAGE,
    ): LimitCheck {
        if (limit === UNLIMITED) {
            return {
                metricType,
                limit: UNLIMITED,
                consumed,
                remainingQuota: UNLIMITED,
                percentageUsed: 0,
                isAllowed: true,
                overageRate: NO_OVERAGE,
                overageUnits: NOTHING,
                overageCharge: NOTHING,
            };
        }

        const overageUnits = Math.max(NOTHING, consumed - limit);
        const billable = overageRate !== NO_OVERAGE;

        return {
            metricType,
            limit,
            consumed,
            remainingQuota: Math.max(NOTHING, limit - consumed),
            percentageUsed: (consumed / limit) * FULL,
            isAllowed: consumed <= limit || billable,
            overageRate,
            overageUnits,
            overageCharge: billable ? overageUnits * overageRate : NOTHING,
        };
    }
}
