"use client";

import { useEffect, useState, type ReactNode } from "react";
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
  Euro,
} from "lucide-react";
import { useTranslations } from "next-intl";
import BookidoLogo from "#/components/BookidoLogo";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { clearAdminAuthBridgeCookie, setAdminAuthBridgeCookie } from "@web/libs/admin-auth-bridge-cookie";
import { signOut, useSession } from "@web/libs/auth-client";
import { trpc } from "@web/libs/trpc-client";

const navItems = [
  { path: "/admin", labelId: "nav.dashboard", icon: LayoutDashboard },
  { path: "/admin/calendar", labelId: "nav.calendar", icon: Calendar },
  { path: "/admin/bookings", labelId: "nav.bookings", icon: NotebookText },
  { path: "/admin/revenue", labelId: "nav.revenue", icon: Euro },
  { path: "/admin/users", labelId: "nav.users", icon: Users },
  { path: "/admin/services", labelId: "nav.services", icon: Package },
  { path: "/admin/profile", labelId: "nav.profile", icon: UserCircle },
];

export default function AdminLayout(p: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { data: sessionPayload, isPending: sessionPending } = useSession();
  const sessionReady = !sessionPending && Boolean(sessionPayload?.user);

  useEffect(() => {
    if (sessionPayload?.user) {
      setAdminAuthBridgeCookie();
    }
  }, [sessionPayload?.user]);

  const clientBookingBadgeQuery = trpc.bookings.clientBadgeCount.useQuery(undefined, {
    enabled: sessionReady,
    retry: false,
    staleTime: 20_000,
    refetchOnWindowFocus: true,
  });
  const clientBookingBadgeCount = clientBookingBadgeQuery.data ?? 0;

  const onboardingStatusQuery = trpc.profile.getAdminOnboardingStatus.useQuery(undefined, {
    enabled: sessionReady && pathname !== "/admin/onboarding",
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!sessionReady || pathname === "/admin/onboarding") {
      return;
    }
    if (onboardingStatusQuery.isPending) {
      return;
    }
    if (onboardingStatusQuery.data?.needsOnboarding) {
      router.replace("/admin/onboarding");
    }
  }, [sessionReady, pathname, onboardingStatusQuery.isPending, onboardingStatusQuery.data?.needsOnboarding, router]);

  const onboardingGateBlocking =
    sessionReady &&
    pathname !== "/admin/onboarding" &&
    (onboardingStatusQuery.isPending || onboardingStatusQuery.data?.needsOnboarding === true);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      /* session may already be cleared */
    } finally {
      clearAdminAuthBridgeCookie();
      if (typeof window !== "undefined") {
        window.location.replace("/admin/signin");
      }
    }
  };

  const logoutTriggerButton = (
    <button
      type="button"
      className="flex items-center gap-3 px-4 py-3 w-full text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
    >
      <LogOut className="w-5 h-5" />
      {t("nav.logout")}
    </button>
  );

  const logoutConfirmDialog = (
    <AlertDialog>
      <AlertDialogTrigger asChild>{logoutTriggerButton}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("nav.logoutDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("nav.logoutDialog.description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("nav.logoutDialog.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 text-white hover:bg-red-600/90"
            onClick={() => {
              setIsLoggingOut(true);
              void handleLogout();
            }}
          >
            {t("nav.logoutDialog.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const onboardingGateOverlay = onboardingGateBlocking ? (
    <div
      className="fixed inset-0 z-[150] flex flex-col items-center justify-center gap-3 bg-slate-50"
      aria-busy
      aria-live="polite"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
      <p className="text-sm font-medium text-slate-700">{t("onboarding.gateLoading")}</p>
    </div>
  ) : null;

  const logoutBlockingOverlay = isLoggingOut ? (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-sm"
      aria-busy
      aria-live="polite"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
      <p className="text-sm font-medium text-slate-700">{t("nav.logoutDialog.inProgress")}</p>
    </div>
  ) : null;

  if (onboardingGateBlocking) {
    return onboardingGateOverlay;
  }

  const userFullName = sessionPayload?.user?.name?.trim() ?? "";
  const userEmail = sessionPayload?.user?.email?.trim() ?? "";
  const userImage = sessionPayload?.user?.image?.trim() ?? "";
  const avatarFallback = userFullName.length > 0 ? userFullName.slice(0, 2).toUpperCase() : "AD";

  const accountIdentity = (
    <div className="border-b border-slate-200 px-6 py-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border border-slate-200">
          {userImage.length > 0 ? <AvatarImage src={userImage} alt={userFullName} /> : null}
          <AvatarFallback className="bg-slate-100 text-slate-700">{avatarFallback}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{userFullName.length > 0 ? userFullName : "Admin"}</p>
          <p className="truncate text-xs text-slate-500">{userEmail}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-screen bg-slate-50">
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
        {accountIdentity}

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
                  {item.path === "/admin/bookings" && clientBookingBadgeCount > 0 ? (
                    <span className="min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-xs font-semibold flex items-center justify-center">
                      {clientBookingBadgeCount > 99 ? "99+" : clientBookingBadgeCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-4 text-xs text-slate-500">
            <Link href="/privacy-policy" className="hover:text-slate-700 hover:underline">
              {t("legal.privacy.shortTitle")}
            </Link>
            <Link href="/terms-of-service" className="hover:text-slate-700 hover:underline">
              {t("legal.terms.shortTitle")}
            </Link>
          </div>
          {logoutConfirmDialog}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {p.children}
      </main>
      {logoutBlockingOverlay}
    </div>
  );
}
