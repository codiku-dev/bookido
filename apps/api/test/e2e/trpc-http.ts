import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

function normalizeTrpcPath(procedurePath: string): string {
  return procedurePath.replace(/^\/+/, '');
}

export async function trpcGet(app: INestApplication, procedurePath: string) {
  const path = normalizeTrpcPath(procedurePath);
  return request(app.getHttpServer()).get(`/trpc/${path}`);
}

export type TrpcJsonSuccessBody<T = unknown> = {
  result: { data: T };
};

export function parseTrpcJsonResponse<T = unknown>(text: string): TrpcJsonSuccessBody<T> {
  return JSON.parse(text) as TrpcJsonSuccessBody<T>;
}
