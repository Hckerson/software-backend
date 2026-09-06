import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UsageMetricType } from 'generated/prisma/enums';

export class UsageQueryDto {
    @ApiProperty({
        description: 'Period key (YYYY-MM format)',
        example: '2026-06',
        required: false,
    })
    @IsString()
    @IsOptional()
    period?: string;

    @ApiProperty({
        enum: UsageMetricType,
        required: false,
        description: 'Restrict the history to a single metric',
    })
    @IsEnum(UsageMetricType)
    @IsOptional()
    metricType?: UsageMetricType;
}
