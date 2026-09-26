import {
    Controller,
    Post,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiOkResponse,
    ApiHeader,
} from '@nestjs/swagger';
import { UserRole } from 'generated/prisma/enums';
import { CycleService } from './cycle.service';
import { JwtAuthGuard, RolesGuard } from '@core/auth/guards';
import { Roles } from '@core/auth/decorators';
import { CycleRunSummaryDto, CycleRunAllDto } from './dto';
import { InvoiceDto } from '@common/dto';
import { CycleTriggerGuard } from './cycle-trigger.guard';

@ApiTags('Billing - Cycle')
@Controller('admin/billing/cycle')
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class CycleController {
    constructor(private cycleService: CycleService) {}

    @ApiOperation({
        summary: 'Run renewal and the overdue sweep. Idempotent.',
    })
    @ApiOkResponse({ type: CycleRunAllDto })
    @ApiHeader({
        name: 'X-Cycle-Token',
        required: false,
        description:
            'Shared secret from CYCLE_TRIGGER_TOKEN, for an external scheduler. Without it, an admin session is required.',
    })
    @UseGuards(CycleTriggerGuard)
    @Post('run')
    @HttpCode(HttpStatus.OK)
    runAll() {
        return this.cycleService.runAll();
    }

    @ApiOperation({ summary: 'Renew subscriptions past their period end' })
    @ApiOkResponse({ type: CycleRunSummaryDto })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('renew')
    @HttpCode(HttpStatus.OK)
    renew() {
        return this.cycleService.renewDueSubscriptions();
    }

    @ApiOperation({ summary: 'Mark sent invoices past due as overdue' })
    @ApiOkResponse({ type: CycleRunSummaryDto })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('sweep-overdue')
    @HttpCode(HttpStatus.OK)
    sweepOverdue() {
        return this.cycleService.markOverdueInvoices();
    }

    @ApiOperation({ summary: 'Issue the invoice for a subscription period' })
    @ApiOkResponse({ type: InvoiceDto })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('subscriptions/:id/issue-invoice')
    @HttpCode(HttpStatus.OK)
    issueInvoice(@Param('id') id: string) {
        return this.cycleService.issueInvoiceForPeriod(id);
    }
}
