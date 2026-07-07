import { HttpStatus } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from '@common/database/prisma.service';
import { RepositoryError } from '../errors/repo.error';

@Injectable()
export class UsageLogRepo {
    constructor(private prisma: PrismaService) {}

    async findUnique<T extends Prisma.UsageLogFindUniqueArgs>(
        params: T,
    ): Promise<Prisma.UsageLogGetPayload<T> | null> {
        try {
            return (await this.prisma.usageLog.findUnique(
                params,
            )) as Prisma.UsageLogGetPayload<T> | null;
        } catch (error) {
            throw new RepositoryError(
                'Failed to find unique usage log',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async findFirst<T extends Prisma.UsageLogFindFirstArgs>(
        params: T,
    ): Promise<Prisma.UsageLogGetPayload<T> | null> {
        try {
            return (await this.prisma.usageLog.findFirst(
                params,
            )) as Prisma.UsageLogGetPayload<T> | null;
        } catch (error) {
            throw new RepositoryError(
                'Failed to find first usage log',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async findMany<T extends Prisma.UsageLogFindManyArgs>(
        params: T,
    ): Promise<Prisma.UsageLogGetPayload<T>[]> {
        try {
            return (await this.prisma.usageLog.findMany(
                params,
            )) as Prisma.UsageLogGetPayload<T>[];
        } catch (error) {
            throw new RepositoryError(
                'Failed to find usage logs',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async create<T extends Prisma.UsageLogCreateArgs>(
        params: T,
    ): Promise<Prisma.UsageLogGetPayload<T>> {
        try {
            return (await this.prisma.usageLog.create(
                params,
            )) as Prisma.UsageLogGetPayload<T>;
        } catch (error) {
            throw new RepositoryError(
                'Failed to create usage log',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async createMany(params: Prisma.UsageLogCreateManyArgs) {
        try {
            return await this.prisma.usageLog.createMany(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to create usage logs',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async update<T extends Prisma.UsageLogUpdateArgs>(
        params: T,
    ): Promise<Prisma.UsageLogGetPayload<T>> {
        try {
            return (await this.prisma.usageLog.update(
                params,
            )) as Prisma.UsageLogGetPayload<T>;
        } catch (error) {
            throw new RepositoryError(
                'Failed to update usage log',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async updateMany(params: Prisma.UsageLogUpdateManyArgs) {
        try {
            return await this.prisma.usageLog.updateMany(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to update usage logs',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async delete<T extends Prisma.UsageLogDeleteArgs>(
        params: T,
    ): Promise<Prisma.UsageLogGetPayload<T>> {
        try {
            return (await this.prisma.usageLog.delete(
                params,
            )) as Prisma.UsageLogGetPayload<T>;
        } catch (error) {
            throw new RepositoryError(
                'Failed to delete usage log',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async deleteMany(params: Prisma.UsageLogDeleteManyArgs) {
        try {
            return await this.prisma.usageLog.deleteMany(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to delete usage logs',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async count(params?: Prisma.UsageLogCountArgs): Promise<number> {
        try {
            return await this.prisma.usageLog.count(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to count usage logs',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async aggregate<T extends Prisma.UsageLogAggregateArgs>(params: T) {
        try {
            return await this.prisma.usageLog.aggregate(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to aggregate usage logs',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }
}
