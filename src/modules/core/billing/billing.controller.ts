import {
    Controller,
    Get,
    Query,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '@core/auth/guards';
import { Roles } from '@core/auth/decorators';

import { SubscriptionStatus } from 'generated/prisma/client';

@ApiTags('Billing - Admin Dashboard')
@Controller('admin/billing')
@UseGuards(JwtAuthGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class BillingController {
    constructor(private billingService: BillingService) {}

    @ApiOperation({ summary: 'Get billing statistics' })
    @Get('stats')
    async getBillingStats() {
        return await this.billingService.getBillingStats();
    }

    @ApiOperation({ summary: 'Get all subscriptions' })
    @Get('subscriptions')
    async getAllSubscriptions(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const skip = page && limit ? (parseInt(page) - 1) * parseInt(limit) : 0;
        const take = limit ? parseInt(limit) : 10;

        if (take < 1 || (page && parseInt(page) < 1)) {
            throw new BadRequestException('Invalid pagination parameters');
        }

        return await this.billingService.getAllSubscriptions(skip, take);
    }

    @ApiOperation({ summary: 'Get subscriptions by status' })
    @Get('subscriptions/status/:status')
    async getSubscriptionsByStatus(
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const skip = page && limit ? (parseInt(page) - 1) * parseInt(limit) : 0;
        const take = limit ? parseInt(limit) : 10;

        if (
            !status ||
            !Object.values(SubscriptionStatus).includes(
                status as SubscriptionStatus,
            )
        ) {
            throw new BadRequestException('Invalid subscription status');
        }

        return await this.billingService.getSubscriptionsByStatus(
            status as SubscriptionStatus,
            skip,
            take,
        );
    }

    @ApiOperation({ summary: 'Get overdue invoices' })
    @Get('overdue-invoices')
    async getOverdueInvoices() {
        return await this.billingService.getOverdueInvoices();
    }

    @ApiOperation({ summary: 'Get invoice statistics' })
    @Get('invoice-stats')
    async getInvoiceStats() {
        return await this.billingService.getInvoiceStats();
    }
}
