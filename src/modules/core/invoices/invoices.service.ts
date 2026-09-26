import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import {
    Prisma,
    InvoiceStatus,
    SubscriptionStatus,
} from 'generated/prisma/client';
import { InvoiceRepo } from '@common/repos/invoice.repo';
import { SubscriptionRepo } from '@common/repos/subscription.repo';
import { InvoiceQueryDto } from './dto';
import { BillingCycleService } from '@common/services/billing-cycle.service';
import { OverageCalculatorService } from '@common/services/overage-calculator.service';

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
    include: { subscription: { include: { plan: true } }; user: true };
}>;

@Injectable()
export class InvoicesService {
    constructor(
        private invoiceRepo: InvoiceRepo,
        private subscriptionRepo: SubscriptionRepo,
        private billingCycle: BillingCycleService,
        private overageCalculator: OverageCalculatorService,
    ) {}

    async getInvoicesByUser(
        userId: string,
        query: InvoiceQueryDto,
    ): Promise<InvoiceWithRelations[]> {
        const skip = ((query.page || 1) - 1) * (query.limit || 10);
        const take = query.limit || 10;

        return (await this.invoiceRepo.findMany({
            where: { userId },
            include: { subscription: { include: { plan: true } }, user: true },
            skip,
            take,
        })) as InvoiceWithRelations[];
    }

    async getInvoiceById(
        id: string,
        userId?: string,
    ): Promise<InvoiceWithRelations> {
        const invoice = await this.invoiceRepo.findUnique({
            where: { id },
            include: { subscription: { include: { plan: true } }, user: true },
        });
        if (!invoice || (userId && invoice.userId !== userId)) {
            throw new NotFoundException(`Invoice with ID ${id} not found`);
        }
        return invoice as InvoiceWithRelations;
    }

    async getUpcomingInvoice(userId: string): Promise<{
        subscriptionId: string;
        amount: number;
        baseAmount: number;
        overageAmount: number;
        dueDate: Date;
        billingPeriodStart: Date;
        billingPeriodEnd: Date;
        planName: string;
    }> {
        const subscription = await this.subscriptionRepo.findFirst({
            where: { userId, status: SubscriptionStatus.ACTIVE },
            include: { plan: true },
        });
        if (!subscription) {
            throw new NotFoundException(
                `No active subscription found for user ${userId}`,
            );
        }

        const basePriceUSD =
            typeof subscription.plan.priceUSD === 'number'
                ? subscription.plan.priceUSD
                : (
                      subscription.plan.priceUSD as { toNumber(): number }
                  ).toNumber();
        const dueDate = new Date(subscription.currentBillingPeriodEnd);
        dueDate.setDate(dueDate.getDate() + 14);

        const overageAmount = await this.overageCalculator.totalFor(
            subscription,
            this.billingCycle.formatPeriodKey(
                subscription.currentBillingPeriodStart,
            ),
        );

        return {
            subscriptionId: subscription.id,
            amount: basePriceUSD + overageAmount,
            baseAmount: basePriceUSD,
            overageAmount,
            dueDate,
            billingPeriodStart: subscription.currentBillingPeriodStart,
            billingPeriodEnd: subscription.currentBillingPeriodEnd,
            planName: subscription.plan.name,
        };
    }

    async markInvoicePaid(
        id: string,
        userId?: string,
    ): Promise<InvoiceWithRelations> {
        const invoice = await this.getInvoiceById(id, userId);

        if (invoice.status === InvoiceStatus.PAID) {
            throw new BadRequestException('Invoice is already marked as paid');
        }

        return (await this.invoiceRepo.update({
            where: { id },
            data: {
                status: InvoiceStatus.PAID,
                paidDate: new Date(),
            },
        })) as InvoiceWithRelations;
    }

    async markInvoiceOverdue(id: string): Promise<InvoiceWithRelations> {
        const invoice = await this.getInvoiceById(id);

        if (invoice.status === InvoiceStatus.PAID) {
            throw new BadRequestException(
                'Cannot mark a paid invoice as overdue',
            );
        }

        return (await this.invoiceRepo.update({
            where: { id },
            data: { status: InvoiceStatus.OVERDUE },
        })) as InvoiceWithRelations;
    }

    async getOverdueInvoices(): Promise<InvoiceWithRelations[]> {
        return (await this.invoiceRepo.findMany({
            where: { status: InvoiceStatus.OVERDUE },
            include: { subscription: { include: { plan: true } }, user: true },
        })) as InvoiceWithRelations[];
    }

    async countInvoices(status?: InvoiceStatus): Promise<number> {
        return await this.invoiceRepo.count(
            status ? { where: { status } } : undefined,
        );
    }
}
