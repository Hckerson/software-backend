import { Module } from '@nestjs/common';
import { CycleService } from './cycle.service';
import { CycleScheduler } from './cycle.scheduler';
import { CycleController } from './cycle.controller';
import { BillingCycleService } from '@common/services/billing-cycle.service';
import { InvoiceGeneratorService } from '@common/services/invoice-generator.service';
import { UsageValidatorService } from '@common/services/usage-validator.service';
import { OverageCalculatorService } from '@common/services/overage-calculator.service';

@Module({
    controllers: [CycleController],
    providers: [
        CycleService,
        CycleScheduler,
        BillingCycleService,
        InvoiceGeneratorService,
        UsageValidatorService,
        OverageCalculatorService,
    ],
    exports: [CycleService],
})
export class CycleModule {}
