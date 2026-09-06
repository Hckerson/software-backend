import { ApiProperty } from '@nestjs/swagger';
import {
    InvoiceStatus,
    PlanType,
    SubscriptionStatus,
    UserAccountStatus,
    UserRole,
} from 'generated/prisma/enums';

export class PublicUserDto {
    @ApiProperty() id: string;
    @ApiProperty() fullName: string;
    @ApiProperty() email: string;
    @ApiProperty({ type: String, nullable: true }) phoneNumber: string | null;
    @ApiProperty({ type: String, nullable: true }) avatar: string | null;
    @ApiProperty({ type: String, nullable: true }) bio: string | null;
    @ApiProperty({ enum: UserRole }) role: UserRole;
    @ApiProperty({ enum: UserAccountStatus }) status: UserAccountStatus;
    @ApiProperty({ type: Date, nullable: true }) lastActive: Date | null;
    @ApiProperty() createdAt: Date;
    @ApiProperty() updatedAt: Date;
}

export class SubscriptionPlanDto {
    @ApiProperty() id: string;
    @ApiProperty() name: string;
    @ApiProperty({ type: String, nullable: true }) description: string | null;
    @ApiProperty({
        type: String,
        description: 'Decimal serialised as a string',
        example: '49.00',
    })
    priceUSD: string;
    @ApiProperty({ enum: PlanType }) planType: PlanType;
    @ApiProperty({ type: Object }) features: Record<string, unknown>;
    @ApiProperty({
        type: Object,
        description: 'Metric limits; a missing metric means unlimited',
        example: { API_CALLS: 500000, STORAGE_GB: 100, SEATS: 10 },
    })
    limits: Record<string, number>;
    @ApiProperty() isActive: boolean;
    @ApiProperty() createdAt: Date;
    @ApiProperty() updatedAt: Date;
}

export class SubscriptionDto {
    @ApiProperty() id: string;
    @ApiProperty() userId: string;
    @ApiProperty() planId: string;
    @ApiProperty() startDate: Date;
    @ApiProperty() renewalDate: Date;
    @ApiProperty({ type: Date, nullable: true }) canceledAt: Date | null;
    @ApiProperty() currentBillingPeriodStart: Date;
    @ApiProperty() currentBillingPeriodEnd: Date;
    @ApiProperty({ enum: SubscriptionStatus }) status: SubscriptionStatus;
    @ApiProperty({ type: SubscriptionPlanDto, required: false })
    plan?: SubscriptionPlanDto;
    @ApiProperty({ type: PublicUserDto, required: false })
    user?: PublicUserDto;
}

export class InvoiceDto {
    @ApiProperty() id: string;
    @ApiProperty() subscriptionId: string;
    @ApiProperty() userId: string;
    @ApiProperty({ type: String, example: '49.00' }) amount: string;
    @ApiProperty({ type: String, nullable: true })
    stripeInvoiceId: string | null;
    @ApiProperty({ type: Date, nullable: true }) paidDate: Date | null;
    @ApiProperty() billingPeriodStart: Date;
    @ApiProperty() billingPeriodEnd: Date;
    @ApiProperty() dueDate: Date;
    @ApiProperty({ enum: InvoiceStatus }) status: InvoiceStatus;
}

export class UpcomingInvoiceDto {
    @ApiProperty() subscriptionId: string;
    @ApiProperty({ example: 49 }) amount: number;
    @ApiProperty() dueDate: Date;
    @ApiProperty() billingPeriodStart: Date;
    @ApiProperty() billingPeriodEnd: Date;
    @ApiProperty() planName: string;
}

export class AdminStatsDto {
    @ApiProperty() totalUsers: number;
    @ApiProperty() activeUsers: number;
    @ApiProperty() pendingUsers: number;
    @ApiProperty() suspendedUsers: number;
    @ApiProperty() activeSubscriptions: number;
    @ApiProperty() pastDueSubscriptions: number;
    @ApiProperty() canceledSubscriptions: number;
    @ApiProperty() overdueInvoices: number;
    @ApiProperty() timestamp: string;
}

export class BillingStatsDto {
    @ApiProperty() activeSubscriptions: number;
    @ApiProperty() totalSubscriptions: number;
    @ApiProperty({ example: '12.50%' }) churnRate: string;
    @ApiProperty() paidInvoices: number;
    @ApiProperty() overdueInvoices: number;
    @ApiProperty() timestamp: Date;
}

export class InvoiceStatsDto {
    @ApiProperty() total: number;
    @ApiProperty() paid: number;
    @ApiProperty() overdue: number;
    @ApiProperty() draft: number;
    @ApiProperty({ example: '66.67' }) paidPercentage: string;
}

export class MessageDto {
    @ApiProperty({ example: 'Password reset successful.' }) message: string;
}
