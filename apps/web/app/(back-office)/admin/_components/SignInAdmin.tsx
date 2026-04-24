"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "motion/react";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, CircleAlert, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@repo/ui/utils/cn";
import BookidoLogo from "#/components/BookidoLogo";
import { Button } from "#/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { setAdminAuthBridgeCookie } from "@web/libs/admin-auth-bridge-cookie";
import { signIn, useSession } from "@web/libs/auth-client";
import { translateSigninAuthError } from "@web/utils/translate-signin-auth-error";

type SignInFormValues = {
  email: string;
  password: string;
};

/** Remettre à `true` pour réafficher le séparateur + le bouton Google. */
const ADMIN_GOOGLE_AUTH_UI_ENABLED = false;

const DEV_ADMIN_SIGNIN_EMAIL = "robin.lebhar@gmail.com";
const DEV_ADMIN_SIGNIN_PASSWORD = "Password123!";

function getOAuthCallbackURL() {
  const fromEnv = process.env["NEXT_PUBLIC_GOOGLE_AUTH_CALLBACK_URL"];
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/admin/signin`;
  }
  return "";
}

export default function SignInAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const { data: sessionPayload, isPending: sessionPending } = useSession();
  const [passwordVisible, setPasswordVisible] = useState(false);

  const redirectParam = searchParams.get("redirect");
  const redirectTo = redirectParam?.startsWith("/admin") ? redirectParam : "/admin";

  const signInSchema = useMemo(
    () =>
      z.object({
        email: z.string().email({ message: t("login.validation.emailInvalid") }),
        password: z.string().min(1, { message: t("login.validation.passwordRequired") }),
      }),
    [t],
  );

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (sessionPending) {
      return;
    }
    const user = sessionPayload?.user;
    if (!user) {
      return;
    }
    setAdminAuthBridgeCookie();
    router.replace(redirectTo);
  }, [sessionPending, sessionPayload, router, redirectTo]);

  const onSubmit = async (values: SignInFormValues) => {
    form.clearErrors("root");

    if (process.env.NODE_ENV === "development") {
      // DEBUG only — remove or keep behind a flag before any shared/staging deploy
      console.info("[SignInAdmin] signIn.email payload", {
        email: values.email,
        password: values.password,
      });
    }

    const res = await signIn.email({
      email: values.email,
      password: values.password,
    });

    if (res.error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[SignInAdmin] signIn.email error", {
          email: values.email,
          password: values.password,
          error: res.error,
        });
      }
      form.setError("root", { message: translateSigninAuthError({ error: res.error, t }) });
      return;
    }

    setAdminAuthBridgeCookie();
    router.push(redirectTo);
  };

  const handleGoogleSignIn = () => {
    form.clearErrors("root");
    const callbackURL = getOAuthCallbackURL();
    void signIn.social({
      provider: "google",
      callbackURL: callbackURL || undefined,
    });
  };

  const rootError = form.formState.errors.root?.message;

  const headerBlock = (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-4">
        <BookidoLogo className="w-20 h-20" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("login.title")}</h1>
      <p className="text-slate-600">{t("login.subtitle")}</p>
    </div>
  );

  const fieldClass = (invalid: boolean) =>
    cn(
      "w-full px-4 py-3 rounded-xl border focus-visible:ring-2 h-auto md:text-base",
      invalid
        ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"
        : "border-slate-300 focus-visible:ring-blue-600",
    );

  const fieldErrorAlert = (message: string | undefined) =>
    message ? (
      <Alert variant="destructive" className="mt-2 py-2.5 shadow-sm" role="alert">
        <CircleAlert className="size-4 shrink-0" aria-hidden />
        <AlertDescription className="text-sm font-medium leading-snug">{message}</AlertDescription>
      </Alert>
    ) : null;

  const errorAlert = rootError ? (
    <Alert variant="destructive" className="mb-6 shadow-sm" role="alert">
      <CircleAlert className="size-4 shrink-0" aria-hidden />
      <AlertTitle>{t("login.errors.title")}</AlertTitle>
      <AlertDescription className="font-medium">{rootError}</AlertDescription>
    </Alert>
  ) : null;

  const dividerBlock = (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-300" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-white text-slate-500">{t("login.orContinueWith")}</span>
      </div>
    </div>
  );

  const googleButtonBlock = (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleSignIn}
      disabled={form.formState.isSubmitting}
      className="w-full h-auto min-h-12 px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-700 text-base font-medium hover:bg-slate-50 flex items-center justify-center gap-3"
    >
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {t("login.google")}
    </Button>
  );

  const signUpFooter = (
    <p className="mt-6 text-center text-sm text-slate-600">
      {t("login.noAccountYet")}{" "}
      <Link href="/admin/signup" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
        {t("login.signUp")}
      </Link>
    </p>
  );

  const showDevFill = process.env.NODE_ENV === "development";

  const handleDevFill = () => {
    form.clearErrors();
    form.setValue("email", DEV_ADMIN_SIGNIN_EMAIL, { shouldValidate: true, shouldDirty: true });
    form.setValue("password", DEV_ADMIN_SIGNIN_PASSWORD, { shouldValidate: true, shouldDirty: true });
  };

  const devFillButton = showDevFill ? (
    <Button
      type="button"
      variant="secondary"
      onClick={handleDevFill}
      className="fixed top-4 right-4 z-50 gap-2 rounded-full border-0 bg-orange-500 px-4 py-2 text-white shadow-lg hover:bg-orange-600"
    >
      <Wand2 className="size-4 shrink-0" aria-hidden />
      {t("login.devFill")}
    </Button>
  ) : null;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-slate-100 flex items-center justify-center p-6">
      {devFillButton}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        {headerBlock}
        {errorAlert}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">
                    <Mail className="w-4 h-4" />
                    {t("login.email")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      autoComplete="email"
                      className={fieldClass(fieldState.invalid)}
                      placeholder={t("login.emailPlaceholder")}
                      aria-invalid={fieldState.invalid}
                    />
                  </FormControl>
                  {fieldErrorAlert(fieldState.error?.message)}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field, fieldState }) => {
                const passwordToggle = (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 size-9 -translate-y-1/2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    onClick={() => setPasswordVisible((v) => !v)}
                    aria-label={passwordVisible ? t("login.hidePassword") : t("login.showPassword")}
                    aria-pressed={passwordVisible}
                  >
                    {passwordVisible ? <EyeOff className="size-4 shrink-0" aria-hidden /> : <Eye className="size-4 shrink-0" aria-hidden />}
                  </Button>
                );

                const passwordInput = (
                  <div className="relative">
                    <Input
                      {...field}
                      type={passwordVisible ? "text" : "password"}
                      autoComplete="current-password"
                      className={cn(fieldClass(fieldState.invalid), "pr-11")}
                      placeholder="••••••••"
                      aria-invalid={fieldState.invalid}
                    />
                    {passwordToggle}
                  </div>
                );

                return (
                  <FormItem>
                    <FormLabel className="text-slate-700">
                      <Lock className="w-4 h-4" />
                      {t("login.password")}
                    </FormLabel>
                    <FormControl>{passwordInput}</FormControl>
                    {fieldErrorAlert(fieldState.error?.message)}
                  </FormItem>
                );
              }}
            />

            <div className="flex justify-end -mt-2">
              <Link
                href="/admin/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                {t("login.forgotPasswordLink")}
              </Link>
            </div>

            <Button
              type="submit"
              pending={form.formState.isSubmitting}
              pendingChildren={t("login.buttonPending")}
              className="w-full h-auto min-h-12 px-6 py-3 rounded-xl bg-blue-600 text-base text-white font-medium hover:bg-blue-700"
            >
              {t("login.button")}
            </Button>
          </form>
        </Form>

        {ADMIN_GOOGLE_AUTH_UI_ENABLED ? (
          <>
            {dividerBlock}
            {googleButtonBlock}
          </>
        ) : null}
        {signUpFooter}
      </motion.div>
    </div>
  );
}
