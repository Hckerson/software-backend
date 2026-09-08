import { JwtAuthGuard } from './guards';
import { AuthService } from './auth.service';

import {
    Post,
    Body,
    Res,
    Request,
    HttpCode,
    UseGuards,
    Controller,
    HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { clearAuthCookie, setAuthCookie } from './auth.cookie';
import {
    LoginDto,
    RegisterDto,
    OnboardingDto,
    ResetPasswordDto,
    ForgotPasswordDto,
    AuthResponseDto,
} from './dto';
import { MessageDto } from '@common/dto';
import {
    ApiTags,
    ApiResponse,
    ApiOperation,
    ApiOkResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
} from '@nestjs/swagger';
import type { RequestWithUser } from '@common/interfaces/req';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiCreatedResponse({
        type: AuthResponseDto,
        description:
            'User successfully registered. Returns user + accessToken.',
    })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async register(
        @Body() dto: RegisterDto,
        @Res({ passthrough: true }) response: Response,
    ) {
        const result = await this.authService.register(dto);

        if (result.accessToken) setAuthCookie(response, result.accessToken);

        return result;
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login and get JWT token' })
    @ApiOkResponse({ type: AuthResponseDto, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) response: Response,
    ) {
        const result = await this.authService.login(dto);

        if (result.accessToken) setAuthCookie(response, result.accessToken);

        return result;
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Clear the session cookie' })
    @ApiOkResponse({ type: MessageDto })
    @ApiResponse({ status: 200, description: 'Session cleared' })
    logout(@Res({ passthrough: true }) response: Response) {
        clearAuthCookie(response);

        return { message: 'Signed out.' };
    }

    // ─── Password Management ──────────────────────────────────────────────────

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request a password reset' })
    @ApiOkResponse({ type: MessageDto })
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset password' })
    @ApiOkResponse({ type: MessageDto })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    // ─── Onboarding ──────────────────────────────────────────────────────────

    @Post('onboarding')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Complete profile onboarding' })
    @ApiOkResponse({ type: MessageDto })
    async onboarding(
        @Body() dto: OnboardingDto,
        @Request() req: RequestWithUser,
    ) {
        return this.authService.onboarding(req.user.id, dto);
    }
}
