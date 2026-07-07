import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InvoiceQueryDto {
    @ApiProperty({ description: 'Page number', example: 1, required: false })
    @IsNumber()
    @IsOptional()
    @Min(1)
    page?: number = 1;

    @ApiProperty({
        description: 'Items per page',
        example: 10,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Min(1)
    limit?: number = 10;

    @ApiProperty({ description: 'Filter by status', required: false })
    @IsString()
    @IsOptional()
    status?: string;
}
