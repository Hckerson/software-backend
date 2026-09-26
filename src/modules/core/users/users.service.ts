import { Injectable } from '@nestjs/common';
import { UserRepo } from '@common/repos/user.repo';
import { Prisma, User } from 'generated/prisma/client';

const WITHOUT_SECRETS = { passwordHash: true } as const;

export type PublicUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
    constructor(private userRepo: UserRepo) {}

    async create(data: Prisma.UserCreateInput): Promise<PublicUser> {
        return this.userRepo.create({ data, omit: WITHOUT_SECRETS });
    }

    async findAll(): Promise<PublicUser[]> {
        return this.userRepo.findMany({ omit: WITHOUT_SECRETS });
    }

    async findOne(id: string): Promise<PublicUser | null> {
        return this.userRepo.findUnique({
            where: { id },
            omit: WITHOUT_SECRETS,
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepo.findUnique({ where: { email } });
    }

    async update(
        id: string,
        data: Prisma.UserUpdateInput,
    ): Promise<PublicUser> {
        return this.userRepo.update({
            where: { id },
            data,
            omit: WITHOUT_SECRETS,
        });
    }

    async updateCredentials(
        id: string,
        data: Prisma.UserUpdateInput,
    ): Promise<User> {
        return this.userRepo.update({ where: { id }, data });
    }

    async remove(id: string): Promise<PublicUser> {
        return this.userRepo.delete({ where: { id }, omit: WITHOUT_SECRETS });
    }
}
