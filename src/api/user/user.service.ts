import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService, UserModel } from '@/infra/prisma/prisma.service';

import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  public async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prismaService.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const user = await this.prismaService.user.create({
      data: createUserDto,
    });

    return user;
  }

  public async findAll(): Promise<User[]> {
    return await this.prismaService.user.findMany({
      select: userSelect,
    });
  }

  public async findByEmail(email: string): Promise<UserWithPassword | null> {
    return this.prismaService.user.findUnique({
      where: { email },
      select: {
        ...userSelect,
        password: true,
      },
    });
  }

  public async findById(id: string): Promise<UserWithPassword> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        ...userSelect,
        password: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}

const userSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  updatedAt: true,
};

export type User = Pick<UserModel, keyof typeof userSelect>;
export type UserWithPassword = UserModel;
