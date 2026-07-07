import { HttpStatus } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from '@common/database/prisma.service';
import { RepositoryError } from '../errors/repo.error';

@Injectable()
export class InvoiceRepo {
    constructor(private prisma: PrismaService) {}

    async findUnique<T extends Prisma.InvoiceFindUniqueArgs>(
        params: T,
    ): Promise<Prisma.InvoiceGetPayload<T> | null> {
        try {
            return (await this.prisma.invoice.findUnique(
                params,
            )) as Prisma.InvoiceGetPayload<T> | null;
        } catch (error) {
            throw new RepositoryError(
                'Failed to find unique invoice',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async findFirst<T extends Prisma.InvoiceFindFirstArgs>(
        params: T,
    ): Promise<Prisma.InvoiceGetPayload<T> | null> {
        try {
            return (await this.prisma.invoice.findFirst(
                params,
            )) as Prisma.InvoiceGetPayload<T> | null;
        } catch (error) {
            throw new RepositoryError(
                'Failed to find first invoice',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async findMany<T extends Prisma.InvoiceFindManyArgs>(
        params: T,
    ): Promise<Prisma.InvoiceGetPayload<T>[]> {
        try {
            return (await this.prisma.invoice.findMany(
                params,
            )) as Prisma.InvoiceGetPayload<T>[];
        } catch (error) {
            throw new RepositoryError(
                'Failed to find invoices',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async create<T extends Prisma.InvoiceCreateArgs>(
        params: T,
    ): Promise<Prisma.InvoiceGetPayload<T>> {
        try {
            return (await this.prisma.invoice.create(
                params,
            )) as Prisma.InvoiceGetPayload<T>;
        } catch (error) {
            throw new RepositoryError(
                'Failed to create invoice',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async createMany(params: Prisma.InvoiceCreateManyArgs) {
        try {
            return await this.prisma.invoice.createMany(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to create invoices',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async update<T extends Prisma.InvoiceUpdateArgs>(
        params: T,
    ): Promise<Prisma.InvoiceGetPayload<T>> {
        try {
            return (await this.prisma.invoice.update(
                params,
            )) as Prisma.InvoiceGetPayload<T>;
        } catch (error) {
            throw new RepositoryError(
                'Failed to update invoice',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async updateMany(params: Prisma.InvoiceUpdateManyArgs) {
        try {
            return await this.prisma.invoice.updateMany(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to update invoices',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async delete<T extends Prisma.InvoiceDeleteArgs>(
        params: T,
    ): Promise<Prisma.InvoiceGetPayload<T>> {
        try {
            return (await this.prisma.invoice.delete(
                params,
            )) as Prisma.InvoiceGetPayload<T>;
        } catch (error) {
            throw new RepositoryError(
                'Failed to delete invoice',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async deleteMany(params: Prisma.InvoiceDeleteManyArgs) {
        try {
            return await this.prisma.invoice.deleteMany(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to delete invoices',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }

    async count(params?: Prisma.InvoiceCountArgs): Promise<number> {
        try {
            return await this.prisma.invoice.count(params);
        } catch (error) {
            throw new RepositoryError(
                'Failed to count invoices',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }
}
