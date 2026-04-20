import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from '@api/src/app.module';
import { PrismaExceptionFilter } from '@api/src/infrastructure/prisma/prisma-exception.filter';
import { parseEnv, type Env } from '@api/env-type';
import { env } from 'node:process';

function checkEnvVariablesAgaintZodSchema() {
  try {
    parseEnv();
  } catch (err: unknown) {
    const issues = (err as { issues?: Array<{ path?: (string | number)[] }> })?.issues;
    const vars = issues?.length
      ? [...new Set(issues.map((i) => i.path?.filter(Boolean).join(".")).filter(Boolean))]
      : ["?"];
    const envKeys = Object.keys(process.env).sort().join(", ");
    console.error("\n❌ Environment validation failed\n");
    console.error("  App: apps/api");
    console.error(`  Missing: ${vars.join(", ")}`);
    console.error(`  process.env keys in this process: ${envKeys || "(none)"}\n`);
    process.exit(1);
  }
}

function buildCorsOrigins(): string[] {
  const fromEnv = [
    process.env["FRONTEND_URL"],
    process.env["MOBILE_URL_WEB"],
    process.env["MOBILE_URL_EMULATOR"],
    process.env["MOBILE_URL_LAN"],
  ].filter((u): u is string => typeof u === "string" && u.trim().length > 0);

  const devDefaults =
    process.env["NODE_ENV"] === "development"
      ? [
          "http://localhost:3000",
          "http://127.0.0.1:3000",
          "http://localhost:3001",
          "http://127.0.0.1:3001",
        ]
      : [];

  return [...new Set([...fromEnv, ...devDefaults])];
}

async function bootstrap() {
  checkEnvVariablesAgaintZodSchema();

  const corsOrigins = buildCorsOrigins();
  if (corsOrigins.length === 0) {
    console.warn("[CORS] Aucune origine configurée (FRONTEND_URL / MOBILE_*). Fallback localhost:3000.");
  }

  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    cors: {
      origin: corsOrigins.length > 0 ? corsOrigins : ["http://localhost:3000"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Bookido-Locale", "Accept-Language"],
    },
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new PrismaExceptionFilter());

  const port = Number(env.PORT) || 3090;

  await app.listen(port);

  const serverUrl = await app.getUrl();
  console.log(`🚀 Backend     : ${serverUrl}/trpc/app.hello`);
  console.log(`📚 Docs        : ${serverUrl}/docs`);
}

void bootstrap();
