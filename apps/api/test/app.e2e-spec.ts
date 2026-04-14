import './e2e/register-mocks';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

import { AppModule } from '../src/app.module';
import { closeE2eApplication, createE2eApplication } from './e2e/create-e2e-app';
import { parseTrpcJsonResponse, trpcGet } from './e2e/trpc-http';

describe('AppModule (e2e)', () => {
  let fixture: Awaited<ReturnType<typeof createE2eApplication>> | undefined;

  beforeAll(async () => {
    fixture = await createE2eApplication({ rootModule: AppModule });
  });

  afterAll(async () => {
    await closeE2eApplication(fixture?.app);
  });

  it('/app.hello (TRPC)', async () => {
    if (!fixture?.app) {
      throw new Error('Nest application failed to initialize');
    }
    const response = await trpcGet(fixture.app, 'app.hello');
    const body = parseTrpcJsonResponse<{ message: string }>(response.text);

    expect(response.status).toBe(200);
    expect(body.result.data.message).toContain('Hello from public route');
  });
});
