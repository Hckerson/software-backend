import { ConfigService } from '@nestjs/config';
import { CycleScheduler, cronEnabled } from './cycle.scheduler';
import type { CycleService } from './cycle.service';

const configOf = (value?: string): ConfigService =>
    ({ get: () => value }) as unknown as ConfigService;

const summary = (changed: number) => ({
    examined: changed,
    changed,
    skipped: 0,
    details: [],
});

describe('cronEnabled', () => {
    it('defaults to on when the flag is unset', () => {
        expect(cronEnabled(configOf(undefined))).toBe(true);
    });

    it('is off only for the explicit off value', () => {
        expect(cronEnabled(configOf('off'))).toBe(false);
        expect(cronEnabled(configOf('OFF'))).toBe(false);
        expect(cronEnabled(configOf('on'))).toBe(true);
    });
});

describe('CycleScheduler', () => {
    const cycleFor = (runAll: jest.Mock) =>
        ({ runAll }) as unknown as CycleService;

    it('runs the cycle when enabled', async () => {
        const runAll = jest
            .fn()
            .mockResolvedValue({ renewal: summary(1), overdue: summary(2) });

        await new CycleScheduler(cycleFor(runAll), configOf('on')).runDaily();

        expect(runAll).toHaveBeenCalledTimes(1);
    });

    it('does nothing when the flag is off', async () => {
        const runAll = jest.fn();

        await new CycleScheduler(cycleFor(runAll), configOf('off')).runDaily();

        expect(runAll).not.toHaveBeenCalled();
    });

    it('swallows a failure so the scheduler survives to the next tick', async () => {
        const runAll = jest.fn().mockRejectedValue(new Error('database down'));

        await expect(
            new CycleScheduler(cycleFor(runAll), configOf('on')).runDaily(),
        ).resolves.toBeUndefined();
    });
});
