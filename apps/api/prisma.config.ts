import { defineConfig } from 'prisma/config';


const databaseUrl = process.env.DATABASE_URL;


if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export default defineConfig({
  schema: './src/infrastructure/prisma/schema.prisma',
  migrations: {
    path: './src/infrastructure/prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
