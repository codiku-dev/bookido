"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FilterX, Plus, Search, Users, X } from "lucide-react";
import { toast } from "sonner";

import { useLanguage } from "#/components/use-language";
import { formatShortDate } from "#/utils/dateFormat";
import ClientFormModal, { type ClientFormData } from "#/components/ClientFormModal";
import { LocaleDatePicker } from "#/components/LocaleDatePicker";
import { Button } from "#/components/ui/button";
import { Label } from "#/components/ui/label";
import { trpc } from "#/libs/trpc-client";

export default function UsersView() {
  const t = useTranslations();
  const router = useRouter();
  const { locale } = useLanguage();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [nextBookingFrom, setNextBookingFrom] = useState("");
  const [nextBookingTo, setNextBookingTo] = useState("");
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  const listQuery = trpc.clients.list.useQuery(undefined, { retry: false });
  const createMutation = trpc.clients.create.useMutation({
    onSuccess: async () => {
      await utils.clients.list.invalidate();
      setShowNewClientModal(false);
      toast.success(t("users.clients.created"));
    },
    onError: (err) => {
      toast.error(err.message || t("users.clients.saveError"));
    },
  });

  const allUsers = listQuery.data ?? [];

  const filteredUsers = useMemo(() => {
    const rows = allUsers;
    const q = search.trim().toLowerCase();
    const hasDateFilter = nextBookingFrom.length > 0 || nextBookingTo.length > 0;

    return rows.filter((user) => {
      const matchesSearch =
        q.length === 0 ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.phone.toLowerCase().includes(q);

      let matchesNextDate = true;
      if (hasDateFilter) {
        const nb = user.nextBookingDate;
        if (!nb) {
          matchesNextDate = false;
        } else {
          if (nextBookingFrom && nb < nextBookingFrom) matchesNextDate = false;
          if (nextBookingTo && nb > nextBookingTo) matchesNextDate = false;
        }
      }

      return matchesSearch && matchesNextDate;
    });
  }, [allUsers, search, nextBookingFrom, nextBookingTo]);

  const hasActiveFilters = search.length > 0 || nextBookingFrom.length > 0 || nextBookingTo.length > 0;

  const clearFilters = () => {
    setSearch("");
    setNextBookingFrom("");
    setNextBookingTo("");
  };

  const handleSaveNewClient = async (clientData: ClientFormData) => {
    await createMutation.mutateAsync({
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      address: clientData.address || undefined,
      notes: clientData.notes || undefined,
    });
  };

  const toolbar = (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("users.title")}</h1>
        <p className="text-slate-600">{t("users.subtitle")}</p>
      </div>
      <button
        type="button"
        onClick={() => setShowNewClientModal(true)}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
      >
        <Plus className="w-5 h-5" />
        {t("users.new.client")}
      </button>
    </div>
  );

  const filtersCard = (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,0.75fr)_minmax(190px,1fr)_minmax(190px,1fr)] gap-4 items-end">
        <div className="flex min-w-0 flex-col gap-1">
          <Label htmlFor="users-search" className="text-xs font-medium text-slate-500">
            {t("users.search.label")}
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="users-search"
              type="text"
              placeholder={t("users.search.placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {search.length > 0 ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label={t("users.search.clearAria")}
                className="absolute right-3 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-1 min-w-[190px]">
          <span className="text-xs font-medium text-slate-500">{t("users.nextBooking.filterLabel")}</span>
          <label htmlFor="users-next-from" className="text-xs font-medium text-slate-500">
            {t("users.nextBooking.from")}
          </label>
          <LocaleDatePicker
            id="users-next-from"
            value={nextBookingFrom}
            onChange={setNextBookingFrom}
            clearAriaLabel={t("users.nextBooking.clearFromAria")}
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[190px]">
          <label htmlFor="users-next-to" className="text-xs font-medium text-slate-500">
            {t("users.nextBooking.to")}
          </label>
          <LocaleDatePicker
            id="users-next-to"
            value={nextBookingTo}
            onChange={setNextBookingTo}
            clearAriaLabel={t("users.nextBooking.clearToAria")}
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FilterX className="w-4 h-4" />
          {t("users.clearFilters")}
        </button>
      </div>
    </div>
  );

  const tableHead = (
    <thead className="bg-slate-50 border-b border-slate-200">
      <tr>
        <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("users.name")}</th>
        <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("users.contact")}</th>
        <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("users.bookings")}</th>
        <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("users.nextBooking.column")}</th>
      </tr>
    </thead>
  );

  const tableBodyRows = listQuery.isLoading ? (
    <tr>
      <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
        {t("users.clients.loading")}
      </td>
    </tr>
  ) : listQuery.isError ? (
    <tr>
      <td colSpan={4} className="px-6 py-10 text-center text-sm text-red-600">
        {t("users.clients.loadError")}
      </td>
    </tr>
  ) : (
    filteredUsers.map((user) => (
      <tr
        key={user.id}
        onClick={() => router.push(`/admin/users/${user.id}`)}
        className="hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <td className="px-6 py-4">
          <div className="font-medium text-slate-900">{user.name}</div>
          <div className="text-sm text-slate-500">
            {t("user.detail.member.since")} {formatShortDate(String(user.createdAt).slice(0, 10), locale)}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-slate-900">{user.email}</div>
          <div className="text-sm text-slate-500">{user.phone}</div>
        </td>
        <td className="px-6 py-4">
          <div className="font-medium text-slate-900">{user.totalBookings}</div>
          <div className="text-sm text-slate-500">{t("users.sessions")}</div>
        </td>
        <td className="px-6 py-4">
          <div className="font-medium text-slate-900">
            {user.nextBookingDate ? formatShortDate(user.nextBookingDate, locale) : "—"}
          </div>
          <div className="text-sm text-slate-500">{user.nextBookingService || "—"}</div>
        </td>
      </tr>
    ))
  );

  const showEmptyList = !listQuery.isLoading && !listQuery.isError && allUsers.length === 0;
  const showEmptyFiltered =
    !listQuery.isLoading && !listQuery.isError && allUsers.length > 0 && filteredUsers.length === 0;

  const emptyListBlock = showEmptyList ? (
    <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-16 text-center">
      <Users className="mx-auto size-12 text-slate-300" aria-hidden />
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{t("users.clients.emptyList.title")}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">{t("users.clients.emptyList.description")}</p>
      <Button type="button" onClick={() => setShowNewClientModal(true)} className="mt-6 h-11 rounded-xl px-6">
        <Plus className="size-5" />
        {t("users.clients.emptyList.cta")}
      </Button>
    </div>
  ) : null;

  const emptyFilteredBlock = showEmptyFiltered ? (
    <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-14 text-center">
      <Search className="mx-auto size-11 text-slate-300" aria-hidden />
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{t("users.clients.emptyFiltered.title")}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">{t("users.clients.emptyFiltered.description")}</p>
      <Button
        type="button"
        variant="outline"
        onClick={clearFilters}
        disabled={!hasActiveFilters}
        className="mt-6 h-11 rounded-xl border-slate-200"
      >
        <FilterX className="size-4" />
        {t("users.clients.emptyFiltered.clear")}
      </Button>
    </div>
  ) : null;

  const table = (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        {tableHead}
        <tbody className="divide-y divide-slate-200">{tableBodyRows}</tbody>
      </table>
      {emptyListBlock}
      {emptyFilteredBlock}
    </div>
  );

  return (
    <div className="h-full flex">
      <div className="flex-1 p-8 overflow-auto">
        {toolbar}
        <ClientFormModal
          isOpen={showNewClientModal}
          onClose={() => setShowNewClientModal(false)}
          onSubmit={handleSaveNewClient}
          isSubmitting={createMutation.isPending}
        />
        {filtersCard}
        {table}
      </div>
    </div>
  );
}
