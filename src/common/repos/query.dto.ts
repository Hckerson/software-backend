import { Prisma } from 'generated/prisma/client';

//  ===== Users =====
export type UpdateUserDto = Prisma.UserUpdateArgs;
export type CreateUserDto = Prisma.UserCreateInput;
export type UniqueUserDto = Prisma.UserFindUniqueArgs;
export type AllUsersQueryDto = Prisma.UserFindManyArgs;
export type GroupUserQueryDto = Prisma.UserGroupByArgs;
export type MultipleUserQueryDto = Prisma.UserWhereInput;
