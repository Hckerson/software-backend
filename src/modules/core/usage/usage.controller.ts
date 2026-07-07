import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { UsageService } from './usage.service';
import { JwtAuthGuard } from '@core/auth/guards';
import { CurrentUser } from '@core/auth/decorators';
import { TrackUsageDto, UsageQueryDto } from './dto';
import { UsageMetricType, UsageLog } from 'generated/prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Billing - Usage')
@Controller('usage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsageController {
    constructor(private usageService: UsageService) {}

    @ApiOperation({ summary: 'Track usage' })
    @Post('track')
    @HttpCode(HttpStatus.CREATED)
    async trackUsage(
        @CurrentUser('id') userId: string,
        @Body() trackUsageDto: TrackUsageDto,
    ): Promise<UsageLog> {
        const result = await this.usageService.trackUsage(
            userId,
            trackUsageDto,
        );
        return result;
    }

    @ApiOperation({ summary: 'Get current period usage' })
    @Get('current')
    async getCurrentUsage(
        @CurrentUser('id') userId: string,
    ): Promise<
        | UsageLog
        | UsageLog[]
        | { amount: number; metricType: UsageMetricType; period: string }
    > {
        const result = await this.usageService.getCurrentPeriodUsage(userId);
        return result;
    }

    @ApiOperation({ summary: 'Get usage history' })
    @Get('history')
    async getUsageHistory(
        @CurrentUser('id') userId: string,
        @Query() query: UsageQueryDto,
    ): Promise<UsageLog[]> {
        const result = await this.usageService.getUsageHistory(userId, query);
        return result;
    }

    @ApiOperation({ summary: 'Check limit for metric' })
    @Get('check-limit/:metric')
    async checkLimit(
        @CurrentUser('id') userId: string,
        @Param('metric') metric: string,
    ): Promise<{
        isAllowed: boolean;
        remainingQuota: number;
        percentageUsed: number;
    }> {
        const result = await this.usageService.checkLimit(
            userId,
            metric as UsageMetricType,
        );
        return result;
    }
}
