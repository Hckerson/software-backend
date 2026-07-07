import { UserRepo } from './user.repo';
import { SubscriptionPlanRepo } from './subscription-plan.repo';
import { SubscriptionRepo } from './subscription.repo';
import { InvoiceRepo } from './invoice.repo';
import { UsageLogRepo } from './usage-log.repo';
import { PaymentMethodRepo } from './payment-method.repo';
import { BillingAuditRepo } from './billing-audit.repo';
import { Global, Module } from '@nestjs/common';

const repos = [
    UserRepo,
    SubscriptionPlanRepo,
    SubscriptionRepo,
    InvoiceRepo,
    UsageLogRepo,
    PaymentMethodRepo,
    BillingAuditRepo,
];

@Global()
@Module({
    providers: repos,
    exports: repos,
})
export class RepoModule {}
