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

    it('reports no overage while consumption is within the limit', () => {
        const result = validator.check(
            UsageMetricType.API_CALLS,
            500_000,
            412_500,
            0.0002,
        );

        expect(result.overageUnits).toBe(0);
        expect(result.overageCharge).toBe(0);
    });
});

describe('UsageValidatorService.overageRateFor', () => {
    const validator = new UsageValidatorService();

    it('reads the rate for a billable metric', () => {
        const rates = { API_CALLS: 0.0002, STORAGE_GB: 0.5 };

        expect(validator.overageRateFor(rates, UsageMetricType.API_CALLS)).toBe(
            0.0002,
        );
    });

    it('treats a metric with no rate as a hard cap', () => {
        const rates = { API_CALLS: 0.0002 };

        expect(
            validator.overageRateFor(rates, UsageMetricType.SEATS),
        ).toBeNull();
        expect(validator.overageRateFor({}, UsageMetricType.SEATS)).toBeNull();
        expect(
            validator.overageRateFor(null, UsageMetricType.SEATS),
        ).toBeNull();
    });

    it('treats a zero rate as a hard cap, since nothing billable can exceed', () => {
        expect(
            validator.overageRateFor({ SEATS: 0 }, UsageMetricType.SEATS),
        ).toBeNull();
    });
});

describe('overage billing', () => {
    const validator = new UsageValidatorService();

    it('lets a billable metric exceed its limit and prices the excess', () => {
        const result = validator.check(
            UsageMetricType.API_CALLS,
            500_000,
            512_500,
            0.0002,
        );

        expect(result.isAllowed).toBe(true);
        expect(result.overageUnits).toBe(12_500);
        expect(result.overageCharge).toBeCloseTo(2.5);
        expect(result.percentageUsed).toBeCloseTo(102.5);
    });

    it('still refuses a metric with no rate, so option 1 survives per metric', () => {
        const result = validator.check(UsageMetricType.SEATS, 10, 11);

        expect(result.isAllowed).toBe(false);
        expect(result.overageRate).toBeNull();
        expect(result.overageCharge).toBe(0);
    });

    it('never bills an unlimited metric', () => {
        const result = validator.check(
            UsageMetricType.API_CALLS,
            null,
            9_999_999,
            0.0002,
        );

        expect(result.overageRate).toBeNull();
        expect(result.overageUnits).toBe(0);
        expect(result.overageCharge).toBe(0);
    });
});
