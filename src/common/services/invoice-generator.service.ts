import { Injectable } from '@nestjs/common';
import { BillingCycleService } from './billing-cycle.service';

interface InvoiceGenerationParams {
    subscriptionId: string;
    userId: string;
    planPrice: { toNumber(): number } | number;
    overageAmount: number;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
}

@Injectable()
export class InvoiceGeneratorService {
    constructor(private billingCycle: BillingCycleService) {}

    generateInvoice(params: InvoiceGenerationParams): {
        subscriptionId: string;
        userId: string;
        amount: number;
        dueDate: Date;
        billingPeriodStart: Date;
        billingPeriodEnd: Date;
        status: string;
    } {
        const {
            subscriptionId,
            userId,
            planPrice,
            overageAmount,
            billingPeriodStart,
            billingPeriodEnd,
        } = params;

        const baseAmount =
            typeof planPrice === 'number' ? planPrice : planPrice.toNumber();
        const overage = overageAmount;
        const totalAmount = baseAmount + overage;

        const dueDate = new Date(billingPeriodEnd);
        dueDate.setDate(dueDate.getDate() + 14); // Due 14 days after cycle end

        return {
            subscriptionId,
            userId,
            amount: totalAmount,
            dueDate,
            billingPeriodStart,
            billingPeriodEnd,
            status: 'DRAFT',
        };
    }

    calculateOverageCharge(
        usage: number,
        planLimit: number,
        overageRatePerUnit: number,
    ): number {
        if (usage <= planLimit) return 0;
        return (usage - planLimit) * overageRatePerUnit;
    }

    formatInvoiceNumber(subscriptionId: string, periodKey: string): string {
        return `INV-${subscriptionId.slice(0, 8)}-${periodKey}`.toUpperCase();
    }

    calculateDueDate(billingPeriodEnd: Date, daysUntilDue: number = 14): Date {
        const due = new Date(billingPeriodEnd);
        due.setDate(due.getDate() + daysUntilDue);
        return due;
    }
}
