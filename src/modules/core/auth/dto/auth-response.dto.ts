import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'generated/prisma/enums';

export class AuthResponseUserDto {
    @ApiProperty() id: string;
    @ApiProperty({ description: 'Alias of fullName' }) name: string;
    @ApiProperty() email: string;
    @ApiProperty({ enum: UserRole }) role: string;
}

export class AuthResponseDto {
    @ApiProperty({ type: AuthResponseUserDto }) user: AuthResponseUserDto;
    @ApiProperty({
        required: false,
        description:
            'Bearer token for non-browser clients. Browsers receive an httpOnly cookie and ignore this field.',
    })
    accessToken?: string;
}
