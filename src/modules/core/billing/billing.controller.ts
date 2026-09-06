import {
    Controller,
    Get,
    Query,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard, RolesGuard } from '@core/auth/guards';
import { Roles } from '@core/auth/decorators';

import { SubscriptionStatus } from 'generated/prisma/client';
import { ApiOkResponse } from '@nestjs/swagger';
import {
    BillingStatsDto,
    InvoiceStatsDto,
    SubscriptionDto,
    InvoiceDto,
} from '@common/dto';

@ApiTags('Billing - Admin Dashboard')
@Controller('admin/billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class BillingController {
    constructor(private billingService: BillingService) {}

    @ApiOperation({ summary: 'Get billing statistics' })
    @ApiOkResponse({ type: BillingStatsDto })
    @Get('stats')
    async getBillingStats() {
        return await this.billingService.getBillingStats();
    }

    @ApiOperation({ summary: 'Get all subscriptions' })
    @ApiOkResponse({ type: SubscriptionDto, isArray: true })
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
    @ApiOkResponse({ type: SubscriptionDto, isArray: true })
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
    @ApiOkResponse({ type: InvoiceDto, isArray: true })
    @Get('overdue-invoices')
    async getOverdueInvoices() {
        return await this.billingService.getOverdueInvoices();
    }

    @ApiOperation({ summary: 'Get invoice statistics' })
    @ApiOkResponse({ type: InvoiceStatsDto })
    @Get('invoice-stats')
    async getInvoiceStats() {
        return await this.billingService.getInvoiceStats();
    }
}
