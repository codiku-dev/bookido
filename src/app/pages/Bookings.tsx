import { useState } from "react";
import { Search, Filter } from "lucide-react";

interface Booking {
  id: number;
  client: string;
  email: string;
  service: string;
  date: string;
  time: string;
  price: number;
  status: "paid" | "pending" | "cancelled";
}

const allBookings: Booking[] = [
  { id: 1, client: "Marie Dupont", email: "marie@example.com", service: "1-on-1 Personal Training", date: "Apr 14", time: "09:00", price: 50, status: "paid" },
  { id: 2, client: "Pierre Martin", email: "pierre@example.com", service: "Nutrition Coaching", date: "Apr 14", time: "14:00", price: 40, status: "paid" },
  { id: 3, client: "Sophie Bernard", email: "sophie@example.com", service: "1-on-1 Personal Training", date: "Apr 15", time: "10:00", price: 50, status: "paid" },
  { id: 4, client: "Lucas Petit", email: "lucas@example.com", service: "Monthly Training Plan", date: "Apr 16", time: "15:00", price: 180, status: "pending" },
  { id: 5, client: "Emma Moreau", email: "emma@example.com", service: "5-Session Training Pack", date: "Apr 17", time: "11:00", price: 200, status: "paid" },
  { id: 6, client: "Thomas Laurent", email: "thomas@example.com", service: "1-on-1 Personal Training", date: "Apr 18", time: "16:00", price: 50, status: "paid" },
  { id: 7, client: "Camille Girard", email: "camille@example.com", service: "Nutrition Coaching", date: "Apr 10", time: "09:00", price: 40, status: "cancelled" },
];

export default function Bookings() {
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "cancelled">("all");
  const [search, setSearch] = useState("");

  const filteredBookings = allBookings.filter((booking) => {
    const matchesFilter = filter === "all" || booking.status === filter;
    const matchesSearch =
      search === "" ||
      booking.client.toLowerCase().includes(search.toLowerCase()) ||
      booking.service.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Bookings</h1>
        <p className="text-slate-600">Manage all your client bookings</p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by client name or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-3 rounded-xl transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("paid")}
              className={`px-4 py-3 rounded-xl transition-colors ${
                filter === "paid"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-3 rounded-xl transition-colors ${
                filter === "pending"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("cancelled")}
              className={`px-4 py-3 rounded-xl transition-colors ${
                filter === "cancelled"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Client</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Service</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Date & Time</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Price</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-slate-900">{booking.client}</div>
                      <div className="text-sm text-slate-500">{booking.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{booking.service}</td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900">{booking.date}</div>
                    <div className="text-sm text-slate-500">{booking.time}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">€{booking.price}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        booking.status === "paid"
                          ? "bg-green-50 text-green-700"
                          : booking.status === "pending"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No bookings found matching your criteria
        </div>
      )}
    </div>
  );
}
