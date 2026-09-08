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
import { LimitCheckDto, MetricUsageDto, UsageLogDto } from './dto';
import { UsageMetricType } from 'generated/prisma/client';
import {
    ApiTags,
    ApiOperation,
    ApiOkResponse,
    ApiCreatedResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Billing - Usage')
@Controller('usage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsageController {
    constructor(private usageService: UsageService) {}

    @ApiOperation({ summary: 'Track usage' })
    @ApiCreatedResponse({ type: UsageLogDto })
    @Post('track')
    @HttpCode(HttpStatus.CREATED)
    trackUsage(
        @CurrentUser('id') userId: string,
        @Body() trackUsageDto: TrackUsageDto,
    ) {
        return this.usageService.trackUsage(userId, trackUsageDto);
    }

    @ApiOperation({ summary: 'Current period usage for every metric' })
    @ApiOkResponse({ type: MetricUsageDto, isArray: true })
    @Get('current')
    getCurrentUsage(@CurrentUser('id') userId: string) {
        return this.usageService.getCurrentPeriodUsage(userId);
    }

    @ApiOperation({ summary: 'Get usage history' })
    @ApiOkResponse({ type: UsageLogDto, isArray: true })
    @Get('history')
    getUsageHistory(
        @CurrentUser('id') userId: string,
        @Query() query: UsageQueryDto,
    ) {
        return this.usageService.getUsageHistory(userId, query);
    }

    @ApiOperation({ summary: 'Limit status for every metric' })
    @ApiOkResponse({ type: LimitCheckDto, isArray: true })
    @Get('limits')
    checkAllLimits(@CurrentUser('id') userId: string) {
        return this.usageService.checkAllLimits(userId);
    }

    @ApiOperation({ summary: 'Limit status for one metric' })
    @ApiOkResponse({ type: LimitCheckDto })
    @Get('check-limit/:metric')
    checkLimit(
        @CurrentUser('id') userId: string,
        @Param('metric') metric: UsageMetricType,
    ) {
        return this.usageService.checkLimit(userId, metric);
    }
}
