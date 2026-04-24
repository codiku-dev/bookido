import { defineConfig } from 'prisma/config';

/** Used only when DATABASE_URL is unset for CLI commands that never open a DB connection. */
const PRISMA_CONFIG_PLACEHOLDER_DATABASE_URL =
  'postgresql://127.0.0.1:5432/_prisma_config_placeholder?schema=public';

function resolveDatabaseUrl(): string {
  const fromEnv = process.env.DATABASE_URL?.trim();
  if (fromEnv) return fromEnv;

  // `prisma generate`, `validate`, `format`, and `version` load this file but do not connect.
  const argv = process.argv;
  const allowsPlaceholder =
    argv.includes('generate') ||
    argv.includes('validate') ||
    argv.includes('format') ||
    argv.includes('version') ||
    argv.includes('-v') ||
    argv.includes('--version');

  if (allowsPlaceholder) return PRISMA_CONFIG_PLACEHOLDER_DATABASE_URL;

  throw new Error('DATABASE_URL environment variable is not set');
}

export default defineConfig({
  schema: './src/infrastructure/prisma/schema.prisma',
  migrations: {
    path: './src/infrastructure/prisma/migrations',
  },
  datasource: {
    url: resolveDatabaseUrl(),
  },
});
