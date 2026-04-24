import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import { BaseUserSession } from "@thallesp/nestjs-better-auth";
import { TRPCError } from "@trpc/server";
import { AuthGuard } from "@api/src/infrastructure/decorators/auth/auth-guard.decorator";
import {
  createServiceSchema,
  serviceSchema,
  updateServiceSchema,
} from "./services.schema";
import { ServicesService } from "./services.service";

@Router({ alias: "services" })
@AuthGuard({ logs: true })
export class ServiceRouter {
  constructor(private readonly servicesService: ServicesService) {}

  private requireUser(ctx: BaseUserSession): { id: string } {
    const user = ctx.user;
    if (!user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }
    return { id: user.id };
  }

  @Query({
    output: z.array(serviceSchema),
  })
  async list(@Ctx() ctx: BaseUserSession) {
    const { id } = this.requireUser(ctx);
    return this.servicesService.findAllForUser(id);
  }

  @Mutation({
    input: createServiceSchema,
    output: serviceSchema,
  })
  async create(@Ctx() ctx: BaseUserSession, @Input() input: z.infer<typeof createServiceSchema>) {
    const { id } = this.requireUser(ctx);
    return this.servicesService.create(id, input);
  }

  @Mutation({
    input: z.object({
      id: z.string(),
      data: updateServiceSchema,
    }),
    output: serviceSchema,
  })
  async update(
    @Ctx() ctx: BaseUserSession,
    @Input("id") id: string,
    @Input("data") data: z.infer<typeof updateServiceSchema>,
  ) {
    const { id: userId } = this.requireUser(ctx);
    return this.servicesService.update(userId, id, data);
  }

  @Mutation({
    input: z.object({ id: z.string() }),
    output: z.object({ id: z.string() }),
  })
  async delete(@Ctx() ctx: BaseUserSession, @Input("id") id: string) {
    const { id: userId } = this.requireUser(ctx);
    return this.servicesService.remove(userId, id);
  }
}
