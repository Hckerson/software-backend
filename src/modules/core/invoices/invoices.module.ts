import { Module } from '@nestjs/common';
import { RepoModule } from '@common/repos/repo.module';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { BillingCycleService } from '@common/services/billing-cycle.service';
import { InvoiceGeneratorService } from '@common/services/invoice-generator.service';
import { UsageValidatorService } from '@common/services/usage-validator.service';
import { OverageCalculatorService } from '@common/services/overage-calculator.service';

@Module({
    imports: [RepoModule],
    providers: [
        InvoicesService,
        BillingCycleService,
        InvoiceGeneratorService,
        UsageValidatorService,
        OverageCalculatorService,
    ],
    controllers: [InvoicesController],
    exports: [InvoicesService],
})
export class InvoicesModule {}
