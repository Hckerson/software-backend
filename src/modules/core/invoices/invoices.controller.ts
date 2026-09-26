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
import { ApiOkResponse } from '@nestjs/swagger';
import { InvoiceDto, UpcomingInvoiceDto } from '@common/dto';

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
    @ApiOkResponse({ type: InvoiceDto, isArray: true })
    @Get()
    async getInvoices(
        @CurrentUser('id') userId: string,
        @Query() query: InvoiceQueryDto,
    ): Promise<InvoiceWithRelations[]> {
        return this.invoicesService.getInvoicesByUser(userId, query);
    }

    @ApiOperation({ summary: 'Get invoice by ID' })
    @ApiOkResponse({ type: InvoiceDto })
    @Get(':id')
    async getInvoiceById(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
    ): Promise<InvoiceWithRelations> {
        return this.invoicesService.getInvoiceById(id, userId);
    }

    @ApiOperation({ summary: 'Get upcoming invoice estimate' })
    @ApiOkResponse({ type: UpcomingInvoiceDto })
    @Get('upcoming/estimate')
    async getUpcomingInvoice(@CurrentUser('id') userId: string): Promise<{
        subscriptionId: string;
        amount: number;
        dueDate: Date;
        billingPeriodStart: Date;
        billingPeriodEnd: Date;
        planName: string;
    }> {
        return this.invoicesService.getUpcomingInvoice(userId);
    }

    @ApiOperation({ summary: 'Mark invoice as paid' })
    @ApiOkResponse({ type: InvoiceDto })
    @Post(':id/mark-paid')
    @HttpCode(HttpStatus.OK)
    async markInvoicePaid(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
    ): Promise<InvoiceWithRelations> {
        return this.invoicesService.markInvoicePaid(id, userId);
    }
}
