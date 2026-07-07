import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PlanType } from 'generated/prisma/client';
import { SubscriptionPlanRepo } from '@common/repos/subscription-plan.repo';
import { CreatePlanDto, UpdatePlanDto } from './dto';

@Injectable()
export class PlansService {
    constructor(private planRepo: SubscriptionPlanRepo) {}

    async getAllPlans() {
        return await this.planRepo.findMany({});
    }

    async getPlanById(id: string) {
        const plan = await this.planRepo.findUnique({ where: { id } });
        if (!plan) {
            throw new NotFoundException(`Plan with ID ${id} not found`);
        }
        return plan;
    }

    async getPlanByType(planType: string) {
        const plan = await this.planRepo.findFirst({
            where: { planType: planType as PlanType },
        });
        if (!plan) {
            throw new NotFoundException(`Plan with type ${planType} not found`);
        }
        return plan;
    }

    async createPlan(createPlanDto: CreatePlanDto) {
        const { name, description, planType, priceUSD, features, limits } =
            createPlanDto;

        const existingPlan = await this.planRepo.findUnique({
            where: { name },
        });
        if (existingPlan) {
            throw new BadRequestException(
                `Plan with name "${name}" already exists`,
            );
        }

        return await this.planRepo.create({
            data: {
                name,
                description,
                planType,
                priceUSD,
                features,
                limits,
                isActive: true,
            },
        });
    }

    async updatePlan(id: string, updatePlanDto: UpdatePlanDto) {
        await this.getPlanById(id); // Verify plan exists

        return await this.planRepo.update({
            where: { id },
            data: updatePlanDto,
        });
    }

    async deletePlan(id: string) {
        await this.getPlanById(id);
        return await this.planRepo.delete({ where: { id } });
    }

    async deactivatePlan(id: string) {
        await this.getPlanById(id);
        return await this.planRepo.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async activatePlan(id: string) {
        await this.getPlanById(id);
        return await this.planRepo.update({
            where: { id },
            data: { isActive: true },
        });
    }

    async countActivePlans(): Promise<number> {
        return await this.planRepo.count({ where: { isActive: true } });
    }
}
