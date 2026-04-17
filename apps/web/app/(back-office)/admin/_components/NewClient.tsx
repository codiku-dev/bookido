import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, MapPin, Save } from "lucide-react";
import { useTranslations } from "next-intl";

export default function NewClient() {
  const router = useRouter();
  const t = useTranslations("newClient");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, save to backend
    setSaved(true);
    setTimeout(() => {
      router.push("/admin/users");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push("/admin/users")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          {t("back")}
        </button>

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl mb-6">
            {t("success")}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">{t("title")}</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-slate-700 mb-2">
                <User className="w-4 h-4" />
                {t("fullName")}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder={t("placeholders.fullName")}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-slate-700 mb-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder={t("placeholders.email")}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-slate-700 mb-2">
                <Phone className="w-4 h-4" />
                {t("phone")}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder={t("placeholders.phone")}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-slate-700 mb-2">
                <MapPin className="w-4 h-4" />
                {t("address")}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder={t("placeholders.address")}
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-2">{t("notes")}</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder={t("placeholders.notes")}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                <Save className="w-5 h-5" />
                {t("submit")}
              </button>
              <button
                type="button"
                onClick={() => router.push("/admin/users")}
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
              >
                {t("cancel")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
