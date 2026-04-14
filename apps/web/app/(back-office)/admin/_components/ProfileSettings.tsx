import { useState } from "react";
import { User, Mail, Lock, Save } from "lucide-react";
import { useTranslations } from "next-intl";
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {t("profile.title")}
        </h1>
        <p className="text-slate-600">{t("profile.subtitle")}</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Success Message */}
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl">
            ✓ {t("profile.saved")}
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 rounded-xl">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {t("profile.information")}
            </h2>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-6">
            <div>
              <label className="block text-slate-700 mb-2">
                {t("profile.full.name")}
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-2">
                {t("profile.email")}
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-2">
                {t("profile.bioTitle")}
              </label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder={t("profile.bio.placeholder")}
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Save className="w-5 h-5" />
              {t("profile.save.changes")}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Lock className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {t("profile.passwordTitle")}
            </h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label className="block text-slate-700 mb-2">
                {t("profile.password.current")}
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-2">
                {t("profile.password.new")}
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="••••••••"
              />
              <p className="text-sm text-slate-500 mt-2">
                {t("profile.password.requirement")}
              </p>
            </div>

            <div>
              <label className="block text-slate-700 mb-2">
                {t("profile.password.confirm")}
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="••••••••"
              />
              {passwordData.newPassword &&
                passwordData.confirmPassword &&
                passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-sm text-red-600 mt-2">
                    {t("profile.password.mismatch")}
                  </p>
                )}
            </div>

            <button
              type="submit"
              disabled={
                !passwordData.currentPassword ||
                !passwordData.newPassword ||
                passwordData.newPassword !== passwordData.confirmPassword
              }
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <Lock className="w-5 h-5" />
              {t("profile.password.update")}
            </button>
          </form>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            {t("profile.preferences")}
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-slate-700 mb-2">
                {t("profile.language")}
              </label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as "fr" | "en")}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="fr">{t("language.fr")}</option>
                <option value="en">{t("language.en")}</option>
              </select>
            </div>

            <div className="pt-6 border-t border-slate-200">
              <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                <div>
                  <div className="font-medium text-slate-900">
                    {t("profile.notificationsTitle")}
                  </div>
                  <div className="text-sm text-slate-600">
                    {t("profile.notifications.desc")}
                  </div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-red-900 mb-4">
            {t("profile.danger.zone")}
          </h2>
          <p className="text-red-700 mb-6">
            {t("profile.danger.warning")}
          </p>
          <button className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">
            {t("profile.delete.account")}
          </button>
        </div>
      </div>
    </div>
  );
}
