import { HttpStatus } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from '@common/database/prisma.service';
import { RepositoryError } from '../errors/repo.error';

@Injectable()
export class BillingAuditRepo {
    constructor(private prisma: PrismaService) {}

    async findUnique<T extends Prisma.BillingAuditFindUniqueArgs>(
        params: T,
    ): Promise<Prisma.BillingAuditGetPayload<T> | null> {
        try {
            return (await this.prisma.billingAudit.findUnique(
                params,
            )) as Prisma.BillingAuditGetPayload<T> | null;
        } catch (error) {
            throw new RepositoryError(
                'Failed to find unique billing audit',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async findFirst<T extends Prisma.BillingAuditFindFirstArgs>(
        params: T,
    ): Promise<Prisma.BillingAuditGetPayload<T> | null> {
        try {
            return (await this.prisma.billingAudit.findFirst(
                params,
            )) as Prisma.BillingAuditGetPayload<T> | null;
        } catch (error) {
            throw new RepositoryError(
                'Failed to find first billing audit',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async findMany<T extends Prisma.BillingAuditFindManyArgs>(
        params: T,
    ): Promise<Prisma.BillingAuditGetPayload<T>[]> {
        try {
            return (await this.prisma.billingAudit.findMany(
                params,
            )) as Prisma.BillingAuditGetPayload<T>[];
        } catch (error) {
            throw new RepositoryError(
                'Failed to find billing audits',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async create<T extends Prisma.BillingAuditCreateArgs>(
        params: T,
    ): Promise<Prisma.BillingAuditGetPayload<T>> {
        try {
            return (await this.prisma.billingAudit.create(
                params,
            )) as Prisma.BillingAuditGetPayload<T>;
        } catch (error) {
            throw new RepositoryError(
                'Failed to create billing audit',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async createMany(params: Prisma.BillingAuditCreateManyArgs) {
        try {
            return await this.prisma.billingAudit.createMany(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to create billing audits',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async update<T extends Prisma.BillingAuditUpdateArgs>(
        params: T,
    ): Promise<Prisma.BillingAuditGetPayload<T>> {
        try {
            return (await this.prisma.billingAudit.update(
                params,
            )) as Prisma.BillingAuditGetPayload<T>;
        } catch (error) {
            throw new RepositoryError(
                'Failed to update billing audit',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async updateMany(params: Prisma.BillingAuditUpdateManyArgs) {
        try {
            return await this.prisma.billingAudit.updateMany(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to update billing audits',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async delete<T extends Prisma.BillingAuditDeleteArgs>(
        params: T,
    ): Promise<Prisma.BillingAuditGetPayload<T>> {
        try {
            return (await this.prisma.billingAudit.delete(
                params,
            )) as Prisma.BillingAuditGetPayload<T>;
        } catch (error) {
            throw new RepositoryError(
                'Failed to delete billing audit',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async deleteMany(params: Prisma.BillingAuditDeleteManyArgs) {
        try {
            return await this.prisma.billingAudit.deleteMany(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to delete billing audits',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async count(params?: Prisma.BillingAuditCountArgs): Promise<number> {
        try {
            return await this.prisma.billingAudit.count(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to count billing audits',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }
}
