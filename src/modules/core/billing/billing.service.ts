import { Injectable } from '@nestjs/common';
import { SubscriptionRepo } from '@common/repos/subscription.repo';
import { InvoiceRepo } from '@common/repos/invoice.repo';
import { SubscriptionStatus, InvoiceStatus } from 'generated/prisma/client';

@Injectable()
export class BillingService {
    constructor(
        private subscriptionRepo: SubscriptionRepo,
        private invoiceRepo: InvoiceRepo,
    ) {}

    async getBillingStats() {
        const activeCount = await this.subscriptionRepo.count({
            where: { status: SubscriptionStatus.ACTIVE },
        });
        const totalCount = await this.subscriptionRepo.count();
        const paidInvoices = await this.invoiceRepo.count({
            where: { status: InvoiceStatus.PAID },
        });
        const overdueInvoices = await this.invoiceRepo.count({
            where: { status: InvoiceStatus.OVERDUE },
        });

        const churnRate =
            totalCount > 0
                ? (((totalCount - activeCount) / totalCount) * 100).toFixed(2)
                : '0.00';

        return {
            activeSubscriptions: activeCount,
            totalSubscriptions: totalCount,
            churnRate: `${churnRate}%`,
            paidInvoices,
            overdueInvoices,
            timestamp: new Date(),
        };
    }

    async getAllSubscriptions(skip?: number, take?: number) {
        return await this.subscriptionRepo.findMany({
            skip,
            take,
        });
    }

    async getSubscriptionsByStatus(
        status: SubscriptionStatus,
        skip?: number,
        take?: number,
    ) {
        return await this.subscriptionRepo.findMany({
            where: { status },
            skip,
            take,
        });
    }

    async getOverdueInvoices() {
        return await this.invoiceRepo.findMany({
            where: { status: InvoiceStatus.OVERDUE },
        });
    }

    async getInvoiceStats() {
        const total = await this.invoiceRepo.count();
        const paid = await this.invoiceRepo.count({
            where: { status: InvoiceStatus.PAID },
        });
        const overdue = await this.invoiceRepo.count({
            where: { status: InvoiceStatus.OVERDUE },
        });
        const draft = await this.invoiceRepo.count({
            where: { status: InvoiceStatus.DRAFT },
        });

        return {
            total,
            paid,
            overdue,
            draft,
            paidPercentage:
                total > 0 ? ((paid / total) * 100).toFixed(2) : '0.00',
        };
    }
}
