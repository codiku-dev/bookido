import { UnauthorizedException } from "@nestjs/common";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import { BaseUserSession } from "@thallesp/nestjs-better-auth";

import { AuthGuard } from "@api/src/infrastructure/decorators/auth/auth-guard.decorator";

import { ClientsService } from "./clients.service";
import {
  clientWithStatsSchema,
  createClientInputSchema,
  listClientsPaginatedInputSchema,
  paginatedClientsOutputSchema,
  updateClientInputSchema,
  type CreateClientInput,
  type ListClientsPaginatedInput,
  type UpdateClientInput,
} from "./clients.schema";

function requireUserId(ctx: BaseUserSession): string {
  const id = ctx.user?.id;
  if (!id) throw new UnauthorizedException();
  return id;
}

@Router({ alias: "clients" })
@AuthGuard({ logs: true })
export class ClientsRouter {
  constructor(private readonly clientsService: ClientsService) {}

  @Query({
    output: z.array(clientWithStatsSchema),
  })
  list(@Ctx() ctx: BaseUserSession) {
    return this.clientsService.listByOwner(requireUserId(ctx));
  }

  @Query({
    input: listClientsPaginatedInputSchema,
    output: paginatedClientsOutputSchema,
  })
  listPaginated(@Ctx() ctx: BaseUserSession, @Input() input: ListClientsPaginatedInput) {
    return this.clientsService.listPaginated(requireUserId(ctx), input);
  }

  @Query({
    input: z.object({ id: z.string() }),
    output: clientWithStatsSchema,
  })
  getById(@Ctx() ctx: BaseUserSession, @Input("id") id: string) {
    return this.clientsService.findOneForOwner(requireUserId(ctx), id);
  }

  @Mutation({
    input: createClientInputSchema,
    output: clientWithStatsSchema,
  })
  create(@Ctx() ctx: BaseUserSession, @Input() input: CreateClientInput) {
    return this.clientsService.create(requireUserId(ctx), input);
  }

  @Mutation({
    input: z.object({
      id: z.string(),
      data: updateClientInputSchema,
    }),
    output: clientWithStatsSchema,
  })
  update(
    @Ctx() ctx: BaseUserSession,
    @Input("id") id: string,
    @Input("data") data: UpdateClientInput,
  ) {
    return this.clientsService.update(requireUserId(ctx), id, data);
  }

  @Mutation({
    input: z.object({ id: z.string() }),
    output: z.object({ id: z.string() }),
  })
  delete(@Ctx() ctx: BaseUserSession, @Input("id") id: string) {
    return this.clientsService.delete(requireUserId(ctx), id);
  }
}
