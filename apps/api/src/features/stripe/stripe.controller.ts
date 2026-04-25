import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import type { Request } from "express";

import { StripeService } from "./stripe.service";

@Controller("stripe")
export class StripeController {
  constructor(private readonly stripeService: StripeService) { }

  private async readRawBody(req: Request & { rawBody?: Buffer }): Promise<Buffer> {
    if (req.rawBody && req.rawBody.length > 0) {
      return req.rawBody;
    }

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    }
    return Buffer.concat(chunks);
  }

  @Post("webhook")
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("stripe-signature") signature: string | undefined,
  ) {
    const stripeClient = this.stripeService.getStripeClient();
    const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"]?.trim();
    const rawBody = await this.readRawBody(req);

    if (webhookSecret) {
      if (!signature) {
        throw new BadRequestException("Missing stripe-signature header");
      }
      if (!rawBody || rawBody.length === 0) {
        throw new BadRequestException("Missing raw webhook body");
      }
      const thinEvent = stripeClient.parseEventNotification(rawBody, signature, webhookSecret);
      const event = await stripeClient.v2.core.events.retrieve(thinEvent.id);

      if (
        event.type === "v2.core.account[requirements].updated" ||
        event.type === "v2.core.account[configuration.merchant].capability_status_updated" ||
        event.type === "v2.core.account[configuration.customer].capability_status_updated" ||
        event.type === "v2.core.account[configuration.recipient].capability_status_updated"
      ) {
        const relatedObject = "related_object" in thinEvent ? thinEvent.related_object : null;
        const relatedObjectId =
          relatedObject && typeof relatedObject === "object" && "id" in relatedObject
            ? String(relatedObject.id ?? "").trim()
            : "";
        if (relatedObjectId.startsWith("acct_")) {
          await this.stripeService.syncConnectStatusFromAccountId(relatedObjectId);
        }
      }
    } else {
      throw new BadRequestException("STRIPE_WEBHOOK_SECRET is required for webhook verification");
    }

    return { received: true as const };
  }

  @Post("connect/products")
  @HttpCode(200)
  async createConnectedProduct(
    @Body()
    body: {
      accountId: string;
      name: string;
      description?: string;
      priceInCents: number;
      currency: string;
    },
  ) {
    if (!body.accountId || !body.name || !body.priceInCents || !body.currency) {
      throw new BadRequestException("Missing required product fields");
    }
    const product = await this.stripeService.createConnectedProduct({
      accountId: body.accountId,
      name: body.name,
      description: body.description,
      priceInCents: body.priceInCents,
      currency: body.currency.toLowerCase(),
    });
    return { id: product.id };
  }

  @Get("connect/:accountId/products")
  async listConnectedProducts(@Param("accountId") accountId: string) {
    const products = await this.stripeService.listConnectedProducts(accountId);
    return {
      products: products.data.map((product) => {
        const defaultPrice = typeof product.default_price === "object" ? product.default_price : null;
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          unitAmount: defaultPrice?.unit_amount ?? null,
          currency: defaultPrice?.currency ?? null,
        };
      }),
    };
  }

  @Post("connect/:accountId/checkout")
  @HttpCode(200)
  async createConnectedCheckoutSession(
    @Param("accountId") accountId: string,
    @Body() body: { productId: string; successUrl: string; cancelUrl: string },
  ) {
    if (!body.productId || !body.successUrl || !body.cancelUrl) {
      throw new BadRequestException("Missing checkout fields");
    }

    const session = await this.stripeService.createConnectedCheckoutSession({
      accountId,
      productId: body.productId,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
    });
    return { url: session.url };
  }
}
