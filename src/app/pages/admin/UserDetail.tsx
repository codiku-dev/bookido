import { useNavigate } from "react-router";
import { useIntl } from "react-intl";
import { ArrowLeft, Mail, Phone, Calendar, Euro, Clock, MapPin, Eye } from "lucide-react";

// Mock user data - in production, fetch based on user ID
const userData = {
  id: 1,
  name: "Marie Dupont",
  email: "marie@example.com",
  phone: "+33 6 12 34 56 78",
  joinDate: "15 janvier 2024",
  totalBookings: 12,
  totalSpent: 540,
  status: "active" as const,
  lastBooking: "14 avril 2026",
  address: "12 rue de la Paix, 75002 Paris",
  notes: "Cliente régulière, préfère les sessions matinales",
};

const bookingHistory = [
  { id: 1, date: "14 avril 2026", time: "09:00", service: "1-on-1 Personal Training", price: 50, status: "confirmé" },
  { id: 2, date: "10 avril 2026", time: "09:00", service: "1-on-1 Personal Training", price: 50, status: "confirmé" },
  { id: 3, date: "5 avril 2026", time: "10:00", service: "Nutrition Coaching", price: 40, status: "confirmé" },
  { id: 4, date: "1 avril 2026", time: "09:00", service: "1-on-1 Personal Training", price: 50, status: "confirmé" },
  { id: 5, date: "28 mars 2026", time: "09:00", service: "5-Session Training Pack", price: 200, status: "confirmé" },
];

export default function UserDetail() {
  const navigate = useNavigate();
  const intl = useIntl();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate("/admin/calendar")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          {intl.formatMessage({ id: "common.back" })}
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 flex-shrink-0">
              {userData.name.charAt(0)}
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{userData.name}</h1>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      userData.status === "active"
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {userData.status === "active" ? intl.formatMessage({ id: "users.active" }) : intl.formatMessage({ id: "user.detail.status.cancelled" })}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                    {intl.formatMessage({ id: "booking.detail.contact" })}
                  </button>
                  <button className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium">
                    {intl.formatMessage({ id: "common.edit" })}
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-600">{intl.formatMessage({ id: "users.email" })}</div>
                    <div className="font-medium text-slate-900">{userData.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-600">{intl.formatMessage({ id: "users.phone" })}</div>
                    <div className="font-medium text-slate-900">{userData.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-600">{intl.formatMessage({ id: "user.detail.member.since" })}</div>
                    <div className="font-medium text-slate-900">{userData.joinDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-600">{intl.formatMessage({ id: "user.detail.address" })}</div>
                    <div className="font-medium text-slate-900">{userData.address}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{userData.totalBookings}</div>
            <div className="text-slate-600">{intl.formatMessage({ id: "user.detail.bookings.completed" })}</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-green-50 rounded-xl">
                <Euro className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">€{userData.totalSpent}</div>
            <div className="text-slate-600">{intl.formatMessage({ id: "user.detail.total.spent" })}</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-purple-50 rounded-xl">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-lg font-bold text-slate-900 mb-1">{userData.lastBooking}</div>
            <div className="text-slate-600">{intl.formatMessage({ id: "user.detail.last.booking" })}</div>
          </div>
        </div>

        {/* Notes */}
        {userData.notes && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{intl.formatMessage({ id: "user.detail.notes" })}</h2>
            <p className="text-slate-700">{userData.notes}</p>
          </div>
        )}

        {/* Booking History */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">{intl.formatMessage({ id: "user.detail.booking.history" })}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{intl.formatMessage({ id: "user.detail.date" })}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{intl.formatMessage({ id: "user.detail.time" })}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{intl.formatMessage({ id: "user.detail.service" })}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{intl.formatMessage({ id: "booking.detail.amount" })}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{intl.formatMessage({ id: "user.detail.status" })}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">{intl.formatMessage({ id: "user.detail.actions" })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bookingHistory.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-900">{booking.date}</td>
                    <td className="px-6 py-4 text-slate-600">{booking.time}</td>
                    <td className="px-6 py-4 text-slate-900">{booking.service}</td>
                    <td className="px-6 py-4 font-medium text-blue-600">€{booking.price}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        {intl.formatMessage({ id: "user.detail.view.details" })}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
