"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Mail, MapPin, Phone, Save, User, Wand2 } from "lucide-react";

import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";

const buildClientFormSchema = (p: { required: string; emailInvalid: string }) =>
  z.object({
    name: z.string().min(1, p.required),
    email: z.string().email(p.emailInvalid),
    phone: z.string().min(1, p.required),
    address: z.string().optional(),
    notes: z.string().optional(),
});

export type ClientFormData = z.infer<ReturnType<typeof buildClientFormSchema>>;

type ClientFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (client: ClientFormData) => void | Promise<void>;
  initialData?: ClientFormData;
  title?: string;
  isSubmitting?: boolean;
  /** Rendered inside the dialog header (e.g. back link on full-page flows). */
  headerStart?: ReactNode;
};

export default function ClientFormModal(p: ClientFormModalProps) {
  const t = useTranslations("ClientForm");
  const tVal = useTranslations("ClientForm.validation");

  const clientFormSchema = useMemo(
    () =>
      buildClientFormSchema({
        required: tVal("required"),
        emailInvalid: tVal("emailInvalid"),
      }),
    [tVal],
  );

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  const { reset } = form;

  const isDev = process.env.NODE_ENV === "development";

  const handleDevFill = () => {
    const timestamp = Date.now();
    form.setValue("name", "Sophie Martin", { shouldDirty: true, shouldValidate: true });
    form.setValue("email", `sophie.martin+${timestamp}@example.com`, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("phone", "+33 6 22 33 44 55", { shouldDirty: true, shouldValidate: true });
    form.setValue("address", "18 avenue Victor Hugo, 75016 Paris", { shouldDirty: true, shouldValidate: true });
    form.setValue("notes", "Pratique le yoga et prefere les creneaux du matin.", {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  useEffect(() => {
    if (!p.isOpen) return;
    reset(
      p.initialData ?? {
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      },
    );
  }, [p.isOpen, p.initialData, reset]);

  const handleOpenChange = (open: boolean) => {
    if (!open) p.onClose();
  };

  const header = (
    <DialogHeader>
      {p.headerStart ? <div className="mb-2">{p.headerStart}</div> : null}
      <DialogTitle>{p.title ?? (p.initialData ? t("title.edit") : t("title.create"))}</DialogTitle>
    </DialogHeader>
  );

  const fields = (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="client-name" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          {t("name")}
        </Label>
        <Input
          id="client-name"
          {...form.register("name")}
          placeholder={t("placeholders.name")}
          disabled={p.isSubmitting}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="client-email" className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          {t("email")}
        </Label>
        <Input
          id="client-email"
          type="email"
          {...form.register("email")}
          placeholder={t("placeholders.email")}
          disabled={p.isSubmitting}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="client-phone" className="flex items-center gap-2">
          <Phone className="w-4 h-4" />
          {t("phone")}
        </Label>
        <Input
          id="client-phone"
          type="tel"
          {...form.register("phone")}
          placeholder={t("placeholders.phone")}
          disabled={p.isSubmitting}
        />
        {form.formState.errors.phone && (
          <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="client-address" className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {t("address")}
        </Label>
        <Input
          id="client-address"
          {...form.register("address")}
          placeholder={t("placeholders.address")}
          disabled={p.isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="client-notes">{t("notes.label")}</Label>
        <Textarea
          id="client-notes"
          rows={4}
          {...form.register("notes")}
          placeholder={t("notes.placeholder")}
          disabled={p.isSubmitting}
        />
      </div>
    </div>
  );

  const footer = (
    <DialogFooter className="gap-2 sm:gap-0">
      {isDev ? (
        <Button type="button" variant="outline" onClick={handleDevFill} disabled={p.isSubmitting}>
          <Wand2 className="w-4 h-4" />
          {t("devFill")}
        </Button>
      ) : null}
      <Button type="button" variant="secondary" onClick={p.onClose} disabled={p.isSubmitting}>
        {t("cancel")}
      </Button>
      <Button type="submit" disabled={p.isSubmitting}>
        <Save className="w-4 h-4" />
        {p.initialData ? t("save") : t("create")}
      </Button>
    </DialogFooter>
  );

  return (
    <Dialog open={p.isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form
          onSubmit={form.handleSubmit(async (data) => {
            await p.onSubmit(data);
          })}
        >
          {header}
          {fields}
          {footer}
        </form>
      </DialogContent>
    </Dialog>
  );
}
