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

    @ApiProperty({
        type: Number,
        nullable: true,
        example: 0.0002,
        description:
            'Price per unit beyond the limit. null means this metric is a hard cap.',
    })
    overageRate: number | null;

    @ApiProperty({ example: 12500, description: 'Units beyond the limit' })
    overageUnits: number;

    @ApiProperty({ example: 2.5, description: 'overageUnits x overageRate' })
    overageCharge: number;
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
