import { Injectable } from '@nestjs/common';
import { UserRepo } from '@common/repos/user.repo';
import { SubscriptionRepo } from '@common/repos/subscription.repo';
import { InvoiceRepo } from '@common/repos/invoice.repo';
import {
    UserAccountStatus,
    SubscriptionStatus,
    InvoiceStatus,
} from 'generated/prisma/client';

export interface AdminStats {
    totalUsers: number;
    activeUsers: number;
    pendingUsers: number;
    suspendedUsers: number;
    activeSubscriptions: number;
    pastDueSubscriptions: number;
    canceledSubscriptions: number;
    overdueInvoices: number;
    timestamp: string;
}

@Injectable()
export class AdminService {
    constructor(
        private userRepo: UserRepo,
        private subscriptionRepo: SubscriptionRepo,
        private invoiceRepo: InvoiceRepo,
    ) {}

    async getStats(): Promise<AdminStats> {
        const [
            totalUsers,
            activeUsers,
            pendingUsers,
            suspendedUsers,
            activeSubscriptions,
            pastDueSubscriptions,
            canceledSubscriptions,
            overdueInvoices,
        ] = await Promise.all([
            this.userRepo.count(),
            this.userRepo.count({
                where: { status: UserAccountStatus.ACTIVE },
            }),
            this.userRepo.count({
                where: { status: UserAccountStatus.PENDING },
            }),
            this.userRepo.count({
                where: { status: UserAccountStatus.SUSPENDED },
            }),
            this.subscriptionRepo.count({
                where: { status: SubscriptionStatus.ACTIVE },
            }),
            this.subscriptionRepo.count({
                where: { status: SubscriptionStatus.PAST_DUE },
            }),
            this.subscriptionRepo.count({
                where: { status: SubscriptionStatus.CANCELED },
            }),
            this.invoiceRepo.count({
                where: { status: InvoiceStatus.OVERDUE },
            }),
        ]);

        return {
            totalUsers,
            activeUsers,
            pendingUsers,
            suspendedUsers,
            activeSubscriptions,
            pastDueSubscriptions,
            canceledSubscriptions,
            overdueInvoices,
            timestamp: new Date().toISOString(),
        };
    }
}
