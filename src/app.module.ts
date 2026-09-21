import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AuthModule } from '@core/auth/auth.module';
import { UsersModule } from '@core/users/users.module';
import { AdminModule } from '@core/admin/admin.module';
import { RepoModule } from '@common/repos/repo.module';
import { PrismaModule } from '@common/database/prisma.module';
import { PlansModule } from '@core/plans/plans.module';
import { SubscriptionsModule } from '@core/subscriptions/subscriptions.module';
import { InvoicesModule } from '@core/invoices/invoices.module';
import { UsageModule } from '@core/usage/usage.module';
import { BillingModule } from '@core/billing/billing.module';
import { CycleModule } from '@core/cycle/cycle.module';
import { PaymentMethodsModule } from '@core/payment-methods/payment-methods.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ScheduleModule.forRoot(),
        PrismaModule,
        RepoModule,
        AuthModule,
        UsersModule,
        AdminModule,
        PlansModule,
        SubscriptionsModule,
        InvoicesModule,
        UsageModule,
        BillingModule,
        CycleModule,
        PaymentMethodsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
