import { Injectable } from "@nestjs/common";
import {
    BeforeHook,
    Hook,
    AuthHookContext,
    AuthService,
} from "@thallesp/nestjs-better-auth";

@Hook()
@Injectable()
export class SignInHook {
    constructor(private readonly authService: AuthService) { }

    @BeforeHook("/sign-in/email")
    async handle(ctx: AuthHookContext) {
        console.log("SIGNIN HOOK");
        return ctx;
    }

    @BeforeHook("/sign-in/social")
    async handleSocial(ctx: AuthHookContext) {
        console.log("SIGNIN HOOK SOCIAL");
        return ctx;
    }
}