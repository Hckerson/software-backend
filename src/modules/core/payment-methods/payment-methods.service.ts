import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethod } from 'generated/prisma/client';
import { PaymentMethodRepo } from '@common/repos/payment-method.repo';
import { CreatePaymentMethodDto } from './dto';

const WITHOUT_TOKEN = { stripeToken: true } as const;

export type PublicPaymentMethod = Omit<PaymentMethod, 'stripeToken'>;

@Injectable()
export class PaymentMethodsService {
    constructor(private paymentMethodRepo: PaymentMethodRepo) {}

    async list(userId: string): Promise<PublicPaymentMethod[]> {
        return this.paymentMethodRepo.findMany({
            where: { userId },
            omit: WITHOUT_TOKEN,
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });
    }

    private async ownedOrFail(
        userId: string,
        id: string,
    ): Promise<PublicPaymentMethod> {
        const method = await this.paymentMethodRepo.findFirst({
            where: { id, userId },
            omit: WITHOUT_TOKEN,
        });

        if (!method) {
            throw new NotFoundException(`Payment method ${id} not found`);
        }

        return method;
    }

    private async clearDefaults(userId: string, exceptId?: string) {
        await this.paymentMethodRepo.updateMany({
            where: {
                userId,
                isDefault: true,
                ...(exceptId ? { id: { not: exceptId } } : {}),
            },
            data: { isDefault: false },
        });
    }

    async add(
        userId: string,
        dto: CreatePaymentMethodDto,
    ): Promise<PublicPaymentMethod> {
        const existing = await this.paymentMethodRepo.count({
            where: { userId },
        });
        const isDefault = dto.isDefault ?? existing === 0;

        if (isDefault) await this.clearDefaults(userId);

        return this.paymentMethodRepo.create({
            data: {
                user: { connect: { id: userId } },
                stripeToken: dto.stripeToken,
                last4Digits: dto.last4Digits,
                expiryMonth: dto.expiryMonth,
                expiryYear: dto.expiryYear,
                isDefault,
            },
            omit: WITHOUT_TOKEN,
        });
    }

    async setDefault(userId: string, id: string): Promise<PublicPaymentMethod> {
        await this.ownedOrFail(userId, id);
        await this.clearDefaults(userId, id);

        return this.paymentMethodRepo.update({
            where: { id },
            data: { isDefault: true },
            omit: WITHOUT_TOKEN,
        });
    }

    async remove(userId: string, id: string): Promise<PublicPaymentMethod> {
        const method = await this.ownedOrFail(userId, id);
        const removed = await this.paymentMethodRepo.delete({
            where: { id },
            omit: WITHOUT_TOKEN,
        });

        if (method.isDefault) {
            const next = await this.paymentMethodRepo.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                omit: WITHOUT_TOKEN,
            });

            if (next) {
                await this.paymentMethodRepo.update({
                    where: { id: next.id },
                    data: { isDefault: true },
                });
            }
        }

        return removed;
    }
}
