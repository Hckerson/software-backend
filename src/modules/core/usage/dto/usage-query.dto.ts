import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UsageQueryDto {
    @ApiProperty({
        description: 'Period key (YYYY-MM format)',
        example: '2026-06',
        required: false,
    })
    @IsString()
    @IsOptional()
    period?: string;
}
