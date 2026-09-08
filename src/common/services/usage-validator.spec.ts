import { UsageMetricType } from 'generated/prisma/enums';
import { UsageValidatorService } from './usage-validator.service';

describe('UsageValidatorService.limitFor', () => {
    const validator = new UsageValidatorService();

    it('reads the limit from plan.limits keyed by the metric enum', () => {
        const limits = { API_CALLS: 500_000, STORAGE_GB: 100, SEATS: 10 };

        expect(validator.limitFor(limits, UsageMetricType.API_CALLS)).toBe(
            500_000,
        );
        expect(validator.limitFor(limits, UsageMetricType.SEATS)).toBe(10);
    });

    it('treats a missing metric as unlimited, not as a default', () => {
        expect(validator.limitFor({}, UsageMetricType.API_CALLS)).toBeNull();
        expect(validator.limitFor(null, UsageMetricType.SEATS)).toBeNull();
    });

    it('ignores the legacy camelCase feature keys', () => {
        const legacy = { apiCalls: 10_000, storage: 5, seats: 1 };

        expect(
            validator.limitFor(legacy, UsageMetricType.API_CALLS),
        ).toBeNull();
    });
});

describe('UsageValidatorService.check', () => {
    const validator = new UsageValidatorService();

    it('allows anything when the metric is unlimited', () => {
        const result = validator.check(
            UsageMetricType.API_CALLS,
            null,
            9_999_999,
        );

        expect(result.isAllowed).toBe(true);
        expect(result.remainingQuota).toBeNull();
        expect(result.percentageUsed).toBe(0);
    });

    it('computes remaining quota and percentage against a real limit', () => {
        const result = validator.check(
            UsageMetricType.API_CALLS,
            500_000,
            412_500,
        );

        expect(result.isAllowed).toBe(true);
        expect(result.remainingQuota).toBe(87_500);
        expect(result.percentageUsed).toBeCloseTo(82.5);
    });

    it('refuses once consumption passes the limit', () => {
        const result = validator.check(UsageMetricType.SEATS, 10, 11);

        expect(result.isAllowed).toBe(false);
        expect(result.remainingQuota).toBe(0);
    });

    it('allows consumption exactly at the limit', () => {
        expect(validator.check(UsageMetricType.SEATS, 10, 10).isAllowed).toBe(
            true,
        );
    });

    it('flags a metric near its limit', () => {
        const near = validator.check(UsageMetricType.API_CALLS, 100, 85);
        const fine = validator.check(UsageMetricType.API_CALLS, 100, 20);

        expect(validator.isNearLimit(near)).toBe(true);
        expect(validator.isNearLimit(fine)).toBe(false);
    });
});
