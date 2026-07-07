import { Injectable, HttpStatus } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from '@common/database/prisma.service';
import { RepositoryError } from '../errors/repo.error';

@Injectable()
export class PaymentMethodRepo {
    constructor(private prisma: PrismaService) {}

    async findUnique<T extends Prisma.PaymentMethodFindUniqueArgs>(
        params: T,
    ): Promise<Prisma.PaymentMethodGetPayload<T> | null> {
        try {
            return (await this.prisma.paymentMethod.findUnique(
                params,
            )) as Prisma.PaymentMethodGetPayload<T> | null;
        } catch (error) {
            throw new RepositoryError(
                'Failed to find unique payment method',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async findFirst<T extends Prisma.PaymentMethodFindFirstArgs>(
        params: T,
    ): Promise<Prisma.PaymentMethodGetPayload<T> | null> {
        try {
            return (await this.prisma.paymentMethod.findFirst(
                params,
            )) as Prisma.PaymentMethodGetPayload<T> | null;
        } catch (error) {
            throw new RepositoryError(
                'Failed to find first payment method',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async findMany<T extends Prisma.PaymentMethodFindManyArgs>(
        params: T,
    ): Promise<Prisma.PaymentMethodGetPayload<T>[]> {
        try {
            return (await this.prisma.paymentMethod.findMany(
                params,
            )) as Prisma.PaymentMethodGetPayload<T>[];
        } catch (error) {
            throw new RepositoryError(
                'Failed to find payment methods',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async create<T extends Prisma.PaymentMethodCreateArgs>(
        params: T,
    ): Promise<Prisma.PaymentMethodGetPayload<T>> {
        try {
            return (await this.prisma.paymentMethod.create(
                params,
            )) as Prisma.PaymentMethodGetPayload<T>;
        } catch (error) {
            throw new RepositoryError(
                'Failed to create payment method',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async createMany(params: Prisma.PaymentMethodCreateManyArgs) {
        try {
            return await this.prisma.paymentMethod.createMany(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to create payment methods',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async update<T extends Prisma.PaymentMethodUpdateArgs>(
        params: T,
    ): Promise<Prisma.PaymentMethodGetPayload<T>> {
        try {
            return (await this.prisma.paymentMethod.update(
                params,
            )) as Prisma.PaymentMethodGetPayload<T>;
        } catch (error) {
            throw new RepositoryError(
                'Failed to update payment method',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async updateMany(params: Prisma.PaymentMethodUpdateManyArgs) {
        try {
            return await this.prisma.paymentMethod.updateMany(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to update payment methods',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async delete<T extends Prisma.PaymentMethodDeleteArgs>(
        params: T,
    ): Promise<Prisma.PaymentMethodGetPayload<T>> {
        try {
            return (await this.prisma.paymentMethod.delete(
                params,
            )) as Prisma.PaymentMethodGetPayload<T>;
        } catch (error) {
            throw new RepositoryError(
                'Failed to delete payment method',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async deleteMany(params: Prisma.PaymentMethodDeleteManyArgs) {
        try {
            return await this.prisma.paymentMethod.deleteMany(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to delete payment methods',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async count(params?: Prisma.PaymentMethodCountArgs): Promise<number> {
        try {
            return await this.prisma.paymentMethod.count(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to count payment methods',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }
}
