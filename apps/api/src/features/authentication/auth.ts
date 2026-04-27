import { betterAuth } from "better-auth";
import { loadDevelopmentEnvFromFiles } from "@api/env-type";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@api/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { admin } from "better-auth/plugins"
import { APIError, createAuthMiddleware } from "better-auth/api";
import { sendEmail } from "@api/src/libs/email-libs";
import { ConfirmSignup, ResetPassword, emailBookidoLogoCidSrc } from "@repo/emails";
import { getLangFromRequest, t } from "@api/src/i18n/i18n-utils";
import {
  DEFAULT_USER_CALENDAR_CLOSED_SLOT_KEYS_JSON,
  DEFAULT_USER_CALENDAR_WEEK_HOURS_JSON,
} from "@api/src/common/default-calendar-availability";
// Load env before creating Prisma (auth.ts runs at import time, before Nest ConfigModule).
// Use process.cwd() so it works from dist/ (nest start) where cwd is apps/api.
const apiRoot = process.cwd();

loadDevelopmentEnvFromFiles(apiRoot);

const connectionString = process.env.DATABASE_URL

/** Browsers send `Origin: http://127.0.0.1:3000` or `http://localhost:3000` interchangeably. */
function addLocalhostLoopbackAliases(origins: string[]): string[] {
    const set = new Set(origins);
    for (const u of origins) {
        if (u.includes("://localhost")) {
            set.add(u.replace("://localhost", "://127.0.0.1"));
        }
    }
    return [...set];
}

/** Same idea as `main.ts` CORS: dev often uses 3000/3001 on localhost or 127.0.0.1. */
function buildBetterAuthTrustedOrigins(): string[] {
    const fromEnv = [
        process.env.FRONTEND_URL,
        process.env.MOBILE_URL_WEB,
        process.env.MOBILE_URL_EMULATOR,
        process.env.MOBILE_URL_LAN,
    ].filter((u): u is string => typeof u === "string" && u.trim().length > 0);

    const devDefaults =
        process.env.NODE_ENV === "development"
            ? [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3001",
            ]
            : [];

    return addLocalhostLoopbackAliases([...new Set([...fromEnv, ...devDefaults])]);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    session: {
        cookieCache: {
            enabled: false,
        },
    },
    user: {
        additionalFields: {
            bio: {
                type: "string",
                required: false,
            },
            archivedAt: {
                type: "date",
                required: false,
                input: false,
            },
        },
    },
    databaseHooks: {
        session: {
            create: {
                before: async (session, ctx) => {
                    if (!ctx) return;
                    const user = await ctx.context.internalAdapter.findUserById(session.userId);
                    const archivedAt = user && "archivedAt" in user ? (user as { archivedAt?: Date | null }).archivedAt : null;
                    if (archivedAt) {
                        throw APIError.from("FORBIDDEN", {
                            message: "This account is no longer accessible.",
                            code: "ACCOUNT_ARCHIVED",
                        });
                    }
                },
            },
        },
        user: {
            create: {
                before: async (user) => ({
                    data: {
                        ...user,
                        calendarWeekHours: DEFAULT_USER_CALENDAR_WEEK_HOURS_JSON,
                        calendarClosedSlotKeys: DEFAULT_USER_CALENDAR_CLOSED_SLOT_KEYS_JSON,
                    },
                }),
            },
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.AUTH_GOOGLE_CLIENT_ID,
            clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET
        },
    },
    plugins: [
        admin(),
    ],
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path === "/sign-in/email") {
                const body = ctx.body as { email?: string } | undefined;
                const raw = typeof body?.email === "string" ? body.email.trim() : "";
                if (raw.length > 0) {
                    const row = await prisma.user.findFirst({
                        where: { email: { equals: raw, mode: "insensitive" } },
                        select: { archivedAt: true },
                    });
                    if (row?.archivedAt) {
                        throw APIError.from("FORBIDDEN", {
                            message: "This account is no longer accessible.",
                            code: "ACCOUNT_ARCHIVED",
                        });
                    }
                }
            }
            return ctx;
        }),
    },
    database: prismaAdapter(prisma, {
        provider: "postgresql",
        // debugLogs: true
    }),

    emailAndPassword: {
        enabled: true,
        /** Comptes sans e-mail vérifié ne peuvent pas se connecter (`sendOnSignIn: false` évite d’attendre le SMTP à chaque tentative). */
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url, token }, request) => {
            const lang = getLangFromRequest({ request });
            await sendEmail({
                to: user.email,
                subject: t({
                    lang,
                    key: "auth.reset_password.subject",
                }),
                component: ResetPassword({
                    name: user.name,
                    url,
                    locale: lang,
                    brandLogoSrc: emailBookidoLogoCidSrc(),
                }),
            });
        },
        onPasswordReset: async ({ user }, request) => {
            // your logic here
            console.log(`Password for user ${user.email} has been reset.`);
        },

    },
    emailVerification: {
        sendOnSignUp: true,
        /** `true` + SMTP lent = sign-in peut rester bloqué après bon mot de passe (await côté serveur). */
        sendOnSignIn: false,
        /** After clicking the link in the email, create a session and set cookies before redirecting to the app. */
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url, token }, request) => {
            const lang = getLangFromRequest({ request });
            await sendEmail({
                to: user.email,
                subject: t({
                    lang,
                    key: "auth.signup_email.subject",
                }),
                component: ConfirmSignup({
                    name: user.name,
                    url,
                    locale: lang,
                    brandLogoSrc: emailBookidoLogoCidSrc(),
                }),
            });
        },
    },
    trustedOrigins: buildBetterAuthTrustedOrigins(),

});