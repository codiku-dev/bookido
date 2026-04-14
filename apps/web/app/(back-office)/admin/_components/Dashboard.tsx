import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Users, Euro, ShoppingCart, ArrowUp, ArrowDown, Calendar } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslations } from "next-intl";

type Period = "weekly" | "monthly" | "yearly" | "custom";

const revenueDataByPeriod = {
  weekly: [
    { label: "Lun", revenue: 420 },
    { label: "Mar", revenue: 580 },
    { label: "Mer", revenue: 390 },
    { label: "Jeu", revenue: 650 },
    { label: "Ven", revenue: 480 },
    { label: "Sam", revenue: 720 },
    { label: "Dim", revenue: 550 },
  ],
  monthly: [
    { label: "Jan", revenue: 1200 },
    { label: "Fév", revenue: 1800 },
    { label: "Mar", revenue: 1600 },
    { label: "Avr", revenue: 2400 },
    { label: "Mai", revenue: 2180 },
    { label: "Juin", revenue: 2800 },
  ],
  yearly: [
    { label: "2020", revenue: 12000 },
    { label: "2021", revenue: 18000 },
    { label: "2022", revenue: 22000 },
    { label: "2023", revenue: 28000 },
    { label: "2024", revenue: 32000 },
    { label: "2025", revenue: 38000 },
  ],
  custom: [
    { label: "S1", revenue: 1200 },
    { label: "S2", revenue: 1800 },
    { label: "S3", revenue: 1600 },
    { label: "S4", revenue: 2400 },
  ],
};

const salesDataByPeriod = {
  weekly: [
    { label: "Lun", sales: 3 },
    { label: "Mar", sales: 5 },
    { label: "Mer", sales: 2 },
    { label: "Jeu", sales: 7 },
    { label: "Ven", sales: 4 },
    { label: "Sam", sales: 8 },
    { label: "Dim", sales: 6 },
  ],
  monthly: [
    { label: "S1", sales: 12 },
    { label: "S2", sales: 19 },
    { label: "S3", sales: 15 },
    { label: "S4", sales: 22 },
  ],
  yearly: [
    { label: "T1", sales: 120 },
    { label: "T2", sales: 180 },
    { label: "T3", sales: 150 },
    { label: "T4", sales: 220 },
  ],
  custom: [
    { label: "S1", sales: 12 },
    { label: "S2", sales: 19 },
    { label: "S3", sales: 15 },
    { label: "S4", sales: 22 },
  ],
};

export default function Dashboard() {
  const t = useTranslations();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("monthly");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const recentBookings = [
    { id: 1, client: "Marie Dupont", service: "Coaching Personnel 1-on-1", amount: 50, time: "2 heures" },
    { id: 2, client: "Pierre Martin", service: "Coaching Nutrition", amount: 40, time: "5 heures" },
    { id: 3, client: "Sophie Bernard", service: "Pack 5 Sessions", amount: 200, time: "1 jour" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {t("dashboard.title")}
        </h1>
        <p className="text-slate-600">{t("dashboard.welcome")}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Euro className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <ArrowUp className="w-4 h-4" />
              12%
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">€2,800</div>
          <div className="text-slate-600">{t("dashboard.revenue.month")}</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <ArrowUp className="w-4 h-4" />
              8%
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">+€680</div>
          <div className="text-slate-600">{t("dashboard.growth.month")}</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <ArrowUp className="w-4 h-4" />
              15%
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">142</div>
          <div className="text-slate-600">{t("dashboard.total.users")}</div>
          <div className="text-sm text-green-600 mt-2">+12 {t("dashboard.users.month")}</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex items-center gap-1 text-red-600 text-sm">
              <ArrowDown className="w-4 h-4" />
              3%
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">68</div>
          <div className="text-slate-600">{t("dashboard.sales.month")}</div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-slate-600" />
          <div className="flex gap-2">
            {(["weekly", "monthly", "yearly", "custom"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  period === p
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-blue-300"
                }`}
              >
                {t(`dashboard.period.${p}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        {period === "custom" && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">
                {t("dashboard.period.from")}
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">
                {t("dashboard.period.to")}
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            {t("dashboard.revenue.overview")}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueDataByPeriod[period]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: "#2563eb", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sales Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            {t("dashboard.weekly.sales")}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesDataByPeriod[period]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="sales" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {t("dashboard.recent.bookings")}
          </h2>
        </div>
        <div className="divide-y divide-slate-200">
          {recentBookings.map((booking) => (
            <div
              key={booking.id}
              onClick={() => router.push(`/admin/bookings/${booking.id}`)}
              className="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{booking.client}</h3>
                  <p className="text-sm text-slate-600">{booking.service}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">€{booking.amount}</div>
                  <div className="text-sm text-slate-500">il y a {booking.time}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
