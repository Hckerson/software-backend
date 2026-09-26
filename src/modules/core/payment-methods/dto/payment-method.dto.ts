import { ApiProperty } from '@nestjs/swagger';
import {
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
    Max,
    Min,
} from 'class-validator';

const MIN_MONTH = 1;
const MAX_MONTH = 12;
const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

export class CreatePaymentMethodDto {
    @ApiProperty({
        example: 'tok_visa',
        description:
            'Processor token from the client-side integration. Card data never reaches this API.',
    })
    @IsString()
    @IsNotEmpty()
    stripeToken: string;

    @ApiProperty({ example: '4242' })
    @IsString()
    @Length(4, 4)
    last4Digits: string;

    @ApiProperty({ example: 12 })
    @IsInt()
    @Min(MIN_MONTH)
    @Max(MAX_MONTH)
    expiryMonth: number;

    @ApiProperty({ example: 2028 })
    @IsInt()
    @Min(MIN_YEAR)
    @Max(MAX_YEAR)
    expiryYear: number;

    @ApiProperty({ required: false, default: true })
    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}

export class PaymentMethodDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    userId: string;

    @ApiProperty({ example: '4242' })
    last4Digits: string;

    @ApiProperty({ example: 12 })
    expiryMonth: number;

    @ApiProperty({ example: 2028 })
    expiryYear: number;

    @ApiProperty()
    isDefault: boolean;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
