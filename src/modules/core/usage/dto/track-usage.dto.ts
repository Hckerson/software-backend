import { IsNotEmpty, IsNumber, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UsageMetricType } from 'generated/prisma/client';

export class TrackUsageDto {
    @ApiProperty({
        description: 'Usage metric type',
        enum: UsageMetricType,
        example: 'API_CALLS',
    })
    @IsEnum(UsageMetricType)
    @IsNotEmpty()
    metricType: UsageMetricType;

    @ApiProperty({ description: 'Amount used', example: 1500 })
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    amount: number;
}
