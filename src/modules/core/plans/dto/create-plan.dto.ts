import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlanType } from 'generated/prisma/client';

export class CreatePlanDto {
    @ApiProperty({ description: 'Plan name', example: 'Pro Plan' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Plan description',
        example: 'Our premium plan',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Plan type', enum: PlanType, example: 'PRO' })
    @IsString()
    @IsNotEmpty()
    planType: PlanType;

    @ApiProperty({ description: 'Monthly price in USD', example: 29.99 })
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    priceUSD: number;

    @ApiProperty({
        description: 'Plan features',
        example: { apiCalls: 50000, storage: 50, seats: 5 },
    })
    @IsObject()
    @IsNotEmpty()
    features: Record<string, any>;

    @ApiProperty({
        description: 'Plan limits',
        example: { maxApiCalls: 50000, maxStorage: 50, maxSeats: 5 },
    })
    @IsObject()
    @IsNotEmpty()
    limits: Record<string, any>;

    @ApiProperty({
        description:
            'Price per unit beyond each limit. A metric listed here may exceed its limit and is billed for the excess; a metric left out is a hard cap.',
        example: { API_CALLS: 0.0002 },
        required: false,
    })
    @IsObject()
    @IsOptional()
    overageRates?: Record<string, number>;
}
