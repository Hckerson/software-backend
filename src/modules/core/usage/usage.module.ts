import { Module } from '@nestjs/common';
import { RepoModule } from '@common/repos/repo.module';
import { BillingCycleService } from '@common/services/billing-cycle.service';
import { UsageValidatorService } from '@common/services/usage-validator.service';
import { UsageService } from './usage.service';
import { UsageController } from './usage.controller';

@Module({
    imports: [RepoModule],
    providers: [UsageService, BillingCycleService, UsageValidatorService],
    controllers: [UsageController],
    exports: [UsageService],
})
export class UsageModule {}
