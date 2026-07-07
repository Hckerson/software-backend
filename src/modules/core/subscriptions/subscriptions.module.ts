import { Module } from '@nestjs/common';
import { RepoModule } from '@common/repos/repo.module';
import { BillingCycleService } from '@common/services/billing-cycle.service';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
    imports: [RepoModule],
    providers: [SubscriptionsService, BillingCycleService],
    controllers: [SubscriptionsController],
    exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
