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

async function bootstrap() {
  checkEnvVariablesAgaintZodSchema();

  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    cors: {
      // origin: ["capacitor://localhost","http://localhost", process.env.FRONTEND_URL as string, process.env.MOBILE_URL_WEB as string, process.env.MOBILE_URL_EMULATOR as string, "192.168.1.224", "http://192.168.1.224:3001"],
      // credentials: true,
      origin: "*",
      // credentials: true,
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
