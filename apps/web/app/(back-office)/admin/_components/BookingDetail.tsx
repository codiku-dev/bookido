import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, User, Mail, Phone, Clock, Euro, Calendar, MapPin, MessageCircle, CalendarIcon, XCircle } from "lucide-react";

// Mock booking data - in production, fetch based on booking ID
const bookingData = {
  id: 1,
  service: "1-on-1 Personal Training",
  date: "14 avril 2026",
  time: "09:00",
  duration: "60 min",
  price: 50,
  status: "confirmé" as const,
  client: {
    id: 1,
    name: "Marie Dupont",
    email: "marie@example.com",
    phone: "+33 6 12 34 56 78",
  },
  location: "Salle de sport principale",
  notes: "Cliente préfère les exercices de cardio. Objectif : perte de poids.",
  createdAt: "1 avril 2026",
  paymentMethod: "Carte bancaire",
};

export default function BookingDetail() {
  const router = useRouter();
  const t = useTranslations();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          {t("common.back")}
        </button>

        {/* Status Badge */}
        <div className="mb-6">
          <span
            className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
              bookingData.status === "confirmé"
                ? "bg-green-50 text-green-700"
                : bookingData.status === "en attente"
                ? "bg-yellow-50 text-yellow-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {bookingData.status.charAt(0).toUpperCase() + bookingData.status.slice(1)}
          </span>
        </div>

        {/* Main Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{bookingData.service}</h1>
              <div className="flex flex-wrap items-center gap-4 text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {bookingData.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {bookingData.time} ({bookingData.duration})
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600">€{bookingData.price}</div>
          </div>

          {/* Client Info */}
          <div className="pt-6 border-t border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{t("booking.detail.client.info")}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-600">{t("booking.detail.clientLabel")}</div>
                  <button
                    onClick={() => router.push(`/admin/users/${bookingData.client.id}`)}
                    className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {bookingData.client.name}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-600">{t("users.email")}</div>
                  <div className="font-medium text-slate-900">{bookingData.client.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-600">{t("users.phone")}</div>
                  <div className="font-medium text-slate-900">{bookingData.client.phone}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-600">{t("user.detail.address")}</div>
                  <div className="font-medium text-slate-900">{bookingData.location}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">{t("booking.detail.payment.info")}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">{t("booking.detail.payment.method")}</span>
                <span className="font-medium text-slate-900">{bookingData.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">{t("booking.detail.amount")}</span>
                <span className="font-bold text-blue-600">€{bookingData.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">{t("user.detail.last.booking")}</span>
                <span className="text-slate-900">{bookingData.createdAt}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">{t("booking.detail.notes")}</h3>
            <p className="text-slate-700">{bookingData.notes}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">{t("booking.detail.actions")}</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <a
              href={`mailto:${bookingData.client.email}?subject=${encodeURIComponent(`Booking ${bookingData.id} - ${bookingData.service}`)}`}
              className="group flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 hover:shadow-md transition-all font-medium"
            >
              <MessageCircle className="w-5 h-5" />
              {t("booking.detail.contact")}
            </a>
            <button
              onClick={() => router.push(`/admin/bookings/${bookingData.id}/reschedule`)}
              className="group flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all font-medium md:col-span-2"
            >
              <CalendarIcon className="w-5 h-5" />
              {t("booking.detail.reschedule")}
            </button>
          </div>
          <div className="mt-3">
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-all font-medium"
            >
              <XCircle className="w-5 h-5" />
              {t("booking.detail.cancel")}
            </button>
          </div>
        </div>
      </div>

      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t("booking.detail.cancelConfirm.title")}</h3>
              <p className="text-slate-600">{t("booking.detail.cancelConfirm.description")}</p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => {
                  setIsCancelModalOpen(false);
                  router.push("/admin/bookings");
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                {t("booking.detail.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
