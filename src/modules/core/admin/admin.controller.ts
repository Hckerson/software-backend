import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from 'generated/prisma/enums';
import { AdminService, AdminStats } from './admin.service';
import { JwtAuthGuard, RolesGuard } from '@core/auth/guards';
import { Roles } from '@core/auth/decorators';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('stats')
    @ApiOperation({ summary: 'Platform-wide account and billing counters' })
    getStats(): Promise<AdminStats> {
        return this.adminService.getStats();
    }
}
