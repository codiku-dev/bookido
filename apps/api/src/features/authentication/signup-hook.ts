import { Injectable } from "@nestjs/common";
import {
    BeforeHook,
    Hook,
    AuthHookContext,
    AuthService,
} from "@thallesp/nestjs-better-auth";

@Hook()
@Injectable()
export class SignUpHook {
    constructor(private readonly authService: AuthService) { }

    @BeforeHook("/sign-up/email")
    async handle(ctx: AuthHookContext) {
        console.log("SIGNUP HOOK");
        return ctx;
    }
}