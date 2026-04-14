import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@api/src/infrastructure/prisma/prisma.service';
import { UserCreateInput, UserModel, UserUpdateInput } from '@api/generated/prisma/models';

@Injectable()
export class UsersService {
  constructor(private readonly db: PrismaService) { }

  async create(createUserInput: UserCreateInput): Promise<UserModel> {
    return await this.db.user.create({
      data: createUserInput,
    });
  }

  async findAll(): Promise<UserModel[]> {

    return await this.db.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<UserModel> {
    const user = await this.db.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(
    id: string,
    updateUserInput: UserUpdateInput,
  ): Promise<UserModel> {
    return await this.db.user.update({
      where: { id },
      data: updateUserInput,
    });
  }

  async remove(id: string): Promise<void> {
    await this.db.user.delete({
      where: { id },
    });
  }
}