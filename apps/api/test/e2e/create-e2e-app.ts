import type { INestApplication, Type } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';

import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { SignInHook } from '../../src/features/authentication/signin-hook';
import { SignUpHook } from '../../src/features/authentication/signup-hook';

export type E2eAppResult = {
  app: INestApplication;
  moduleRef: TestingModule;
  prismaMock: PrismaService;
};

export function createE2ePrismaMock(): PrismaService {
  return {
    $connect: jest.fn(async () => undefined),
    $disconnect: jest.fn(async () => undefined),
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as PrismaService;
}

const defaultAuthHookStubs = {
  signUpHook: { handle: async () => ({}) },
  signInHook: {
    handle: async () => ({}),
    handleSocial: async () => ({}),
  },
};

export type CreateE2eAppOpts = {
  rootModule: Type<unknown>;
  prismaMock?: PrismaService;
  authHooks?: {
    signUpHook?: Record<string, unknown>;
    signInHook?: Record<string, unknown>;
  };
};

export async function createE2eApplication(p: CreateE2eAppOpts): Promise<E2eAppResult> {
  const prismaMock = p.prismaMock ?? createE2ePrismaMock();
  const signUpHook = { ...defaultAuthHookStubs.signUpHook, ...p.authHooks?.signUpHook };
  const signInHook = { ...defaultAuthHookStubs.signInHook, ...p.authHooks?.signInHook };

  const moduleRef = await Test.createTestingModule({
    imports: [p.rootModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prismaMock)
    .overrideProvider(SignUpHook)
    .useValue(signUpHook)
    .overrideProvider(SignInHook)
    .useValue(signInHook)
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  return { app, moduleRef, prismaMock };
}

export async function closeE2eApplication(app: INestApplication | undefined): Promise<void> {
  await app?.close();
}
