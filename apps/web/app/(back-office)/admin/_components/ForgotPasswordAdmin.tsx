"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "motion/react";
import { z } from "zod";
import { Mail, MailCheck, CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@repo/ui/utils/cn";
import BookidoLogo from "#/components/BookidoLogo";
import { Button } from "#/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { requestPasswordReset } from "@web/libs/auth-client";

type ForgotPasswordFormValues = {
  email: string;
};

function getResetRedirectURL() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/admin/reset-password`;
  }
  return "";
}

export default function ForgotPasswordAdmin() {
  const t = useTranslations();
  const [emailSent, setEmailSent] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email({ message: t("login.validation.emailInvalid") }),
      }),
    [t],
  );

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    form.clearErrors("root");
    setEmailSent(false);

    const redirectTo = getResetRedirectURL();
    const res = await requestPasswordReset({
      email: values.email,
      redirectTo: redirectTo || undefined,
    });

    if (res.error) {
      const msg =
        typeof res.error === "object" && res.error !== null && "message" in res.error
          ? String((res.error as { message?: string }).message)
          : "";
      form.setError("root", { message: msg || t("forgotPassword.errors.generic") });
      return;
    }

    setEmailSent(true);
    form.reset({ email: "" });
  };

  const rootError = form.formState.errors.root?.message;

  const headerBlock = (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-4">
        <BookidoLogo className="w-20 h-20" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("forgotPassword.title")}</h1>
      <p className="text-slate-600">{t("forgotPassword.subtitle")}</p>
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
      <AlertTitle>{t("forgotPassword.successTitle")}</AlertTitle>
      <AlertDescription className="text-emerald-900/90">{t("forgotPassword.successDescription")}</AlertDescription>
    </Alert>
  ) : null;

  const errorAlert = rootError ? (
    <Alert variant="destructive" className="mb-6 shadow-sm" role="alert">
      <CircleAlert className="size-4 shrink-0" aria-hidden />
      <AlertTitle>{t("forgotPassword.errors.title")}</AlertTitle>
      <AlertDescription className="font-medium">{rootError}</AlertDescription>
    </Alert>
  ) : null;

  const backLink = (
    <p className="mt-6 text-center text-sm text-slate-600">
      <Link href="/admin/signin" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
        {t("forgotPassword.backToSignIn")}
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

        {!emailSent ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">
                      <Mail className="w-4 h-4" />
                      {t("forgotPassword.email")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        autoComplete="email"
                        className={fieldClass(fieldState.invalid)}
                        placeholder={t("forgotPassword.emailPlaceholder")}
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
                {form.formState.isSubmitting ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
              </Button>
            </form>
          </Form>
        ) : null}

        {backLink}
      </motion.div>
    </div>
  );
}
