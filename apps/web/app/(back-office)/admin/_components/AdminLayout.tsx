import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  NotebookText,
  Users,
  Package,
  UserCircle,
  LogOut,
} from "lucide-react";
import { useTranslations } from "next-intl";
import BookidoLogo from "#/components/BookidoLogo";

const navItems = [
  { path: "/admin", labelId: "nav.dashboard", icon: LayoutDashboard },
  { path: "/admin/calendar", labelId: "nav.calendar", icon: Calendar },
  { path: "/admin/bookings", labelId: "nav.bookings", icon: NotebookText, badgeCount: 1 },
  { path: "/admin/users", labelId: "nav.users", icon: Users },
  { path: "/admin/services", labelId: "nav.services", icon: Package },
  { path: "/admin/profile", labelId: "nav.profile", icon: UserCircle },
];

export default function AdminLayout(p: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();

  const handleLogout = () => {
    document.cookie = "admin-authenticated=; path=/; max-age=0; samesite=lax";
    router.push("/admin/login");
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <Link href="/" className="flex items-center gap-3">
            <BookidoLogo className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Bookido</h1>
              <p className="text-sm text-slate-500">Admin Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1">{t(item.labelId)}</span>
                  {item.badgeCount && item.badgeCount > 0 && (
                    <span className="min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-xs font-semibold flex items-center justify-center">
                      {item.badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            {t("nav.logout")}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {p.children}
      </main>
    </div>
  );
}
