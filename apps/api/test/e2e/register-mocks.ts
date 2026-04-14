import { Module } from '@nestjs/common';
import { jest } from '@jest/globals';

jest.mock('nestjs-i18n', () => {
  const nestCommon = require('@nestjs/common') as typeof import('@nestjs/common');

  class MockI18nModule {}
  nestCommon.Module({})(MockI18nModule);

  return {
    I18nModule: {
      forRoot: () => ({
        module: MockI18nModule,
        providers: [],
        exports: [],
      }),
    },
  };
});

jest.mock('@thallesp/nestjs-better-auth', () => {
  const common = require('@nestjs/common') as typeof import('@nestjs/common');

  const BEFORE_HOOK_KEY = Symbol('BEFORE_HOOK');
  const HOOK_KEY = Symbol('HOOK');

  @Module({})
  class MockAuthModule {}

  class AuthServiceToken {}

  const mockAuthServiceApi = {
    getSession: jest.fn(async () => null),
  };

  return {
    AuthModule: {
      forRoot: () => ({
        global: true,
        module: MockAuthModule,
        providers: [{ provide: AuthServiceToken, useValue: { api: mockAuthServiceApi } }],
        exports: [AuthServiceToken],
      }),
    },
    AuthService: AuthServiceToken,
    OptionalAuth: () => common.SetMetadata('OPTIONAL', true),
    Hook: () => common.SetMetadata(HOOK_KEY, true),
    BeforeHook: (pathKey: string) => common.SetMetadata(BEFORE_HOOK_KEY, pathKey),
    BaseUserSession: class MockBaseUserSession {},
  };
});

jest.mock('../../src/features/authentication/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(async () => null),
    },
  },
}));

jest.mock('trpc-ui', () => ({
  renderTrpcPanel: () => '<html><body>API Documentation</body></html>',
}));
