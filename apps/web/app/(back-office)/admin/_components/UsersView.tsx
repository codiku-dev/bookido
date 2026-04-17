import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, X, Mail, Phone, Calendar, Euro, Plus } from "lucide-react";
import { useLanguage } from "#/components/use-language";
import { formatShortDate } from "#/utils/dateFormat";
import ClientFormModal, { ClientFormData } from "#/components/ClientFormModal";
import { LocaleDatePicker } from "#/components/LocaleDatePicker";

type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  totalBookings: number;
  totalSpent: number;
  status: "active" | "inactive";
  lastBooking: string;
  nextBookingDate: string;
  nextBookingService: string;
};

const users: User[] = [
  {
    id: 1,
    name: "Marie Dupont",
    email: "marie@example.com",
    phone: "+33 6 12 34 56 78",
    joinDate: "2024-01-15",
    totalBookings: 12,
    totalSpent: 540,
    status: "active",
    lastBooking: "2026-04-14",
    nextBookingDate: "2026-04-21",
    nextBookingService: "Coaching Personnel 1-on-1",
  },
  {
    id: 2,
    name: "Pierre Martin",
    email: "pierre@example.com",
    phone: "+33 6 98 76 54 32",
    joinDate: "2024-02-20",
    totalBookings: 8,
    totalSpent: 360,
    status: "active",
    lastBooking: "2026-04-14",
    nextBookingDate: "2026-04-18",
    nextBookingService: "Coaching Nutrition",
  },
  {
    id: 3,
    name: "Sophie Bernard",
    email: "sophie@example.com",
    phone: "+33 6 11 22 33 44",
    joinDate: "2024-03-05",
    totalBookings: 15,
    totalSpent: 750,
    status: "active",
    lastBooking: "2026-04-15",
    nextBookingDate: "2026-04-22",
    nextBookingService: "Pack 5 Sessions",
  },
  {
    id: 4,
    name: "Lucas Petit",
    email: "lucas@example.com",
    phone: "+33 6 55 66 77 88",
    joinDate: "2024-01-08",
    totalBookings: 20,
    totalSpent: 980,
    status: "active",
    lastBooking: "2026-04-16",
    nextBookingDate: "2026-04-20",
    nextBookingService: "Coaching Personnel 1-on-1",
  },
  {
    id: 5,
    name: "Emma Moreau",
    email: "emma@example.com",
    phone: "+33 6 77 88 99 00",
    joinDate: "2023-12-10",
    totalBookings: 5,
    totalSpent: 200,
    status: "inactive",
    lastBooking: "2026-02-12",
    nextBookingDate: "",
    nextBookingService: "",
  },
];

export default function UsersView() {
  const t = useTranslations();
  const router = useRouter();
  const { locale } = useLanguage();
  const [search, setSearch] = useState("");
  const [nextBookingFrom, setNextBookingFrom] = useState("");
  const [nextBookingTo, setNextBookingTo] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  const handleSaveNewClient = (clientData: ClientFormData) => {
    // In production, save to backend
    console.log("New client:", clientData);
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const hasDateFilter = nextBookingFrom.length > 0 || nextBookingTo.length > 0;

    return users.filter((user) => {
      const matchesSearch =
        q.length === 0 ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.phone.toLowerCase().includes(q);

      let matchesNextDate = true;
      if (hasDateFilter) {
        if (!user.nextBookingDate) {
          matchesNextDate = false;
        } else {
          if (nextBookingFrom && user.nextBookingDate < nextBookingFrom) matchesNextDate = false;
          if (nextBookingTo && user.nextBookingDate > nextBookingTo) matchesNextDate = false;
        }
      }

      return matchesSearch && matchesNextDate;
    });
  }, [search, nextBookingFrom, nextBookingTo]);

  return (
    <div className="h-full flex">
      {/* Users Table */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("users.title")}</h1>
            <p className="text-slate-600">{t("users.subtitle")}</p>
          </div>
          <button
            onClick={() => setShowNewClientModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            {t("users.new.client")}
          </button>
        </div>

        <ClientFormModal
          isOpen={showNewClientModal}
          onClose={() => setShowNewClientModal(false)}
          onSave={handleSaveNewClient}
        />

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-4 items-end">
            <div className="relative min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={t("users.search.placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label htmlFor="users-next-from" className="text-xs font-medium text-slate-500">
                {t("users.nextBooking.from")}
              </label>
              <LocaleDatePicker
                id="users-next-from"
                value={nextBookingFrom}
                onChange={setNextBookingFrom}
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label htmlFor="users-next-to" className="text-xs font-medium text-slate-500">
                {t("users.nextBooking.to")}
              </label>
              <LocaleDatePicker id="users-next-to" value={nextBookingTo} onChange={setNextBookingTo} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("users.name")}</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("users.contact")}</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("users.bookings")}</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{t("users.nextBooking.column")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{user.name}</div>
                    <div className="text-sm text-slate-500">{t("user.detail.member.since")} {formatShortDate(user.joinDate, locale)}</div>
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
                    <div className="font-medium text-slate-900">{user.nextBookingDate ? formatShortDate(user.nextBookingDate, locale) : "—"}</div>
                    <div className="text-sm text-slate-500">{user.nextBookingService || "—"}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Panel */}
      {selectedUser && (
        <div className="w-96 bg-white border-l border-slate-200 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">{t("user.detail.title")}</h2>
            <button
              onClick={() => setSelectedUser(null)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Profile */}
            <div className="text-center pb-6 border-b border-slate-200">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4">
                {selectedUser.name.charAt(0)}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{selectedUser.name}</h3>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  selectedUser.status === "active"
                    ? "bg-green-50 text-green-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {selectedUser.status}
              </span>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900">{t("user.detail.information")}</h4>
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                  <Mail className="w-4 h-4" />
                  {t("users.email")}
                </div>
                <div className="text-slate-900">{selectedUser.email}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                  <Phone className="w-4 h-4" />
                  {t("users.phone")}
                </div>
                <div className="text-slate-900">{selectedUser.phone}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  {t("user.detail.member.since")}
                </div>
                <div className="text-slate-900">{formatShortDate(selectedUser.joinDate, locale)}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900">{t("user.detail.overview")}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-blue-600">{selectedUser.totalBookings}</div>
                  <div className="text-sm text-slate-600">{t("users.bookings")}</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-green-600">€{selectedUser.totalSpent}</div>
                  <div className="text-sm text-slate-600">{t("user.detail.total.spent")}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">{t("user.detail.last.booking")}</div>
                <div className="font-medium text-slate-900">{formatShortDate(selectedUser.lastBooking, locale)}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-slate-200 space-y-3">
              <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                {t("booking.detail.contact")}
              </button>
              <button className="w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                {t("users.view.details")}
              </button>
              <button className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors">
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
