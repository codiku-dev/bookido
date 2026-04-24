"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Plus, Wand2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { trpc } from "@web/libs/trpc-client";

export default function NewBooking() {
  const t = useTranslations();
  const router = useRouter();
  const utils = trpc.useUtils();
  const showDevFill = process.env.NODE_ENV === "development";

  const clientsQuery = trpc.clients.list.useQuery(undefined, { retry: false });
  const servicesQuery = trpc.services.list.useQuery(undefined, { retry: false });

  const createMutation = trpc.bookings.create.useMutation({
    onSuccess: async () => {
      toast.success(t("booking.create.toast.created"));
      await utils.bookings.list.invalidate();
      router.push("/admin/bookings");
    },
    onError: () => {
      toast.error(t("booking.create.toast.error"));
    },
  });

  const schema = useMemo(
    () =>
      z.object({
        clientId: z.string().min(1, t("booking.create.validation.clientRequired")),
        serviceId: z.string().min(1, t("booking.create.validation.serviceRequired")),
        date: z.string().min(1, t("booking.create.validation.dateRequired")),
        time: z.string().min(1, t("booking.create.validation.timeRequired")),
        amount: z
          .string()
          .min(1, t("booking.create.validation.amountRequired"))
          .regex(/^\d+(?:[.,]\d+)?$/, t("booking.create.validation.amountNumber")),
        payment: z.enum(["paid", "unpaid"]),
        status: z.enum(["confirmed", "pending", "cancelled"]),
        notes: z.string().optional(),
      }),
    [t],
  );

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: "",
      serviceId: "",
      date: "",
      time: "",
      amount: "",
      payment: "unpaid",
      status: "confirmed",
      notes: "",
    },
  });

  const clients = clientsQuery.data ?? [];
  const services = servicesQuery.data ?? [];

  const handleDevFill = () => {
    const c = clients[0];
    const s = services[0];
    if (!c || !s) {
      toast.message(t("booking.create.devFillUnavailable"));
      return;
    }
    form.reset({
      clientId: c.id,
      serviceId: s.id,
      date: "2026-04-24",
      time: "10:00",
      amount: String(s.isFree ? 0 : s.price),
      payment: "paid",
      status: "confirmed",
      notes: "Reservation creee en mode dev.",
    });
  };

  const onSubmit = form.handleSubmit((values) => {
    const amount = Number.parseFloat(values.amount.replace(",", "."));
    const startsAt = new Date(`${values.date}T${values.time}:00`).toISOString();
    const paidAmount = values.payment === "paid" ? amount : 0;
    const service = services.find((s) => s.id === values.serviceId);
    createMutation.mutate({
      clientId: values.clientId,
      serviceId: values.serviceId,
      startsAt,
      durationMinutes: service?.durationMinutes,
      price: amount,
      paidAmount,
      status: values.status,
      notes: values.notes?.trim() ? values.notes.trim() : undefined,
      paymentMethod: values.payment === "paid" ? t("booking.create.paymentMethodPaid") : "—",
    });
  });

  const backLink = (
    <button
      type="button"
      onClick={() => router.push("/admin/bookings")}
      className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 -ml-1"
    >
      <ArrowLeft className="w-4 h-4 shrink-0" />
      {t("booking.create.back")}
    </button>
  );

  const devFillControl = showDevFill ? (
    <Button type="button" variant="secondary" onClick={handleDevFill} className="gap-2">
      <Wand2 className="w-4 h-4" />
      {t("booking.create.devFill")}
    </Button>
  ) : null;

  const topBar = (
    <div className="flex items-center justify-between gap-4">
      {backLink}
      {devFillControl}
    </div>
  );

  const formFields = (
    <div className="grid gap-5 md:grid-cols-2">
      <FormField
        control={form.control}
        name="clientId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("booking.list.columns.client")}</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange} disabled={clients.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={t("booking.create.placeholders.client")} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="serviceId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("booking.list.columns.service")}</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange} disabled={services.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={t("booking.create.placeholders.service")} />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("booking.list.columns.date")}</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="time"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("booking.list.columns.time")}</FormLabel>
            <FormControl>
              <Input type="time" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("booking.list.columns.amount")} (€)</FormLabel>
            <FormControl>
              <Input
                type="text"
                inputMode="decimal"
                value={field.value}
                onChange={(e) => {
                  const normalized = e.target.value.replace(",", ".");
                  const next = normalized.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
                  field.onChange(next);
                }}
                placeholder="50"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="payment"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("booking.list.columns.payment")}</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">{t("booking.list.payment.paid")}</SelectItem>
                  <SelectItem value="unpaid">{t("booking.list.payment.unpaid")}</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>{t("booking.list.columns.status")}</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">{t("user.detail.status.confirmed")}</SelectItem>
                  <SelectItem value="pending">{t("booking.list.status.pending")}</SelectItem>
                  <SelectItem value="cancelled">{t("user.detail.status.cancelled")}</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>{t("booking.detail.notes")}</FormLabel>
            <FormControl>
              <Textarea rows={4} {...field} placeholder={t("booking.create.placeholders.notes")} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const submitRow = (
    <div className="flex justify-end">
      <Button type="submit" className="gap-2" disabled={createMutation.isPending}>
        <Plus className="w-4 h-4" />
        {t("booking.create.submit")}
      </Button>
    </div>
  );

  const formCard = (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-bold text-slate-900">{t("booking.create.title")}</h1>
      <p className="mt-2 text-slate-600">{t("booking.create.subtitle")}</p>

      {clientsQuery.isError || servicesQuery.isError ? (
        <p className="mt-4 text-sm text-red-600">{t("booking.create.loadError")}</p>
      ) : null}

      <Form {...form}>
        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          {formFields}
          {submitRow}
        </form>
      </Form>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {topBar}
        {formCard}
      </div>
    </div>
  );
}
