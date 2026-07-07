import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { Prisma, SubscriptionStatus } from 'generated/prisma/client';
import { SubscriptionRepo } from '@common/repos/subscription.repo';
import { SubscriptionPlanRepo } from '@common/repos/subscription-plan.repo';
import { BillingAuditRepo } from '@common/repos/billing-audit.repo';
import { BillingCycleService } from '@common/services/billing-cycle.service';
import { SelectPlanDto, ChangePlanDto } from './dto';

type SubscriptionWithRelations = Prisma.SubscriptionGetPayload<{
    include: { plan: true; user: true };
}>;

@Injectable()
export class SubscriptionsService {
    constructor(
        private subscriptionRepo: SubscriptionRepo,
        private planRepo: SubscriptionPlanRepo,
        private auditRepo: BillingAuditRepo,
        private billingCycle: BillingCycleService,
    ) {}

    async getActiveSubscription(
        userId: string,
    ): Promise<SubscriptionWithRelations> {
        const subscription = await this.subscriptionRepo.findFirst({
            where: { userId, status: SubscriptionStatus.ACTIVE },
            include: { plan: true, user: true },
        });
        if (!subscription) {
            throw new NotFoundException(
                `No active subscription found for user ${userId}`,
            );
        }
        return subscription;
    }

    async getSubscriptionHistory(
        userId: string,
    ): Promise<SubscriptionWithRelations[]> {
        return await this.subscriptionRepo.findMany({
            where: { userId },
            include: { plan: true, user: true },
        });
    }

    async selectPlanAtSignup(
        userId: string,
        selectPlanDto: SelectPlanDto,
    ): Promise<SubscriptionWithRelations> {
        const plan = await this.planRepo.findUnique({
            where: { id: selectPlanDto.planId },
        });
        if (!plan) {
            throw new NotFoundException(
                `Plan with ID ${selectPlanDto.planId} not found`,
            );
        }

        const now = new Date();
        const renewalDate = this.billingCycle.calculateNextRenewalDate(now);
        const billingPeriodEnd =
            this.billingCycle.calculateBillingPeriodEnd(now);

        const subscription = await this.subscriptionRepo.create({
            data: {
                user: { connect: { id: userId } },
                plan: { connect: { id: selectPlanDto.planId } },
                status: SubscriptionStatus.ACTIVE,
                startDate: now,
                renewalDate,
                currentBillingPeriodStart: now,
                currentBillingPeriodEnd: billingPeriodEnd,
            },
            include: { plan: true, user: true },
        });

        await this.auditRepo.create({
            data: {
                subscription: { connect: { id: subscription.id } },
                action: 'subscription_created',
                newValue: {
                    planId: selectPlanDto.planId,
                    status: SubscriptionStatus.ACTIVE,
                },
            },
        });

        return subscription;
    }

    async changePlan(
        userId: string,
        changePlanDto: ChangePlanDto,
    ): Promise<SubscriptionWithRelations> {
        const currentSubscription = await this.getActiveSubscription(userId);

        const newPlan = await this.planRepo.findUnique({
            where: { id: changePlanDto.newPlanId },
        });
        if (!newPlan) {
            throw new NotFoundException(
                `Plan with ID ${changePlanDto.newPlanId} not found`,
            );
        }

        if (currentSubscription.planId === changePlanDto.newPlanId) {
            throw new BadRequestException(
                'User is already subscribed to this plan',
            );
        }

        const updatedSubscription = await this.subscriptionRepo.update({
            where: { id: currentSubscription.id },
            data: {
                plan: { connect: { id: changePlanDto.newPlanId } },
            },
            include: { plan: true, user: true },
        });

        await this.auditRepo.create({
            data: {
                subscription: { connect: { id: currentSubscription.id } },
                action: 'plan_changed',
                oldValue: { planId: currentSubscription.planId },
                newValue: { planId: changePlanDto.newPlanId },
            },
        });

        return updatedSubscription;
    }

    async cancelSubscription(
        userId: string,
    ): Promise<SubscriptionWithRelations> {
        const subscription = await this.getActiveSubscription(userId);

        const canceledSubscription = await this.subscriptionRepo.update({
            where: { id: subscription.id },
            data: {
                status: SubscriptionStatus.CANCELED,
                canceledAt: new Date(),
            },
            include: { plan: true, user: true },
        });

        await this.auditRepo.create({
            data: {
                subscription: { connect: { id: subscription.id } },
                action: 'subscription_canceled',
                oldValue: { status: SubscriptionStatus.ACTIVE },
                newValue: { status: SubscriptionStatus.CANCELED },
            },
        });

        return canceledSubscription;
    }

    async reactivateSubscription(
        userId: string,
    ): Promise<SubscriptionWithRelations> {
        const subscriptions = await this.subscriptionRepo.findMany({
            where: {
                userId,
                status: SubscriptionStatus.CANCELED,
            },
            include: { plan: true, user: true },
        });

        if (subscriptions.length === 0) {
            throw new NotFoundException(
                `No canceled subscription found for user ${userId}`,
            );
        }

        const lastCanceledSub = subscriptions[0];
        const now = new Date();
        const renewalDate = this.billingCycle.calculateNextRenewalDate(now);

        const reactivated = await this.subscriptionRepo.update({
            where: { id: lastCanceledSub.id },
            data: {
                status: SubscriptionStatus.ACTIVE,
                canceledAt: null,
                startDate: now,
                renewalDate,
                currentBillingPeriodStart: now,
                currentBillingPeriodEnd:
                    this.billingCycle.calculateBillingPeriodEnd(now),
            },
            include: { plan: true, user: true },
        });

        await this.auditRepo.create({
            data: {
                subscription: { connect: { id: lastCanceledSub.id } },
                action: 'subscription_reactivated',
                oldValue: { status: SubscriptionStatus.CANCELED },
                newValue: { status: SubscriptionStatus.ACTIVE },
            },
        });

        return reactivated;
    }

    async countActiveSubscriptions(): Promise<number> {
        return await this.subscriptionRepo.count({
            where: { status: SubscriptionStatus.ACTIVE },
        });
    }
}
