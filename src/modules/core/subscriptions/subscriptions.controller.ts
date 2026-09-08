import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Prisma } from 'generated/prisma/client';
import { SubscriptionsService } from './subscriptions.service';
import { SelectPlanDto, ChangePlanDto } from './dto';
import { JwtAuthGuard } from '@core/auth/guards';
import { CurrentUser } from '@core/auth/decorators';
import { ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { SubscriptionDto } from '@common/dto';

type SubscriptionWithRelations = Prisma.SubscriptionGetPayload<{
    include: { plan: true; user: true };
}>;

@ApiTags('Billing - Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionsController {
    constructor(private subscriptionsService: SubscriptionsService) {}

    @ApiOperation({ summary: 'Get current active subscription' })
    @ApiOkResponse({ type: SubscriptionDto })
    @Get('current')
    async getCurrentSubscription(
        @CurrentUser('id') userId: string,
    ): Promise<SubscriptionWithRelations> {
        return this.subscriptionsService.getActiveSubscription(userId);
    }

    @ApiOperation({ summary: 'Get subscription history' })
    @ApiOkResponse({ type: SubscriptionDto, isArray: true })
    @Get('history')
    async getSubscriptionHistory(
        @CurrentUser('id') userId: string,
    ): Promise<SubscriptionWithRelations[]> {
        return this.subscriptionsService.getSubscriptionHistory(userId);
    }

    @ApiOperation({ summary: 'Select plan at signup' })
    @ApiCreatedResponse({ type: SubscriptionDto })
    @Post('select-plan')
    @HttpCode(HttpStatus.CREATED)
    async selectPlan(
        @CurrentUser('id') userId: string,
        @Body() selectPlanDto: SelectPlanDto,
    ): Promise<SubscriptionWithRelations> {
        return this.subscriptionsService.selectPlanAtSignup(
            userId,
            selectPlanDto,
        );
    }

    @ApiOperation({ summary: 'Change to different plan' })
    @ApiOkResponse({ type: SubscriptionDto })
    @Post('change-plan')
    async changePlan(
        @CurrentUser('id') userId: string,
        @Body() changePlanDto: ChangePlanDto,
    ): Promise<SubscriptionWithRelations> {
        return this.subscriptionsService.changePlan(userId, changePlanDto);
    }

    @ApiOperation({ summary: 'Cancel subscription' })
    @ApiOkResponse({ type: SubscriptionDto })
    @Post('cancel')
    async cancelSubscription(
        @CurrentUser('id') userId: string,
    ): Promise<SubscriptionWithRelations> {
        return this.subscriptionsService.cancelSubscription(userId);
    }

    @ApiOperation({ summary: 'Reactivate subscription' })
    @ApiOkResponse({ type: SubscriptionDto })
    @Post('reactivate')
    async reactivateSubscription(
        @CurrentUser('id') userId: string,
    ): Promise<SubscriptionWithRelations> {
        return this.subscriptionsService.reactivateSubscription(userId);
    }
}
