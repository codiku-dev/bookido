import { config } from "@dotenvx/dotenvx";
import { resolve } from "path";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@api/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { admin } from "better-auth/plugins"
import { createAuthMiddleware } from "better-auth/api";
import { sendEmail } from "@api/src/libs/email-libs";
import { ConfirmSignup, ResetPassword } from "@repo/emails";
import { getLangFromRequest, t } from "@api/src/i18n/i18n-utils";
// Load env before creating Prisma (auth.ts runs at import time, before Nest ConfigModule).
// Use process.cwd() so it works from dist/ (nest start) where cwd is apps/api.
const apiRoot = process.cwd();

if (process.env['NODE_ENV'] === 'development') {
    config({ path: resolve(apiRoot, ".env") });
}

const connectionString = process.env.DATABASE_URL

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
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
            // console.log("BEFORE HOOK", ctx);
            return ctx;
        }),
    },
    database: prismaAdapter(prisma, {
        provider: "postgresql",
        // debugLogs: true
    }),

    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url, token }, request) => {
            const lang = getLangFromRequest({ request });
            void sendEmail({
                to: user.email,
                subject: t({
                    lang,
                    key: "auth.reset_password.subject",
                }),
                component: ResetPassword({ name: user.name, url, locale: lang }),
            });
        },
        onPasswordReset: async ({ user }, request) => {
            // your logic here
            console.log(`Password for user ${user.email} has been reset.`);
        },

    },
    emailVerification: {
        sendOnSignUp: true,
        sendVerificationEmail: async ({ user, url, token }, request) => {
            const lang = getLangFromRequest({ request });
            void sendEmail({
                to: user.email,
                subject: t({
                    lang,
                    key: "auth.signup_email.subject",
                }),
                component: ConfirmSignup({ name: user.name, url, locale: lang }),
            });
        },
    },
    trustedOrigins: [process.env.FRONTEND_URL as string, process.env.MOBILE_URL_WEB as string, process.env.MOBILE_URL_EMULATOR as string],

});