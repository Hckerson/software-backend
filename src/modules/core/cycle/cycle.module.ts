import { Module } from '@nestjs/common';
import { CycleService } from './cycle.service';
import { CycleController } from './cycle.controller';
import { BillingCycleService } from '@common/services/billing-cycle.service';
import { InvoiceGeneratorService } from '@common/services/invoice-generator.service';
import { UsageValidatorService } from '@common/services/usage-validator.service';

@Module({
    controllers: [CycleController],
    providers: [
        CycleService,
        BillingCycleService,
        InvoiceGeneratorService,
        UsageValidatorService,
    ],
    exports: [CycleService],
})
export class CycleModule {}
