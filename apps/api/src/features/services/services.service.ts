import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@api/generated/prisma/client";
import { PrismaService } from "@api/src/infrastructure/prisma/prisma.service";
import { z } from "zod";
import { createServiceSchema, updateServiceSchema } from "./services.schema";

type CreateServiceInput = z.infer<typeof createServiceSchema>;
type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

function slotKeysFromJson(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === "string");
}

@Injectable()
export class ServicesService {
  constructor(private readonly db: PrismaService) {}

  private mapRow(row: {
    id: string;
    userId: string;
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
    isFree: boolean;
    packSize: number;
    imageUrl: string | null;
    address: string;
    availableSlotKeys: Prisma.JsonValue;
    isPublished: boolean;
    requiresValidation: boolean;
    allowsDirectPayment: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      description: row.description,
      durationMinutes: row.durationMinutes,
      price: row.price,
      isFree: row.isFree,
      packSize: row.packSize,
      imageUrl: row.imageUrl,
      address: row.address,
      availableSlotKeys: slotKeysFromJson(row.availableSlotKeys),
      isPublished: row.isPublished,
      requiresValidation: row.requiresValidation,
      allowsDirectPayment: row.allowsDirectPayment,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findAllForUser(userId: string) {
    const rows = await this.db.service.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => this.mapRow(row));
  }

  async create(userId: string, input: CreateServiceInput) {
    const row = await this.db.service.create({
      data: {
        userId,
        name: input.name,
        description: input.description,
        durationMinutes: input.durationMinutes,
        price: input.isFree ? 0 : input.price,
        isFree: input.isFree,
        packSize: input.packSize,
        imageUrl: input.imageUrl ?? null,
        address: input.address.trim(),
        availableSlotKeys: input.availableSlotKeys as Prisma.InputJsonValue,
        isPublished: input.isPublished ?? true,
        requiresValidation: input.requiresValidation,
        allowsDirectPayment: input.allowsDirectPayment,
      },
    });
    return this.mapRow(row);
  }

  async update(userId: string, id: string, data: UpdateServiceInput) {
    const existing = await this.db.service.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException("Service not found");
    }
    const nextIsFree = data.isFree ?? existing.isFree;
    const nextPrice = nextIsFree
      ? 0
      : data.price !== undefined
        ? data.price
        : existing.price;

    const row = await this.db.service.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
        ...(data.packSize !== undefined && { packSize: data.packSize }),
        ...(data.requiresValidation !== undefined && { requiresValidation: data.requiresValidation }),
        ...(data.allowsDirectPayment !== undefined && { allowsDirectPayment: data.allowsDirectPayment }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.address !== undefined && { address: data.address.trim() }),
        ...(data.availableSlotKeys !== undefined && {
          availableSlotKeys: data.availableSlotKeys as Prisma.InputJsonValue,
        }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
        ...(data.isFree !== undefined && { isFree: data.isFree }),
        price: nextPrice,
      },
    });
    return this.mapRow(row);
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    await this.db.service.delete({ where: { id } });
    return { id };
  }

  private async ensureOwned(userId: string, id: string) {
    const existing = await this.db.service.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException("Service not found");
    }
  }
}
