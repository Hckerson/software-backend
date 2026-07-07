import { Module } from '@nestjs/common';
import { RepoModule } from '@common/repos/repo.module';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Module({
    imports: [RepoModule],
    providers: [BillingService],
    controllers: [BillingController],
    exports: [BillingService],
})
export class BillingModule {}
