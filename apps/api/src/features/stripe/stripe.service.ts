import { Injectable } from "@nestjs/common";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";

import { PrismaService } from "@api/src/infrastructure/prisma/prisma.service";
import type { PlatformBillingHistoryOutput } from "@api/src/features/profile/profile.schema";

type StripeConnectStatus = {
  stripeAccountId: string | null;
  stripeOnboardingComplete: boolean;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
};

type StripeAccountStatusPayload = {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
};

/** Commission plateforme : 150 = 1,5 % (basis points / 10 000). */
const PLATFORM_APPLICATION_FEE_BPS = 150;

function platformApplicationFeeAmountFromUnitAmount(unitAmount: number): number {
  const raw = Math.round((unitAmount * PLATFORM_APPLICATION_FEE_BPS) / 10_000);
  if (unitAmount <= 0) {
    return 0;
  }
  return Math.max(1, raw);
}

function resolveStripeConnectIdentityCountry(): string {
  const raw = process.env["STRIPE_CONNECT_DEFAULT_IDENTITY_COUNTRY"]?.trim();
  if (!raw || raw.length < 2) {
    return "FR";
  }
  return raw.slice(0, 2).toUpperCase();
}

/** Public page URL prefilled on Connect onboarding (Accounts v2: `defaults.profile.business_url`). */
function resolveConnectBusinessPublicUrl(p: {
  frontendBaseUrl: string;
  publicBookingSlug: string | null;
  stripeConnectedAccountId: string;
}): string {
  const base = p.frontendBaseUrl.replace(/\/+$/g, "");
  const slug = p.publicBookingSlug?.trim();
  if (slug && slug.length > 0) {
    return `${base}/${encodeURIComponent(slug)}/services`;
  }
  return `${base}/store/${p.stripeConnectedAccountId}`;
}

@Injectable()
export class StripeService {
  private readonly stripeClient;

  constructor(private readonly db: PrismaService) {
    const secretKey = process.env["STRIPE_SECRET_KEY"]?.trim();
    if (!secretKey || secretKey.length === 0) {
      throw new Error("STRIPE_SECRET_KEY_MISSING");
    }
    this.stripeClient = new Stripe(secretKey);
  }

  async getConnectStatus(userId: string): Promise<StripeConnectStatus> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        stripeAccountId: true,
        stripeOnboardingComplete: true,
        stripeChargesEnabled: true,
        stripePayoutsEnabled: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "USER_NOT_FOUND" });
    }

    if (!user.stripeAccountId) {
      return {
        stripeAccountId: null,
        stripeOnboardingComplete: false,
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
      };
    }

    const account = await this.stripeClient.v2.core.accounts.retrieve(user.stripeAccountId, {
      include: ["configuration.merchant", "requirements"],
    });

    const cardPaymentsStatus = account.configuration?.merchant?.capabilities?.card_payments?.status;
    const readyToProcessPayments = cardPaymentsStatus === "active";
    const requirementsStatus = account.requirements?.summary?.minimum_deadline?.status;
    const onboardingComplete = requirementsStatus !== "currently_due" && requirementsStatus !== "past_due";

    await this.db.user.updateMany({
      where: { stripeAccountId: account.id },
      data: {
        stripeOnboardingComplete: onboardingComplete,
        stripeChargesEnabled: readyToProcessPayments,
        stripePayoutsEnabled: readyToProcessPayments,
      },
    });

    return {
      stripeAccountId: account.id,
      stripeOnboardingComplete: onboardingComplete,
      stripeChargesEnabled: readyToProcessPayments,
      stripePayoutsEnabled: readyToProcessPayments,
    };
  }

  private async createConnectedAccountV2(p: { displayName: string; contactEmail: string }) {
    const identityCountry = resolveStripeConnectIdentityCountry();

    const accountToken = await this.stripeClient.v2.core.accountTokens.create({
      display_name: p.displayName,
      contact_email: p.contactEmail,
    });

    const account = await this.stripeClient.v2.core.accounts.create({
      account_token: accountToken.id,
      identity: {
        country: identityCountry,
      },
      configuration: {
        customer: {},
      },
    });

    await this.stripeClient.v2.core.accounts.update(account.id, {
      identity: {
        country: identityCountry,
      },
    });

    return this.stripeClient.v2.core.accounts.update(account.id, {
      dashboard: "full",
      defaults: {
        responsibilities: {
          fees_collector: "stripe",
          losses_collector: "stripe",
        },
      },
      configuration: {
        customer: {},
        merchant: {
          capabilities: {
            card_payments: {
              requested: true,
            },
          },
        },
      },
    });
  }

  async createOrRefreshOnboardingLink(p: { userId: string }): Promise<{ url: string }> {
    const user = await this.db.user.findUnique({
      where: { id: p.userId },
      select: {
        id: true,
        email: true,
        name: true,
        stripeAccountId: true,
        publicBookingSlug: true,
      },
    });
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "USER_NOT_FOUND" });
    }

    const accountId =
      user.stripeAccountId ??
      (await this.createConnectedAccountV2({ displayName: user.name, contactEmail: user.email })).id;

    if (!user.stripeAccountId) {
      await this.db.user.update({
        where: { id: user.id },
        data: { stripeAccountId: accountId },
      });
    }

    const baseUrl = process.env["FRONTEND_URL"]?.trim();
    if (!baseUrl) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "FRONTEND_URL_MISSING",
      });
    }

    const profileUrl = `${baseUrl.replace(/\/+$/g, "")}/admin/profile`;
    const businessPublicUrl = resolveConnectBusinessPublicUrl({
      frontendBaseUrl: baseUrl,
      publicBookingSlug: user.publicBookingSlug,
      stripeConnectedAccountId: accountId,
    });

    await this.stripeClient.v2.core.accounts.update(accountId, {
      defaults: {
        responsibilities: {
          fees_collector: "stripe",
          losses_collector: "stripe",
        },
        profile: {
          business_url: businessPublicUrl,
        },
      },
    });

    const accountLink = await this.stripeClient.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["merchant", "customer"],
          refresh_url: profileUrl,
          return_url: profileUrl,
        },
      },
    });

    return { url: accountLink.url };
  }

  async createEmbeddedAccountSession(p: { userId: string }): Promise<{ clientSecret: string }> {
    const user = await this.db.user.findUnique({
      where: { id: p.userId },
      select: { stripeAccountId: true },
    });
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "USER_NOT_FOUND" });
    }
    if (!user.stripeAccountId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "STRIPE_ACCOUNT_NOT_CREATED" });
    }

    const accountSession = await this.stripeClient.accountSessions.create({
      account: user.stripeAccountId,
      components: {
        account_onboarding: { enabled: true },
        payments: { enabled: true },
        payouts: { enabled: true },
        balances: { enabled: true },
        documents: { enabled: true },
        tax_registrations: { enabled: true },
      },
    });

    return { clientSecret: accountSession.client_secret };
  }

  async syncConnectStatusFromStripeAccount(account: StripeAccountStatusPayload) {
    await this.db.user.updateMany({
      where: { stripeAccountId: account.id },
      data: {
        stripeChargesEnabled: account.charges_enabled,
        stripePayoutsEnabled: account.payouts_enabled,
        stripeOnboardingComplete: account.details_submitted,
      },
    });
  }

  async syncConnectStatusFromAccountId(accountId: string) {
    const account = await this.stripeClient.v2.core.accounts.retrieve(accountId, {
      include: ["configuration.merchant", "requirements"],
    });
    const cardPaymentsStatus = account.configuration?.merchant?.capabilities?.card_payments?.status;
    const requirementsStatus = account.requirements?.summary?.minimum_deadline?.status;
    await this.db.user.updateMany({
      where: { stripeAccountId: account.id },
      data: {
        stripeChargesEnabled: cardPaymentsStatus === "active",
        stripePayoutsEnabled: cardPaymentsStatus === "active",
        stripeOnboardingComplete: requirementsStatus !== "currently_due" && requirementsStatus !== "past_due",
      },
    });
  }

  async createConnectedProduct(p: {
    accountId: string;
    name: string;
    description?: string;
    priceInCents: number;
    currency: string;
  }) {
    return this.stripeClient.products.create(
      {
        name: p.name,
        description: p.description,
        default_price_data: {
          unit_amount: p.priceInCents,
          currency: p.currency,
        },
      },
      {
        stripeAccount: p.accountId,
      },
    );
  }

  async listConnectedProducts(accountId: string) {
    return this.stripeClient.products.list(
      {
        limit: 20,
        active: true,
        expand: ["data.default_price"],
      },
      {
        stripeAccount: accountId,
      },
    );
  }

  async createConnectedCheckoutSession(p: {
    accountId: string;
    productId: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    const product = await this.stripeClient.products.retrieve(
      p.productId,
      {},
      {
        stripeAccount: p.accountId,
      },
    );
    const defaultPrice = typeof product.default_price === "object" ? product.default_price : null;
    if (!defaultPrice || defaultPrice.unit_amount == null || !defaultPrice.currency) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "PRODUCT_HAS_NO_DEFAULT_PRICE" });
    }

    const applicationFeeAmount = platformApplicationFeeAmountFromUnitAmount(defaultPrice.unit_amount);

    return this.stripeClient.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: defaultPrice.currency,
              product_data: {
                name: product.name,
                description: product.description ?? undefined,
              },
              unit_amount: defaultPrice.unit_amount,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
        },
        success_url: p.successUrl,
        cancel_url: p.cancelUrl,
      },
      {
        stripeAccount: p.accountId,
      },
    );
  }

  getStripeClient() {
    return this.stripeClient;
  }

  private async resolvePlatformBillingCustomerId(p: {
    userId: string;
    email: string;
    storedCustomerId: string | null;
  }): Promise<string | null> {
    const trimmed = p.storedCustomerId?.trim();
    if (trimmed && trimmed.length > 0) {
      return trimmed;
    }
    try {
      const byMetadata = await this.stripeClient.customers.search({
        query: `metadata['bookido_user_id']:'${p.userId}'`,
        limit: 1,
      });
      const foundMeta = byMetadata.data[0];
      if (foundMeta) {
        await this.db.user.update({
          where: { id: p.userId },
          data: { stripeBillingCustomerId: foundMeta.id },
        });
        return foundMeta.id;
      }
    } catch {
      /* Customer Search unavailable or query error — fall through */
    }
    try {
      const byEmail = await this.stripeClient.customers.list({
        email: p.email,
        limit: 2,
      });
      if (byEmail.data.length === 1) {
        const only = byEmail.data[0];
        if (only) {
          await this.db.user.update({
            where: { id: p.userId },
            data: { stripeBillingCustomerId: only.id },
          });
          return only.id;
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  /** SaaS / platform billing (Stripe Customer on the platform account), not Connect. */
  async getPlatformBillingHistory(userId: string): Promise<PlatformBillingHistoryOutput> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { email: true, stripeBillingCustomerId: true },
    });
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "USER_NOT_FOUND" });
    }

    const customerId = await this.resolvePlatformBillingCustomerId({
      userId,
      email: user.email,
      storedCustomerId: user.stripeBillingCustomerId,
    });

    if (!customerId) {
      return { billingCustomerLinked: false, rows: [] };
    }

    const rows: PlatformBillingHistoryOutput["rows"] = [];

    try {
      const subs = await this.stripeClient.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      const sub = subs.data[0];
      if (sub) {
        try {
          const upcoming = await this.stripeClient.invoices.createPreview({
            customer: customerId,
            subscription: sub.id,
          });
          const periodEndSec = upcoming.period_end ?? upcoming.next_payment_attempt;
          if (periodEndSec) {
            rows.push({
              id: "upcoming",
              kind: "upcoming",
              dateIso: new Date(periodEndSec * 1000).toISOString(),
              amountCents: upcoming.amount_due,
              currency: upcoming.currency,
              statusKey: "upcoming",
              invoicePdf: null,
              hostedInvoiceUrl: null,
            });
          }
        } catch {
          /* No upcoming preview */
        }
      }
    } catch {
      /* Subscription list failed */
    }

    try {
      const listed = await this.stripeClient.invoices.list({
        customer: customerId,
        limit: 24,
      });
      for (const inv of listed.data) {
        if (inv.status === "void") {
          continue;
        }
        const status = inv.status ?? "draft";
        const statusKey =
          status === "paid" || status === "open" || status === "draft" || status === "uncollectible" || status === "void"
            ? status
            : "open";
        const paidAt = inv.status_transitions?.paid_at;
        const dateSeconds = paidAt ?? inv.created;
        const amountCents =
          status === "paid" ? (inv.amount_paid ?? inv.total ?? 0) : (inv.amount_due ?? inv.total ?? 0);
        rows.push({
          id: inv.id,
          kind: "invoice",
          dateIso: new Date(dateSeconds * 1000).toISOString(),
          amountCents,
          currency: inv.currency,
          statusKey,
          invoicePdf: inv.invoice_pdf ?? null,
          hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
        });
      }
    } catch {
      return { billingCustomerLinked: true, rows };
    }

    return { billingCustomerLinked: true, rows };
  }

  /** Re-open Stripe-hosted Connect flow to review or update account details. */
  async createConnectAccountUpdateLink(p: { userId: string }): Promise<{ url: string }> {
    return this.createOrRefreshOnboardingLink(p);
  }
}
