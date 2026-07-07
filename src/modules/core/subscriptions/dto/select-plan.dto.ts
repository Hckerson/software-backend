import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SelectPlanDto {
    @ApiProperty({
        description: 'Subscription plan ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    planId: string;
}
