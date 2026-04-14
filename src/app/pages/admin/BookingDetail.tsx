import { useNavigate } from "react-router";
import { useIntl } from "react-intl";
import { ArrowLeft, User, Mail, Phone, Clock, Euro, Calendar, MapPin, MessageCircle, CalendarIcon, XCircle, Edit } from "lucide-react";

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
  const navigate = useNavigate();
  const intl = useIntl();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          {intl.formatMessage({ id: "common.back" })}
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
            <h2 className="text-xl font-bold text-slate-900 mb-4">{intl.formatMessage({ id: "booking.detail.client.info" })}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-600">{intl.formatMessage({ id: "booking.detail.client" })}</div>
                  <button
                    onClick={() => navigate(`/admin/users/${bookingData.client.id}`)}
                    className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {bookingData.client.name}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-600">{intl.formatMessage({ id: "users.email" })}</div>
                  <div className="font-medium text-slate-900">{bookingData.client.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-600">{intl.formatMessage({ id: "users.phone" })}</div>
                  <div className="font-medium text-slate-900">{bookingData.client.phone}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-600">{intl.formatMessage({ id: "user.detail.address" })}</div>
                  <div className="font-medium text-slate-900">{bookingData.location}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">{intl.formatMessage({ id: "booking.detail.payment.info" })}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">{intl.formatMessage({ id: "booking.detail.payment.method" })}</span>
                <span className="font-medium text-slate-900">{bookingData.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">{intl.formatMessage({ id: "booking.detail.amount" })}</span>
                <span className="font-bold text-blue-600">€{bookingData.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">{intl.formatMessage({ id: "user.detail.last.booking" })}</span>
                <span className="text-slate-900">{bookingData.createdAt}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">{intl.formatMessage({ id: "booking.detail.notes" })}</h3>
            <p className="text-slate-700">{bookingData.notes}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">{intl.formatMessage({ id: "booking.detail.actions" })}</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
              <MessageCircle className="w-5 h-5" />
              {intl.formatMessage({ id: "booking.detail.contact" })}
            </button>
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors font-medium">
              <Edit className="w-5 h-5" />
              {intl.formatMessage({ id: "booking.detail.edit" })}
            </button>
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium">
              <CalendarIcon className="w-5 h-5" />
              {intl.formatMessage({ id: "booking.detail.reschedule" })}
            </button>
          </div>
          <div className="mt-3">
            <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium">
              <XCircle className="w-5 h-5" />
              {intl.formatMessage({ id: "booking.detail.cancel" })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
