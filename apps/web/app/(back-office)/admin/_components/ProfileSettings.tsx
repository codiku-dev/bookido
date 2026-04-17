import { useMemo, useState } from "react";
import {
  CreditCard,
  Lock,
  Receipt,
  Save,
  ShieldAlert,
  User,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import { useLanguage } from "#/components/use-language";

export default function ProfileSettings() {
  const t = useTranslations();
  const { locale, setLocale } = useLanguage();

  const [profileData, setProfileData] = useState({
    name: "Sarah Johnson",
    email: "sarah@example.com",
    bio: "Coach personnel certifié avec plus de 10 ans d'expérience pour aider les clients à atteindre leurs objectifs de remise en forme.",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [saved, setSaved] = useState(false);
  const [billingCancelled, setBillingCancelled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const upcomingInvoice = useMemo(
    () => ({
      amount: "$49.00",
      date: locale === "fr" ? "28 avril 2026" : "April 28, 2026",
      plan: t("profile.billing.plan.name"),
    }),
    [locale, t],
  );

  const paymentHistory = useMemo(
    () => [
      {
        id: "next_payment",
        amount: upcomingInvoice.amount,
        date: upcomingInvoice.date,
        statusKey: "upcoming",
        isUpcoming: true,
      },
      {
        id: "inv_2026_04",
        amount: "$49.00",
        date: locale === "fr" ? "28 mars 2026" : "March 28, 2026",
        statusKey: "paid",
        isUpcoming: false,
      },
      {
        id: "inv_2026_03",
        amount: "$49.00",
        date: locale === "fr" ? "28 février 2026" : "February 28, 2026",
        statusKey: "paid",
        isUpcoming: false,
      },
      {
        id: "inv_2026_02",
        amount: "$49.00",
        date: locale === "fr" ? "28 janvier 2026" : "January 28, 2026",
        statusKey: "paid",
        isUpcoming: false,
      },
    ],
    [locale, upcomingInvoice.amount, upcomingInvoice.date],
  );

  const billingPaymentHistorySection = (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Receipt className="h-5 w-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">{t("profile.billing.history.title")}</h3>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-4 py-2.5 font-medium text-slate-600">
                {t("profile.billing.history.columns.date")}
              </th>
              <th className="px-4 py-2.5 font-medium text-slate-600">
                {t("profile.billing.history.columns.amount")}
              </th>
              <th className="px-4 py-2.5 font-medium text-slate-600">
                {t("profile.billing.history.columns.status")}
              </th>
              <th className="px-4 py-2.5 text-right font-medium text-slate-600">
                {t("profile.billing.history.columns.invoice")}
              </th>
            </tr>
          </thead>
          <tbody>
            {paymentHistory.map((payment) => {
              const statusLabel = t(`profile.billing.history.status.${payment.statusKey}`);

              return (
                <tr key={payment.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 text-slate-700">{payment.date}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{payment.amount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={payment.isUpcoming ? "secondary" : "outline"}>{statusLabel}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {payment.isUpcoming ? (
                      <span className="text-slate-400">-</span>
                    ) : (
                      <Button variant="link" size="sm" className="h-auto p-0 text-blue-600">
                        {t("profile.billing.history.download")}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword === passwordData.confirmPassword) {
      // Handle password change
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleCancelSubscription = () => {
    setBillingCancelled(true);
  };

  const renderSuccessMessage = saved ? (
    <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-4 text-green-800">
      {t("profile.saved")}
    </div>
  ) : null;

  const billingStatusBadge = (
    <Badge variant={billingCancelled ? "outline" : "secondary"} className="capitalize">
      {billingCancelled
        ? t("profile.billing.status.cancelled")
        : t("profile.billing.status.active")}
    </Badge>
  );

  const billingOverview = (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3">
              <CreditCard className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                {t("profile.billing.title")}
              </CardTitle>
              <CardDescription>{t("profile.billing.subtitle")}</CardDescription>
            </div>
          </div>
        </div>
        {billingStatusBadge}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">{t("profile.billing.plan.label")}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {t("profile.billing.plan.name")}
            </p>
            <p className="text-sm text-slate-600">{t("profile.billing.plan.description")}</p>
            <Button variant="outline" size="sm" className="mt-3">
              {t("profile.billing.plan.change")}
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">{t("profile.billing.payment.method")}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Visa •••• 4242</p>
            <p className="text-sm text-slate-600">{t("profile.billing.card.expires")}</p>
            <Button variant="outline" size="sm" className="mt-3">
              {t("profile.billing.payment.change")}
            </Button>
          </div>
        </div>

        {billingPaymentHistorySection}
      </CardContent>
      <CardFooter className="flex justify-end border-t">
        <Button
          variant="destructive"
          onClick={handleCancelSubscription}
          disabled={billingCancelled}
        >
          <XCircle className="h-4 w-4" />
          {billingCancelled
            ? t("profile.billing.manage.cancelled")
            : t("profile.billing.manage.cancel")}
        </Button>
      </CardFooter>
    </Card>
  );

  const profileInformationSection = (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            {t("profile.information")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleProfileSave} className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <Label htmlFor="profile-name">{t("profile.full.name")}</Label>
            <Input
              id="profile-name"
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className="h-11 border-slate-300 bg-white"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <Label htmlFor="profile-email">{t("profile.email")}</Label>
            <Input
              id="profile-email"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              className="h-11 border-slate-300 bg-white"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <Label htmlFor="profile-bio">{t("profile.bioTitle")}</Label>
            <Textarea
              id="profile-bio"
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              rows={5}
              placeholder={t("profile.bio.placeholder")}
              className="border-slate-300 bg-white"
            />
          </div>

          <Button type="submit">
            <Save className="h-4 w-4" />
            {t("profile.save.changes")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const passwordSection = (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-purple-50 p-3">
            <Lock className="h-6 w-6 text-purple-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            {t("profile.passwordTitle")}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="current-password">{t("profile.password.current")}</Label>
            <Input
              id="current-password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, currentPassword: e.target.value })
              }
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">{t("profile.password.new")}</Label>
            <Input
              id="new-password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="••••••••"
            />
            <p className="text-sm text-slate-500">{t("profile.password.requirement")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t("profile.password.confirm")}</Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
              placeholder="••••••••"
            />
            {passwordData.newPassword &&
              passwordData.confirmPassword &&
              passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-sm text-red-600">{t("profile.password.mismatch")}</p>
              )}
          </div>

          <Button
            type="submit"
            disabled={
              !passwordData.currentPassword ||
              !passwordData.newPassword ||
              passwordData.newPassword !== passwordData.confirmPassword
            }
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Lock className="h-4 w-4" />
            {t("profile.password.update")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const preferencesSection = (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-slate-900">
          {t("profile.preferences")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="language-select">{t("profile.language")}</Label>
          <Select value={locale} onValueChange={(value) => setLocale(value as "fr" | "en")}>
            <SelectTrigger id="language-select" className="h-11 border-slate-300 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-300 shadow-lg">
              <SelectItem value="fr">{t("language.fr")}</SelectItem>
              <SelectItem value="en">{t("language.en")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
          <div className="space-y-1">
            <p className="font-medium text-slate-900">{t("profile.notificationsTitle")}</p>
            <p className="text-sm text-slate-600">{t("profile.notifications.desc")}</p>
          </div>
          <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
        </div>
      </CardContent>
    </Card>
  );

  const dangerZoneSection = (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-red-600" />
          <CardTitle className="text-2xl font-bold text-red-900">
            {t("profile.danger.zone")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-red-700">{t("profile.danger.warning")}</p>
      </CardContent>
      <CardFooter>
        <Button variant="destructive" className="bg-red-600 text-white hover:bg-red-700">
          {t("profile.delete.account")}
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {t("profile.title")}
        </h1>
        <p className="text-slate-600">{t("profile.subtitle")}</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {renderSuccessMessage}
        {profileInformationSection}
        {passwordSection}
        {preferencesSection}
        {billingOverview}
        {dangerZoneSection}
      </div>
    </div>
  );
}
