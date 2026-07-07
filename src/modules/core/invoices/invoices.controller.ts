import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Prisma } from 'generated/prisma/client';
import { InvoicesService } from './invoices.service';
import { InvoiceQueryDto } from './dto';
import { JwtAuthGuard } from '@core/auth/guards';
import { CurrentUser } from '@core/auth/decorators';

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
    include: { subscription: { include: { plan: true } }; user: true };
}>;

@ApiTags('Billing - Invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoicesController {
    constructor(private invoicesService: InvoicesService) {}

    @ApiOperation({ summary: 'Get user invoices' })
    @Get()
    async getInvoices(
        @CurrentUser('id') userId: string,
        @Query() query: InvoiceQueryDto,
    ): Promise<InvoiceWithRelations[]> {
        return this.invoicesService.getInvoicesByUser(userId, query);
    }

    @ApiOperation({ summary: 'Get invoice by ID' })
    @Get(':id')
    async getInvoiceById(
        @Param('id') id: string,
    ): Promise<InvoiceWithRelations> {
        return this.invoicesService.getInvoiceById(id);
    }

    @ApiOperation({ summary: 'Get upcoming invoice estimate' })
    @Get('upcoming/estimate')
    async getUpcomingInvoice(
        @CurrentUser('subscriptionId') subscriptionId: string,
    ): Promise<{
        subscriptionId: string;
        amount: number;
        dueDate: Date;
        billingPeriodStart: Date;
        billingPeriodEnd: Date;
        planName: string;
    }> {
        return this.invoicesService.getUpcomingInvoice(subscriptionId);
    }

    @ApiOperation({ summary: 'Mark invoice as paid' })
    @Post(':id/mark-paid')
    @HttpCode(HttpStatus.OK)
    async markInvoicePaid(
        @Param('id') id: string,
    ): Promise<InvoiceWithRelations> {
        return this.invoicesService.markInvoicePaid(id);
    }
}
