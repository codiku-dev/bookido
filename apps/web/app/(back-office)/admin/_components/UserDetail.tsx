"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Mail, Phone, Calendar, Euro, Clock, MapPin, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import ClientFormModal, { type ClientFormData } from "#/components/ClientFormModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { useLanguage } from "#/components/use-language";
import { formatShortDate } from "#/utils/dateFormat";
import { Button } from "#/components/ui/button";
import { trpc } from "#/libs/trpc-client";

const bookingHistory = [
  { id: 1, date: "14 avril 2026", time: "09:00", service: "1-on-1 Personal Training", price: 50, status: "confirmé" },
  { id: 2, date: "10 avril 2026", time: "09:00", service: "1-on-1 Personal Training", price: 50, status: "confirmé" },
  { id: 3, date: "5 avril 2026", time: "10:00", service: "Nutrition Coaching", price: 40, status: "confirmé" },
  { id: 4, date: "1 avril 2026", time: "09:00", service: "1-on-1 Personal Training", price: 50, status: "confirmé" },
  { id: 5, date: "28 mars 2026", time: "09:00", service: "5-Session Training Pack", price: 200, status: "confirmé" },
];

export default function UserDetail() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params["id"] === "string" ? params["id"] : "";
  const t = useTranslations();
  const { locale } = useLanguage();
  const utils = trpc.useUtils();
  const [editOpen, setEditOpen] = useState(false);

  const detailQuery = trpc.clients.getById.useQuery({ id }, { enabled: id.length > 0, retry: false });

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.clients.getById.invalidate({ id }), utils.clients.list.invalidate()]);
      setEditOpen(false);
      toast.success(t("users.clients.updated"));
    },
    onError: (err) => {
      toast.error(err.message || t("users.clients.saveError"));
    },
  });

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: async () => {
      await utils.clients.list.invalidate();
      toast.success(t("users.clients.deleted"));
      router.push("/admin/users");
    },
    onError: (err) => {
      toast.error(err.message || t("users.clients.deleteError"));
    },
  });

  const client = detailQuery.data;

  const initialForm: ClientFormData | undefined = useMemo(() => {
    if (!client) return undefined;
    return {
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address ?? "",
      notes: client.notes ?? "",
    };
  }, [client]);

  const joinLabel = client ? formatShortDate(String(client.createdAt).slice(0, 10), locale) : "";

  const lastBookingLabel =
    client?.lastBooking && client.lastBooking.length >= 10
      ? formatShortDate(client.lastBooking.slice(0, 10), locale)
      : "—";

  const deleteConfirmDialog = client ? (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          className="gap-2 shrink-0 bg-red-600 text-white hover:bg-red-700"
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="w-4 h-4" />
          {t("user.detail.deleteClient")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("user.detail.deleteConfirm.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("user.detail.deleteConfirm.description", { name: client.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("user.detail.deleteConfirm.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            onClick={(e) => {
              e.preventDefault();
              void deleteMutation.mutateAsync({ id });
            }}
            disabled={deleteMutation.isPending}
          >
            {t("user.detail.deleteConfirm.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null;

  const headerActions = client ? (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" className="gap-2 shrink-0" onClick={() => setEditOpen(true)}>
        <Pencil className="w-4 h-4" />
        {t("user.detail.editClient")}
      </Button>
      {deleteConfirmDialog}
    </div>
  ) : null;

  const profileCard =
    detailQuery.isLoading ? (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 mb-6">
        <p className="text-slate-600">{t("users.clients.loading")}</p>
      </div>
    ) : detailQuery.isError || !client ? (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 mb-6">
        <p className="text-red-600">{t("users.clients.detailError")}</p>
      </div>
    ) : (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 shrink-0">
            {client.name.charAt(0)}
          </div>

          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{client.name}</h1>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    client.status === "active" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {client.status === "active" ? t("users.active") : t("user.detail.status.cancelled")}
                </span>
              </div>
              {headerActions}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-600">{t("users.email")}</div>
                  <div className="font-medium text-slate-900">{client.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-600">{t("users.phone")}</div>
                  <div className="font-medium text-slate-900">{client.phone}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-600">{t("user.detail.member.since")}</div>
                  <div className="font-medium text-slate-900">{joinLabel}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-600">{t("user.detail.address")}</div>
                  <div className="font-medium text-slate-900">{client.address?.trim() ? client.address : "—"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  const statsRow =
    client && !detailQuery.isLoading ? (
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{client.totalBookings}</div>
          <div className="text-slate-600">{t("user.detail.bookings.completed")}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-50 rounded-xl">
              <Euro className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">€{client.totalSpent}</div>
          <div className="text-slate-600">{t("user.detail.total.spent")}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 mb-1">{lastBookingLabel}</div>
          <div className="text-slate-600">{t("user.detail.last.booking")}</div>
        </div>
      </div>
    ) : null;

  const notesBlock =
    client?.notes?.trim() && !detailQuery.isLoading ? (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">{t("user.detail.notes")}</h2>
        <p className="text-slate-700 whitespace-pre-wrap">{client.notes}</p>
      </div>
    ) : null;

  const historyTable = (
    <div className="bg-white rounded-2xl border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">{t("user.detail.booking.history")}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("user.detail.date")}</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("user.detail.time")}</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("user.detail.service")}</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("booking.detail.amount")}</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("user.detail.statusLabel")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {bookingHistory.map((booking) => (
              <tr
                key={booking.id}
                onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                className="hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 text-slate-900">{booking.date}</td>
                <td className="px-6 py-4 text-slate-600">{booking.time}</td>
                <td className="px-6 py-4 text-slate-900">{booking.service}</td>
                <td className="px-6 py-4 font-medium text-blue-600">€{booking.price}</td>
                <td className="px-6 py-4">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handleEditSave = async (data: ClientFormData) => {
    if (!id) return;
    await updateMutation.mutateAsync({
      id,
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address || undefined,
        notes: data.notes || undefined,
      },
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <button
          type="button"
          onClick={() => router.push("/admin/users")}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 -ml-1 mb-6"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          {t("common.back")}
        </button>

        {client && initialForm ? (
          <ClientFormModal
            isOpen={editOpen}
            onClose={() => setEditOpen(false)}
            onSubmit={handleEditSave}
            initialData={initialForm}
            isSubmitting={updateMutation.isPending}
          />
        ) : null}

        {profileCard}
        {statsRow}
        {notesBlock}
        {historyTable}
      </div>
    </div>
  );
}
