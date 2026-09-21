import { HttpStatus } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from '@common/database/prisma.service';
import { RepositoryError } from '../errors/repo.error';

@Injectable()
export class SubscriptionPlanRepo {
    constructor(private prisma: PrismaService) {}

    async findUnique<T extends Prisma.SubscriptionPlanFindUniqueArgs>(
        params: T,
    ): Promise<Prisma.SubscriptionPlanGetPayload<T> | null> {
        try {
            return (await this.prisma.subscriptionPlan.findUnique(
                params,
            )) as Prisma.SubscriptionPlanGetPayload<T> | null;
        } catch (error) {
            throw new RepositoryError(
                'Failed to find unique subscription plan',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async findFirst<T extends Prisma.SubscriptionPlanFindFirstArgs>(
        params: T,
    ): Promise<Prisma.SubscriptionPlanGetPayload<T> | null> {
        try {
            return (await this.prisma.subscriptionPlan.findFirst(
                params,
            )) as Prisma.SubscriptionPlanGetPayload<T> | null;
        } catch (error) {
            throw new RepositoryError(
                'Failed to find first subscription plan',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async findMany<T extends Prisma.SubscriptionPlanFindManyArgs>(
        params: T,
    ): Promise<Prisma.SubscriptionPlanGetPayload<T>[]> {
        try {
            return (await this.prisma.subscriptionPlan.findMany(
                params,
            )) as Prisma.SubscriptionPlanGetPayload<T>[];
        } catch (error) {
            throw new RepositoryError(
                'Failed to find subscription plans',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async create<T extends Prisma.SubscriptionPlanCreateArgs>(
        params: T,
    ): Promise<Prisma.SubscriptionPlanGetPayload<T>> {
        try {
            return (await this.prisma.subscriptionPlan.create(
                params,
            )) as Prisma.SubscriptionPlanGetPayload<T>;
        } catch (error) {
            throw new RepositoryError(
                'Failed to create subscription plan',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async createMany(params: Prisma.SubscriptionPlanCreateManyArgs) {
        try {
            return await this.prisma.subscriptionPlan.createMany(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to create subscription plans',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async update<T extends Prisma.SubscriptionPlanUpdateArgs>(
        params: T,
    ): Promise<Prisma.SubscriptionPlanGetPayload<T>> {
        try {
            return (await this.prisma.subscriptionPlan.update(
                params,
            )) as Prisma.SubscriptionPlanGetPayload<T>;
        } catch (error) {
            throw new RepositoryError(
                'Failed to update subscription plan',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async updateMany(params: Prisma.SubscriptionPlanUpdateManyArgs) {
        try {
            return await this.prisma.subscriptionPlan.updateMany(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to update subscription plans',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async delete<T extends Prisma.SubscriptionPlanDeleteArgs>(
        params: T,
    ): Promise<Prisma.SubscriptionPlanGetPayload<T>> {
        try {
            return (await this.prisma.subscriptionPlan.delete(
                params,
            )) as Prisma.SubscriptionPlanGetPayload<T>;
        } catch (error) {
            throw new RepositoryError(
                'Failed to delete subscription plan',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async deleteMany(params: Prisma.SubscriptionPlanDeleteManyArgs) {
        try {
            return await this.prisma.subscriptionPlan.deleteMany(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to delete subscription plans',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async count(params?: Prisma.SubscriptionPlanCountArgs): Promise<number> {
        try {
            return await this.prisma.subscriptionPlan.count(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to count subscription plans',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }
}
