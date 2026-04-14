import { useState } from "react";
import { X, User, Mail, Phone, MapPin, Save } from "lucide-react";
import { useIntl } from "react-intl";

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: ClientFormData) => void;
  initialData?: ClientFormData;
  title?: string;
}

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export default function ClientFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  title,
}: ClientFormModalProps) {
  const intl = useIntl();
  const [formData, setFormData] = useState<ClientFormData>(
    initialData || {
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  const modalTitle = title || intl.formatMessage({ id: "client.form.title.create" });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-slate-900">{modalTitle}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-slate-700 mb-2">
              <User className="w-4 h-4" />
              {intl.formatMessage({ id: "client.form.name" })}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Jean Dupont"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-slate-700 mb-2">
              <Mail className="w-4 h-4" />
              {intl.formatMessage({ id: "client.form.email" })}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="jean@example.com"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-slate-700 mb-2">
              <Phone className="w-4 h-4" />
              {intl.formatMessage({ id: "client.form.phone" })}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="+33 6 12 34 56 78"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-slate-700 mb-2">
              <MapPin className="w-4 h-4" />
              {intl.formatMessage({ id: "client.form.address" })}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="12 rue de la Paix, 75002 Paris"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-2">
              {intl.formatMessage({ id: "client.form.notes" })}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder={intl.formatMessage({ id: "client.form.notes.placeholder" })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <Save className="w-5 h-5" />
              {initialData
                ? intl.formatMessage({ id: "client.form.save" })
                : intl.formatMessage({ id: "client.form.create" })}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
            >
              {intl.formatMessage({ id: "client.form.cancel" })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
