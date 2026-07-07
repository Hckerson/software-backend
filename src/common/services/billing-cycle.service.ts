import { Injectable } from '@nestjs/common';

@Injectable()
export class BillingCycleService {
    calculateNextRenewalDate(startDate: Date): Date {
        const next = new Date(startDate);
        next.setMonth(next.getMonth() + 1);
        return next;
    }

    calculateBillingPeriodEnd(startDate: Date): Date {
        const end = new Date(startDate);
        end.setMonth(end.getMonth() + 1);
        end.setDate(end.getDate() - 1); // Last day of current month
        return end;
    }

    isRenewalDue(renewalDate: Date): boolean {
        return new Date() >= renewalDate;
    }

    getCurrentBillingPeriod(startDate: Date): { start: Date; end: Date } {
        const end = this.calculateBillingPeriodEnd(startDate);
        return { start: startDate, end };
    }

    formatPeriodKey(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    calculateProRataCharge(
        planPrice: number,
        daysUsed: number,
        daysInCycle: number = 30,
    ): number {
        return (planPrice / daysInCycle) * daysUsed;
    }

    calculateDaysBetween(startDate: Date, endDate: Date): number {
        const msPerDay = 24 * 60 * 60 * 1000;
        return Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay);
    }
}
