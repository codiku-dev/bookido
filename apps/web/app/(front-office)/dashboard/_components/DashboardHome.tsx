import { Calendar, TrendingUp, Euro, Users } from "lucide-react";

const upcomingBookings = [
  { id: 1, client: "Marie Dupont", service: "1-on-1 Personal Training", date: "Mon", time: "09:00", status: "paid" },
  { id: 2, client: "Pierre Martin", service: "Nutrition Coaching", date: "Mon", time: "14:00", status: "paid" },
  { id: 3, client: "Sophie Bernard", service: "1-on-1 Personal Training", date: "Tue", time: "10:00", status: "paid" },
  { id: 4, client: "Lucas Petit", service: "Monthly Training Plan", date: "Wed", time: "15:00", status: "pending" },
];

export default function DashboardHome() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Overview of your coaching business</p>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">12</div>
          <div className="text-slate-600">Bookings This Week</div>
          <div className="text-sm text-green-600 mt-2">+3 from last week</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <Euro className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">€540</div>
          <div className="text-slate-600">Revenue This Week</div>
          <div className="text-sm text-green-600 mt-2">+12% from last week</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">28</div>
          <div className="text-slate-600">Active Clients</div>
          <div className="text-sm text-green-600 mt-2">+5 this month</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">€2,180</div>
          <div className="text-slate-600">Revenue This Month</div>
          <div className="text-sm text-green-600 mt-2">+18% from last month</div>
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Upcoming Bookings</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {upcomingBookings.map((booking) => (
            <div key={booking.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-slate-900">{booking.client}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        booking.status === "paid"
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-slate-600">{booking.service}</p>
                </div>
                <div className="text-right">
                  <div className="font-medium text-slate-900">{booking.date}</div>
                  <div className="text-slate-600">{booking.time}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
