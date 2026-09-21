import { Module } from '@nestjs/common';
import { CycleService } from './cycle.service';
import { CycleScheduler } from './cycle.scheduler';
import { CycleController } from './cycle.controller';
import { CycleTriggerGuard } from './cycle-trigger.guard';
import { JwtAuthGuard, RolesGuard } from '@core/auth/guards';
import { BillingCycleService } from '@common/services/billing-cycle.service';
import { InvoiceGeneratorService } from '@common/services/invoice-generator.service';
import { UsageValidatorService } from '@common/services/usage-validator.service';
import { OverageCalculatorService } from '@common/services/overage-calculator.service';

@Module({
    controllers: [CycleController],
    providers: [
        CycleService,
        CycleScheduler,
        CycleTriggerGuard,
        JwtAuthGuard,
        RolesGuard,
        BillingCycleService,
        InvoiceGeneratorService,
        UsageValidatorService,
        OverageCalculatorService,
    ],
    exports: [CycleService],
})
export class CycleModule {}
