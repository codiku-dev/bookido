"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "motion/react";
import { z } from "zod";
import { Mail, Lock, User, MailCheck, CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@repo/ui/utils/cn";
import BookidoLogo from "#/components/BookidoLogo";
import { Button } from "#/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { signIn, signUp } from "@web/libs/auth-client";
import { translateSignupAuthError } from "@web/utils/translate-signup-auth-error";

type SignUpFormValues = {
  name: string;
  email: string;
  password: string;
};

/** Remettre à `true` pour réafficher le séparateur + le bouton Google. */
const ADMIN_GOOGLE_AUTH_UI_ENABLED = false;

function getEmailCallbackURL() {
  const fromEnv = process.env["NEXT_PUBLIC_GOOGLE_AUTH_CALLBACK_URL"];
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/admin/signin`;
  }
  return "";
}

export default function SignUpAdmin() {
  const t = useTranslations();
  const [emailSent, setEmailSent] = useState(false);

  const signupSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, { message: t("signup.validation.nameMin") }),
        email: z.string().email({ message: t("signup.validation.emailInvalid") }),
        password: z.string().min(8, { message: t("signup.validation.passwordMin") }),
      }),
    [t],
  );

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: SignUpFormValues) => {
    form.clearErrors("root");
    setEmailSent(false);

    const callbackURL = getEmailCallbackURL();
    const res = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: callbackURL || undefined,
    });

    if (res.error) {
      form.setError("root", { message: translateSignupAuthError({ error: res.error, t }) });
      return;
    }

    setEmailSent(true);
    form.reset({ name: "", email: "", password: "" });
  };

  const handleGoogleSignUp = () => {
    form.clearErrors("root");
    setEmailSent(false);
    const callbackURL = getEmailCallbackURL();
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
      <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("signup.title")}</h1>
      <p className="text-slate-600">{t("signup.subtitle")}</p>
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

  const successAlert = emailSent ? (
    <Alert className="mb-6 border-emerald-200 bg-emerald-50 text-emerald-950">
      <MailCheck className="text-emerald-600" />
      <AlertTitle>{t("signup.successTitle")}</AlertTitle>
      <AlertDescription className="text-emerald-900/90">{t("signup.successDescription")}</AlertDescription>
    </Alert>
  ) : null;

  const errorAlert = rootError ? (
    <Alert variant="destructive" className="mb-6 shadow-sm" role="alert">
      <CircleAlert className="size-4 shrink-0" aria-hidden />
      <AlertTitle>{t("signup.errors.title")}</AlertTitle>
      <AlertDescription className="font-medium">{rootError}</AlertDescription>
    </Alert>
  ) : null;

  const dividerBlock = (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-300" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-white text-slate-500">{t("signup.orContinueWith")}</span>
      </div>
    </div>
  );

  const googleButtonBlock = (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleSignUp}
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
      {t("signup.google")}
    </Button>
  );

  const signInFooter = (
    <p className="mt-6 text-center text-sm text-slate-600">
      {t("signup.alreadyHaveAccount")}{" "}
      <Link href="/admin/signin" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
        {t("signup.signIn")}
      </Link>
    </p>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-slate-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        {headerBlock}
        {successAlert}
        {errorAlert}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">
                    <User className="w-4 h-4" />
                    {t("signup.name")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="name"
                      className={fieldClass(fieldState.invalid)}
                      placeholder={t("signup.namePlaceholder")}
                      aria-invalid={fieldState.invalid}
                    />
                  </FormControl>
                  {fieldErrorAlert(fieldState.error?.message)}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">
                    <Mail className="w-4 h-4" />
                    {t("signup.email")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      autoComplete="email"
                      className={fieldClass(fieldState.invalid)}
                      placeholder={t("signup.emailPlaceholder")}
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
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">
                    <Lock className="w-4 h-4" />
                    {t("signup.password")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="new-password"
                      className={fieldClass(fieldState.invalid)}
                      placeholder="••••••••"
                      aria-invalid={fieldState.invalid}
                    />
                  </FormControl>
                  {fieldErrorAlert(fieldState.error?.message)}
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full h-auto min-h-12 px-6 py-3 rounded-xl bg-blue-600 text-base text-white font-medium hover:bg-blue-700"
            >
              {form.formState.isSubmitting ? t("signup.buttonPending") : t("signup.button")}
            </Button>
          </form>
        </Form>

        {ADMIN_GOOGLE_AUTH_UI_ENABLED ? (
          <>
            {dividerBlock}
            {googleButtonBlock}
          </>
        ) : null}
        {signInFooter}
      </motion.div>
    </div>
  );
}
