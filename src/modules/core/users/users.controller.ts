import { UsersService } from './users.service';
import { UserRole } from 'generated/prisma/enums';
import { CreateUserDto, UpdateUserDto } from './dto';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { assertCanActOn, scopeUpdate } from './users.access';
import type { AuthUser } from '@core/auth/types/auth.types';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { metricBuilder } from 'src/lib/metric-builder';
import { Prisma } from 'generated/prisma/client';
import { ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { PublicUserDto } from '@common/dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @Roles(UserRole.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Create a new user (Admin only)' })
    @ApiCreatedResponse({ type: PublicUserDto })
    create(@Body() createUserDto: CreateUserDto) {
        const data = metricBuilder<Prisma.UserCreateInput>(createUserDto);
        return this.usersService.create(data);
    }

    @ApiOkResponse({ type: PublicUserDto, isArray: true })
    @Get()
    @Roles(UserRole.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get all users (Admin only)' })
    findAll() {
        return this.usersService.findAll();
    }

    @ApiOkResponse({ type: PublicUserDto })
    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get current user profile' })
    getMe(@CurrentUser('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiOkResponse({ type: PublicUserDto })
    findOne(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
        assertCanActOn(actor, id);
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update user profile' })
    @ApiOkResponse({ type: PublicUserDto })
    update(
        @CurrentUser() actor: AuthUser,
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        assertCanActOn(actor, id);
        return this.usersService.update(id, scopeUpdate(actor, updateUserDto));
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Delete user (Admin only)' })
    @ApiOkResponse({ type: PublicUserDto })
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
