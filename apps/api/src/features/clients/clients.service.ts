import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "@api/src/infrastructure/prisma/prisma.service";
import { Prisma } from "@api/generated/prisma/client";

import {
  ClientWithStats,
  CreateClientInput,
  UpdateClientInput,
  withPlaceholderStats,
} from "./clients.schema";

@Injectable()
export class ClientsService {
  constructor(private readonly db: PrismaService) {}

  async listByOwner(ownerId: string): Promise<ClientWithStats[]> {
    const rows = await this.db.client.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => withPlaceholderStats(r));
  }

  async findOneForOwner(ownerId: string, id: string): Promise<ClientWithStats> {
    const row = await this.db.client.findFirst({
      where: { id, ownerId },
    });
    if (!row) {
      throw new NotFoundException(`Client ${id} not found`);
    }
    return withPlaceholderStats(row);
  }

  async create(ownerId: string, input: CreateClientInput): Promise<ClientWithStats> {
    try {
      const row = await this.db.client.create({
        data: {
          ownerId,
          name: input.name,
          email: input.email.trim().toLowerCase(),
          phone: input.phone,
          address: input.address?.trim() || null,
          notes: input.notes?.trim() || null,
        },
      });
      return withPlaceholderStats(row);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("A client with this email already exists");
      }
      throw e;
    }
  }

  async update(ownerId: string, id: string, data: UpdateClientInput): Promise<ClientWithStats> {
    const patch: Prisma.ClientUpdateInput = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.email !== undefined) patch.email = data.email.trim().toLowerCase();
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.address !== undefined) patch.address = data.address?.trim() || null;
    if (data.notes !== undefined) patch.notes = data.notes?.trim() || null;
    if (Object.keys(patch).length === 0) {
      return this.findOneForOwner(ownerId, id);
    }
    try {
      const result = await this.db.client.updateMany({
        where: { id, ownerId },
        data: patch,
      });
      if (result.count === 0) {
        throw new NotFoundException(`Client ${id} not found`);
      }
      return this.findOneForOwner(ownerId, id);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("A client with this email already exists");
      }
      throw e;
    }
  }

  async delete(ownerId: string, id: string): Promise<{ id: string }> {
    const result = await this.db.client.deleteMany({
      where: { id, ownerId },
    });
    if (result.count === 0) {
      throw new NotFoundException(`Client ${id} not found`);
    }
    return { id };
  }
}
