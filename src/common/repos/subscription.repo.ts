import { HttpStatus } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from '@common/database/prisma.service';
import { RepositoryError } from '../errors/repo.error';

@Injectable()
export class SubscriptionRepo {
    constructor(private prisma: PrismaService) {}

    async findUnique<T extends Prisma.SubscriptionFindUniqueArgs>(
        params: T,
    ): Promise<Prisma.SubscriptionGetPayload<T> | null> {
        try {
            return (await this.prisma.subscription.findUnique(
                params,
            )) as Prisma.SubscriptionGetPayload<T> | null;
        } catch (error) {
            throw new RepositoryError(
                'Failed to find unique subscription',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async findFirst<T extends Prisma.SubscriptionFindFirstArgs>(
        params: T,
    ): Promise<Prisma.SubscriptionGetPayload<T> | null> {
        try {
            return (await this.prisma.subscription.findFirst(
                params,
            )) as Prisma.SubscriptionGetPayload<T> | null;
        } catch (error) {
            throw new RepositoryError(
                'Failed to find first subscription',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async findMany<T extends Prisma.SubscriptionFindManyArgs>(
        params: T,
    ): Promise<Prisma.SubscriptionGetPayload<T>[]> {
        try {
            return (await this.prisma.subscription.findMany(
                params,
            )) as Prisma.SubscriptionGetPayload<T>[];
        } catch (error) {
            throw new RepositoryError(
                'Failed to find subscriptions',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async create<T extends Prisma.SubscriptionCreateArgs>(
        params: T,
    ): Promise<Prisma.SubscriptionGetPayload<T>> {
        try {
            return (await this.prisma.subscription.create(
                params,
            )) as Prisma.SubscriptionGetPayload<T>;
        } catch (error) {
            throw new RepositoryError(
                'Failed to create subscription',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async createMany(params: Prisma.SubscriptionCreateManyArgs) {
        try {
            return await this.prisma.subscription.createMany(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to create subscriptions',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async update<T extends Prisma.SubscriptionUpdateArgs>(
        params: T,
    ): Promise<Prisma.SubscriptionGetPayload<T>> {
        try {
            return (await this.prisma.subscription.update(
                params,
            )) as Prisma.SubscriptionGetPayload<T>;
        } catch (error) {
            throw new RepositoryError(
                'Failed to update subscription',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async updateMany(params: Prisma.SubscriptionUpdateManyArgs) {
        try {
            return await this.prisma.subscription.updateMany(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to update subscriptions',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async delete<T extends Prisma.SubscriptionDeleteArgs>(
        params: T,
    ): Promise<Prisma.SubscriptionGetPayload<T>> {
        try {
            return (await this.prisma.subscription.delete(
                params,
            )) as Prisma.SubscriptionGetPayload<T>;
        } catch (error) {
            throw new RepositoryError(
                'Failed to delete subscription',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async deleteMany(params: Prisma.SubscriptionDeleteManyArgs) {
        try {
            return await this.prisma.subscription.deleteMany(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to delete subscriptions',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async count(params?: Prisma.SubscriptionCountArgs): Promise<number> {
        try {
            return await this.prisma.subscription.count(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to count subscriptions',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }
}
