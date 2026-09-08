import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
    InvoiceStatus,
    Prisma,
    SubscriptionStatus,
} from 'generated/prisma/client';
import { InvoiceRepo } from '@common/repos/invoice.repo';
import { SubscriptionRepo } from '@common/repos/subscription.repo';
import { UsageLogRepo } from '@common/repos/usage-log.repo';
import { BillingAuditRepo } from '@common/repos/billing-audit.repo';
import { BillingCycleService } from '@common/services/billing-cycle.service';
import { InvoiceGeneratorService } from '@common/services/invoice-generator.service';
import { UsageValidatorService } from '@common/services/usage-validator.service';
import { METRIC_TYPES } from '@core/usage/usage.service';

type SubscriptionWithPlan = Prisma.SubscriptionGetPayload<{
    include: { plan: true };
}>;

export interface CycleRunSummary {
    examined: number;
    changed: number;
    skipped: number;
    details: string[];
}

const NO_OVERAGE_RATE = 0;

@Injectable()
export class CycleService {
    private readonly logger = new Logger(CycleService.name);

    constructor(
        private invoiceRepo: InvoiceRepo,
        private subscriptionRepo: SubscriptionRepo,
        private usageLogRepo: UsageLogRepo,
        private auditRepo: BillingAuditRepo,
        private billingCycle: BillingCycleService,
        private invoiceGenerator: InvoiceGeneratorService,
        private usageValidator: UsageValidatorService,
    ) {}

    private async overageFor(
        subscription: SubscriptionWithPlan,
        period: string,
    ): Promise<number> {
        let total = NO_OVERAGE_RATE;

        for (const metricType of METRIC_TYPES) {
            const limit = this.usageValidator.limitFor(
                subscription.plan.limits,
                metricType,
            );

            if (limit === null) continue;

            const used = await this.usageLogRepo.aggregate({
                where: { subscriptionId: subscription.id, metricType, period },
                _sum: { amount: true },
            });

            total += this.invoiceGenerator.calculateOverageCharge(
                used._sum?.amount ?? 0,
                limit,
                NO_OVERAGE_RATE,
            );
        }

        return total;
    }

    async issueInvoiceForPeriod(subscriptionId: string) {
        const subscription = await this.subscriptionRepo.findUnique({
            where: { id: subscriptionId },
            include: { plan: true },
        });

        if (!subscription) {
            throw new NotFoundException(
                `Subscription ${subscriptionId} not found`,
            );
        }

        const billingPeriodStart = subscription.currentBillingPeriodStart;
        const billingPeriodEnd = subscription.currentBillingPeriodEnd;

        const existing = await this.invoiceRepo.findFirst({
            where: { subscriptionId, billingPeriodStart },
        });

        if (existing) return existing;

        const period = this.billingCycle.formatPeriodKey(billingPeriodStart);
        const draft = this.invoiceGenerator.generateInvoice({
            subscriptionId,
            userId: subscription.userId,
            planPrice: subscription.plan.priceUSD,
            overageAmount: await this.overageFor(subscription, period),
            billingPeriodStart,
            billingPeriodEnd,
        });

        const invoice = await this.invoiceRepo.create({
            data: {
                subscription: { connect: { id: subscriptionId } },
                user: { connect: { id: subscription.userId } },
                amount: draft.amount,
                dueDate: draft.dueDate,
                billingPeriodStart,
                billingPeriodEnd,
                status: InvoiceStatus.SENT,
            },
        });

        await this.auditRepo.create({
            data: {
                subscription: { connect: { id: subscriptionId } },
                action: 'invoice_issued',
                newValue: {
                    invoiceId: invoice.id,
                    amount: draft.amount,
                    period,
                },
            },
        });

        return invoice;
    }

    async renewDueSubscriptions(now = new Date()): Promise<CycleRunSummary> {
        const due = await this.subscriptionRepo.findMany({
            where: {
                status: SubscriptionStatus.ACTIVE,
                currentBillingPeriodEnd: { lte: now },
            },
            include: { plan: true },
        });

        const summary: CycleRunSummary = {
            examined: due.length,
            changed: 0,
            skipped: 0,
            details: [],
        };

        for (const subscription of due) {
            const invoice = await this.issueInvoiceForPeriod(subscription.id);
            const nextStart = subscription.currentBillingPeriodEnd;
            const nextEnd =
                this.billingCycle.calculateBillingPeriodEnd(nextStart);

            await this.subscriptionRepo.update({
                where: { id: subscription.id },
                data: {
                    currentBillingPeriodStart: nextStart,
                    currentBillingPeriodEnd: nextEnd,
                    renewalDate:
                        this.billingCycle.calculateNextRenewalDate(nextStart),
                },
            });

            await this.auditRepo.create({
                data: {
                    subscription: { connect: { id: subscription.id } },
                    action: 'subscription_renewed',
                    oldValue: {
                        periodStart:
                            subscription.currentBillingPeriodStart.toISOString(),
                        periodEnd: nextStart.toISOString(),
                    },
                    newValue: {
                        periodStart: nextStart.toISOString(),
                        periodEnd: nextEnd.toISOString(),
                        invoiceId: invoice.id,
                    },
                },
            });

            summary.changed += 1;
            summary.details.push(
                `renewed ${subscription.id} -> ${nextEnd.toISOString()}`,
            );
        }

        this.logger.log(
            `renewal: examined ${summary.examined}, renewed ${summary.changed}`,
        );

        return summary;
    }

    async markOverdueInvoices(now = new Date()): Promise<CycleRunSummary> {
        const overdue = await this.invoiceRepo.findMany({
            where: { status: InvoiceStatus.SENT, dueDate: { lt: now } },
        });

        const summary: CycleRunSummary = {
            examined: overdue.length,
            changed: 0,
            skipped: 0,
            details: [],
        };

        for (const invoice of overdue) {
            await this.invoiceRepo.update({
                where: { id: invoice.id },
                data: { status: InvoiceStatus.OVERDUE },
            });

            await this.subscriptionRepo.updateMany({
                where: {
                    id: invoice.subscriptionId,
                    status: SubscriptionStatus.ACTIVE,
                },
                data: { status: SubscriptionStatus.PAST_DUE },
            });

            await this.auditRepo.create({
                data: {
                    subscription: { connect: { id: invoice.subscriptionId } },
                    action: 'invoice_overdue',
                    oldValue: { status: InvoiceStatus.SENT },
                    newValue: {
                        status: InvoiceStatus.OVERDUE,
                        invoiceId: invoice.id,
                    },
                },
            });

            summary.changed += 1;
            summary.details.push(`overdue ${invoice.id}`);
        }

        this.logger.log(
            `overdue sweep: examined ${summary.examined}, marked ${summary.changed}`,
        );

        return summary;
    }

    async runAll(now = new Date()) {
        return {
            renewal: await this.renewDueSubscriptions(now),
            overdue: await this.markOverdueInvoices(now),
        };
    }
}
