import { useState, Fragment, useRef } from "react";
import { useIntl } from "react-intl";
import { Plus, Pencil, Trash2, Clock, Euro, Package, Image as ImageIcon, Calendar } from "lucide-react";

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
  isFree: boolean;
  packSize: number;
  imageUrl: string;
  description: string;
  availableSlots: Set<string>;
  requiresValidation: boolean;
}

const daysOfWeek = [
  { short: "Lun", full: "Lundi" },
  { short: "Mar", full: "Mardi" },
  { short: "Mer", full: "Mercredi" },
  { short: "Jeu", full: "Jeudi" },
  { short: "Ven", full: "Vendredi" },
  { short: "Sam", full: "Samedi" },
  { short: "Dim", full: "Dimanche" },
];

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
];

const initialServices: Service[] = [
  {
    id: 1,
    name: "1-on-1 Personal Training",
    duration: 60,
    price: 50,
    isFree: false,
    packSize: 1,
    imageUrl: "",
    description: "Individual training session tailored to your goals",
    availableSlots: new Set(),
    requiresValidation: false,
  },
  {
    id: 2,
    name: "Nutrition Coaching",
    duration: 45,
    price: 40,
    isFree: false,
    packSize: 1,
    imageUrl: "",
    description: "Personalized nutrition plan and guidance",
    availableSlots: new Set(),
    requiresValidation: false,
  },
  {
    id: 3,
    name: "5-Session Training Pack",
    duration: 60,
    price: 200,
    isFree: false,
    packSize: 5,
    imageUrl: "",
    description: "Pack of 5 training sessions at a discounted rate",
    availableSlots: new Set(),
    requiresValidation: true,
  },
  {
    id: 4,
    name: "Free Consultation",
    duration: 30,
    price: 0,
    isFree: true,
    packSize: 1,
    imageUrl: "",
    description: "Complimentary initial consultation",
    availableSlots: new Set(),
    requiresValidation: false,
  },
];

export default function ServicesManagement() {
  const intl = useIntl();
  const [services, setServices] = useState<Service[]>(initialServices);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Service>>({
    name: "",
    duration: 60,
    price: 0,
    isFree: false,
    packSize: 1,
    imageUrl: "",
    description: "",
    availableSlots: new Set(),
    requiresValidation: false,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: string; time: string } | null>(null);

  const handleAdd = () => {
    if (formData.name && formData.duration) {
      const newService: Service = {
        id: Date.now(),
        name: formData.name,
        duration: formData.duration,
        price: formData.isFree ? 0 : formData.price || 0,
        isFree: formData.isFree || false,
        packSize: formData.packSize || 1,
        imageUrl: formData.imageUrl || "",
        description: formData.description || "",
        availableSlots: new Set(formData.availableSlots || new Set()),
        requiresValidation: formData.requiresValidation || false,
      };
      setServices([...services, newService]);
      resetForm();
    }
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setFormData({
      ...service,
      availableSlots: new Set(service.availableSlots),
    });
  };

  const handleUpdate = () => {
    if (editingId && formData.name && formData.duration) {
      setServices(
        services.map((s) =>
          s.id === editingId
            ? {
                ...s,
                name: formData.name!,
                duration: formData.duration!,
                price: formData.isFree ? 0 : formData.price || 0,
                isFree: formData.isFree || false,
                packSize: formData.packSize || 1,
                imageUrl: formData.imageUrl || "",
                description: formData.description || "",
                availableSlots: new Set(formData.availableSlots || new Set()),
                requiresValidation: formData.requiresValidation || false,
              }
            : s
        )
      );
      resetForm();
    }
  };

  const handleDelete = (id: number) => {
    setServices(services.filter((s) => s.id !== id));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      duration: 60,
      price: 0,
      isFree: false,
      packSize: 1,
      imageUrl: "",
      description: "",
      availableSlots: new Set(),
      requiresValidation: false,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSlotMouseDown = (day: string, time: string) => {
    setIsDragging(true);
    setDragStart({ day, time });
    toggleSlot(day, time);
  };

  const handleSlotMouseEnter = (day: string, time: string) => {
    if (isDragging && dragStart) {
      toggleSlot(day, time);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const toggleSlot = (day: string, time: string) => {
    const slotKey = `${day}-${time}`;
    const newSlots = new Set(formData.availableSlots || new Set());

    if (newSlots.has(slotKey)) {
      newSlots.delete(slotKey);
    } else {
      newSlots.add(slotKey);
    }

    setFormData({ ...formData, availableSlots: newSlots });
  };

  const isSlotSelected = (day: string, time: string) => {
    return formData.availableSlots?.has(`${day}-${time}`) || false;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{intl.formatMessage({ id: "services.title" })}</h1>
          <p className="text-slate-600">{intl.formatMessage({ id: "services.subtitle" })}</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {intl.formatMessage({ id: "services.new.service" })}
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            {isAdding ? intl.formatMessage({ id: "services.form.title.create" }) : intl.formatMessage({ id: "services.form.title.edit" })}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-slate-700 mb-2">{intl.formatMessage({ id: "services.name" })}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 1-on-1 Personal Training"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-700 mb-2">{intl.formatMessage({ id: "services.description" })}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the service..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-2">{intl.formatMessage({ id: "services.duration" })} ({intl.formatMessage({ id: "services.minutes" })})</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                placeholder="60"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-2">Pack Size (sessions)</label>
              <input
                type="number"
                value={formData.packSize}
                onChange={(e) => setFormData({ ...formData, packSize: parseInt(e.target.value) })}
                placeholder="1"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={formData.isFree}
                  onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-slate-700">Free Service</span>
              </label>
            </div>

            <div>
              <label className="flex items-center gap-2 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiresValidation}
                  onChange={(e) => setFormData({ ...formData, requiresValidation: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600"
                />
                <div>
                  <div className="font-medium text-slate-900">{intl.formatMessage({ id: "services.requires.validation" })}</div>
                  <div className="text-sm text-slate-600">{intl.formatMessage({ id: "services.requires.validation.desc" })}</div>
                </div>
              </label>
            </div>

            {!formData.isFree && (
              <div>
                <label className="block text-slate-700 mb-2">{intl.formatMessage({ id: "services.price" })} (€)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  placeholder="50"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-slate-700 mb-2">Image URL</label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Availability Calendar */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-slate-700" />
              <h3 className="text-lg font-bold text-slate-900">{intl.formatMessage({ id: "services.availability" })}</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              {intl.formatMessage({ id: "services.availability.instructions" })}
            </p>

            <div
              className="bg-slate-50 rounded-xl p-4 overflow-x-auto"
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div style={{ minWidth: "800px" }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: `80px repeat(7, 1fr)`,
                  gap: "2px",
                  backgroundColor: "#e2e8f0",
                  borderRadius: "8px",
                  overflow: "hidden"
                }}>
                  {/* Header */}
                  <div className="bg-slate-100"></div>
                  {daysOfWeek.map((day) => (
                    <div key={day.short} className="bg-slate-100 p-2 text-center">
                      <div className="text-sm font-medium text-slate-900">{day.short}</div>
                    </div>
                  ))}

                  {/* Time Slots */}
                  {timeSlots.map((time) => (
                    <Fragment key={time}>
                      <div className="bg-white p-2 flex items-center justify-end pr-2">
                        <span className="text-xs text-slate-600">{time}</span>
                      </div>
                      {daysOfWeek.map((day) => {
                        const isSelected = isSlotSelected(day.short, time);

                        return (
                          <div
                            key={`${day.short}-${time}`}
                            onMouseDown={() => handleSlotMouseDown(day.short, time)}
                            onMouseEnter={() => handleSlotMouseEnter(day.short, time)}
                            className={`p-2 cursor-pointer transition-all select-none ${
                              isSelected
                                ? "bg-blue-600"
                                : "bg-white hover:bg-blue-100"
                            }`}
                            style={{ userSelect: "none" }}
                          />
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span className="text-slate-600">{intl.formatMessage({ id: "services.availability" })}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-slate-300 rounded"></div>
                <span className="text-slate-600">{intl.formatMessage({ id: "calendar.hours.closed" })}</span>
              </div>
              <div className="ml-auto text-slate-600">
                {formData.availableSlots?.size || 0} {intl.formatMessage({ id: "public.time.selected" }, { count: formData.availableSlots?.size || 0 })}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={isAdding ? handleAdd : handleUpdate}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              {isAdding ? intl.formatMessage({ id: "services.save" }) : intl.formatMessage({ id: "common.save" })}
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
            >
              {intl.formatMessage({ id: "common.cancel" })}
            </button>
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="bg-white rounded-2xl border border-slate-200 p-6">
            {service.imageUrl && (
              <div className="mb-4 aspect-video bg-slate-100 rounded-xl overflow-hidden">
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {!service.imageUrl && (
              <div className="mb-4 aspect-video bg-slate-100 rounded-xl flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-slate-400" />
              </div>
            )}

            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900">{service.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {service.description && (
              <p className="text-sm text-slate-600 mb-4">{service.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-4">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{service.duration} min</span>
              </div>
              {service.packSize > 1 && (
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span>{service.packSize} sessions</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              {service.isFree ? (
                <div className="text-lg font-bold text-green-600">Free</div>
              ) : (
                <div className="flex items-center gap-1">
                  <Euro className="w-5 h-5 text-slate-600" />
                  <span className="text-2xl font-bold text-blue-600">{service.price}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
