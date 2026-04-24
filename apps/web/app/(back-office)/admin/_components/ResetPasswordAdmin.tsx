"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "motion/react";
import { z } from "zod";
import { Lock, CircleAlert, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@repo/ui/utils/cn";
import BookidoLogo from "#/components/BookidoLogo";
import { Button } from "#/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { resetPassword } from "@web/libs/auth-client";

type ResetPasswordFormValues = {
  newPassword: string;
};

export default function ResetPasswordAdmin() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [success, setSuccess] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        newPassword: z.string().min(8, { message: t("resetPassword.validation.passwordMin") }),
      }),
    [t],
  );

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "" },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    form.clearErrors("root");
    if (!token) {
      form.setError("root", { message: t("resetPassword.errors.generic") });
      return;
    }

    const res = await resetPassword({
      newPassword: values.newPassword,
      token,
    });

    if (res.error) {
      const msg =
        typeof res.error === "object" && res.error !== null && "message" in res.error
          ? String((res.error as { message?: string }).message)
          : "";
      form.setError("root", { message: msg || t("resetPassword.errors.generic") });
      return;
    }

    setSuccess(true);
  };

  const rootError = form.formState.errors.root?.message;

  const headerBlock = (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-4">
        <BookidoLogo className="w-20 h-20" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("resetPassword.title")}</h1>
      <p className="text-slate-600">{t("resetPassword.subtitle")}</p>
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
      <AlertTitle>{t("resetPassword.errors.title")}</AlertTitle>
      <AlertDescription className="font-medium">{rootError}</AlertDescription>
    </Alert>
  ) : null;

  const successBlock = (
    <Alert className="mb-6 border-emerald-200 bg-emerald-50 text-emerald-950">
      <CheckCircle2 className="text-emerald-600" />
      <AlertTitle>{t("resetPassword.successTitle")}</AlertTitle>
      <AlertDescription className="text-emerald-900/90">{t("resetPassword.successDescription")}</AlertDescription>
    </Alert>
  );

  const signInButton = (
    <Button asChild variant="outline" className="mt-6 w-full h-auto min-h-12 rounded-xl">
      <Link href="/admin/signin">{t("resetPassword.signInCta")}</Link>
    </Button>
  );

  const invalidLinkHeader = (
    <div className="text-center mb-6">
      <div className="flex justify-center mb-4">
        <BookidoLogo className="w-20 h-20" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">{t("resetPassword.missingTokenTitle")}</h1>
    </div>
  );

  if (!token) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-slate-100 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
        >
          {invalidLinkHeader}
          <p className="mb-6 text-center text-sm text-slate-600">{t("resetPassword.missingTokenDescription")}</p>
          {signInButton}
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-slate-100 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
        >
          {headerBlock}
          {successBlock}
          {signInButton}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-slate-100 flex items-center justify-center p-6">
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
              name="newPassword"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">
                    <Lock className="w-4 h-4" />
                    {t("resetPassword.newPassword")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="new-password"
                      className={fieldClass(fieldState.invalid)}
                      placeholder={t("resetPassword.placeholder")}
                      aria-invalid={fieldState.invalid}
                    />
                  </FormControl>
                  {fieldErrorAlert(fieldState.error?.message)}
                </FormItem>
              )}
            />

            <Button
              type="submit"
              pending={form.formState.isSubmitting}
              pendingChildren={t("resetPassword.submitting")}
              className="w-full h-auto min-h-12 px-6 py-3 rounded-xl bg-blue-600 text-base text-white font-medium hover:bg-blue-700"
            >
              {t("resetPassword.submit")}
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-sm text-slate-600">
          <Link href="/admin/signin" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
            {t("forgotPassword.backToSignIn")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
