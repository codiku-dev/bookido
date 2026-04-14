import { Link, Outlet, useLocation } from "react-router";
import { LayoutDashboard, CalendarDays, Package, Calendar } from "lucide-react";
import BookidoLogo from "./components/BookidoLogo";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/dashboard/services", label: "Services", icon: Package },
  { path: "/dashboard/availability", label: "Availability", icon: CalendarDays },
  { path: "/dashboard/bookings", label: "Bookings", icon: Calendar },
];

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <Link to="/" className="flex items-center gap-3">
            <BookidoLogo className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Bookido</h1>
              <p className="text-sm text-slate-500">Sarah Johnson</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <Link
            to="/"
            className="block px-4 py-3 text-center text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            View Public Page
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
