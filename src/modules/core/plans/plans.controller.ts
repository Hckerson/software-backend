import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '@core/auth/guards';
import { Roles } from '@core/auth/decorators';
import {
    ApiOkResponse,
    ApiCreatedResponse,
    ApiNoContentResponse,
} from '@nestjs/swagger';
import { SubscriptionPlanDto } from '@common/dto';

@ApiTags('Billing - Plans')
@Controller('billing/plans')
export class PlansController {
    constructor(private plansService: PlansService) {}

    @ApiOperation({ summary: 'Get all subscription plans' })
    @ApiOkResponse({ type: SubscriptionPlanDto, isArray: true })
    @Get()
    async getAllPlans() {
        return await this.plansService.getAllPlans();
    }

    @ApiOperation({ summary: 'Get plan by ID' })
    @ApiOkResponse({ type: SubscriptionPlanDto })
    @Get(':id')
    async getPlanById(@Param('id') id: string) {
        return await this.plansService.getPlanById(id);
    }

    @ApiOperation({ summary: 'Create new subscription plan (admin only)' })
    @ApiCreatedResponse({ type: SubscriptionPlanDto })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createPlan(@Body() createPlanDto: CreatePlanDto) {
        return await this.plansService.createPlan(createPlanDto);
    }

    @ApiOperation({ summary: 'Update subscription plan (admin only)' })
    @ApiOkResponse({ type: SubscriptionPlanDto })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id')
    async updatePlan(
        @Param('id') id: string,
        @Body() updatePlanDto: UpdatePlanDto,
    ) {
        return await this.plansService.updatePlan(id, updatePlanDto);
    }

    @ApiOperation({ summary: 'Delete subscription plan (admin only)' })
    @ApiNoContentResponse()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deletePlan(@Param('id') id: string) {
        await this.plansService.deletePlan(id);
    }

    @ApiOperation({ summary: 'Deactivate plan (admin only)' })
    @ApiOkResponse({ type: SubscriptionPlanDto })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id/deactivate')
    async deactivatePlan(@Param('id') id: string) {
        return await this.plansService.deactivatePlan(id);
    }

    @ApiOperation({ summary: 'Activate plan (admin only)' })
    @ApiOkResponse({ type: SubscriptionPlanDto })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id/activate')
    async activatePlan(@Param('id') id: string) {
        return await this.plansService.activatePlan(id);
    }
}
