import { ApiProperty } from '@nestjs/swagger';
import { UsageMetricType } from 'generated/prisma/enums';

export class MetricUsageDto {
    @ApiProperty({ enum: UsageMetricType })
    metricType: UsageMetricType;

    @ApiProperty({ example: 412500 })
    amount: number;

    @ApiProperty({ example: '2026-09' })
    period: string;
}

export class LimitCheckDto {
    @ApiProperty({ enum: UsageMetricType })
    metricType: UsageMetricType;

    @ApiProperty({
        type: Number,
        nullable: true,
        description: 'null means the plan does not cap this metric',
    })
    limit: number | null;

    @ApiProperty({ example: 412500 })
    consumed: number;

    @ApiProperty({ type: Number, nullable: true })
    remainingQuota: number | null;

    @ApiProperty({ example: 82.5 })
    percentageUsed: number;

    @ApiProperty({ example: true })
    isAllowed: boolean;
}

export class UsageLogDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    subscriptionId: string;

    @ApiProperty({ enum: UsageMetricType })
    metricType: UsageMetricType;

    @ApiProperty({ example: 412500 })
    amount: number;

    @ApiProperty({ example: '2026-09' })
    period: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
