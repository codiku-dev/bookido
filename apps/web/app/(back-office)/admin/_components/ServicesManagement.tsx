// @ts-nocheck
import { useState, Fragment } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Clock, Euro, Package, Image as ImageIcon, Calendar } from "lucide-react";
import { Button } from "#/components/ui/button";

type Service = {
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
};

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
];

export default function ServicesManagement() {
  const t = useTranslations();
  const getNumberInputValue = (value: number | undefined) =>
    typeof value === "number" && Number.isFinite(value) ? value : "";
  const daysOfWeek = [
    { key: "mon", short: t("public.time.days.mon.short") },
    { key: "tue", short: t("public.time.days.tue.short") },
    { key: "wed", short: t("public.time.days.wed.short") },
    { key: "thu", short: t("public.time.days.thu.short") },
    { key: "fri", short: t("public.time.days.fri.short") },
    { key: "sat", short: t("public.time.days.sat.short") },
    { key: "sun", short: t("public.time.days.sun.short") },
  ];

  const initialServices: Service[] = [
    {
      id: 1,
      name: t("services.mock.personalTraining.name"),
      duration: 60,
      price: 50,
      isFree: false,
      packSize: 1,
      imageUrl: "",
      description: t("services.mock.personalTraining.description"),
      availableSlots: new Set(),
      requiresValidation: false,
    },
    {
      id: 2,
      name: t("services.mock.nutritionCoaching.name"),
      duration: 45,
      price: 40,
      isFree: false,
      packSize: 1,
      imageUrl: "",
      description: t("services.mock.nutritionCoaching.description"),
      availableSlots: new Set(),
      requiresValidation: false,
    },
    {
      id: 3,
      name: t("services.mock.trainingPack.name"),
      duration: 60,
      price: 200,
      isFree: false,
      packSize: 5,
      imageUrl: "",
      description: t("services.mock.trainingPack.description"),
      availableSlots: new Set(),
      requiresValidation: true,
    },
    {
      id: 4,
      name: t("services.mock.freeConsultation.name"),
      duration: 30,
      price: 0,
      isFree: true,
      packSize: 1,
      imageUrl: "",
      description: t("services.mock.freeConsultation.description"),
      availableSlots: new Set(),
      requiresValidation: false,
    },
  ];

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
  const [dragMode, setDragMode] = useState<"close" | "open" | null>(null);
  const [draggedSlotKeys, setDraggedSlotKeys] = useState<Set<string>>(new Set());

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

  const getSlotKey = (dayKey: string, time: string) => `${dayKey}-${time}`;

  const setSlotClosed = (dayKey: string, time: string, shouldBeClosed: boolean) => {
    const slotKey = getSlotKey(dayKey, time);
    setFormData((previous) => {
      const nextSlots = new Set(previous.availableSlots || new Set());
      if (shouldBeClosed) {
        nextSlots.add(slotKey);
      } else {
        nextSlots.delete(slotKey);
      }
      return { ...previous, availableSlots: nextSlots };
    });
  };

  const handleSlotMouseDown = (dayKey: string, time: string) => {
    const slotKey = getSlotKey(dayKey, time);
    const currentlyClosed = formData.availableSlots?.has(slotKey) || false;
    const nextMode: "close" | "open" = currentlyClosed ? "open" : "close";
    setIsDragging(true);
    setDragMode(nextMode);
    setDraggedSlotKeys(new Set([slotKey]));
    setSlotClosed(dayKey, time, nextMode === "close");
  };

  const handleSlotMouseEnter = (dayKey: string, time: string) => {
    if (isDragging && dragMode) {
      const slotKey = getSlotKey(dayKey, time);
      if (draggedSlotKeys.has(slotKey)) return;
      setDraggedSlotKeys((previous) => {
        const next = new Set(previous);
        next.add(slotKey);
        return next;
      });
      setSlotClosed(dayKey, time, dragMode === "close");
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragMode(null);
    setDraggedSlotKeys(new Set());
  };

  const isSlotClosed = (dayKey: string, time: string) => {
    return formData.availableSlots?.has(getSlotKey(dayKey, time)) || false;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("services.title")}</h1>
          <p className="text-slate-600">{t("services.subtitle")}</p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          className="h-11 px-6 rounded-xl"
        >
          <Plus className="w-5 h-5" />
          {t("services.new.service")}
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            {isAdding ? t("services.form.title.create") : t("services.form.title.edit")}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-slate-700 mb-2">{t("services.name")}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("services.form.placeholders.name")}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-700 mb-2">{t("services.description")}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("services.form.placeholders.description")}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-2">{t("services.duration")} ({t("services.minutes")})</label>
              <input
                type="number"
                value={getNumberInputValue(formData.duration)}
                onChange={(e) => {
                  const nextDuration = Number.parseInt(e.target.value, 10);
                  setFormData({ ...formData, duration: Number.isNaN(nextDuration) ? undefined : nextDuration });
                }}
                placeholder="60"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-2">{t("services.packSize")}</label>
              <input
                type="number"
                value={getNumberInputValue(formData.packSize)}
                onChange={(e) => {
                  const nextPackSize = Number.parseInt(e.target.value, 10);
                  setFormData({ ...formData, packSize: Number.isNaN(nextPackSize) ? undefined : nextPackSize });
                }}
                placeholder="1"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
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
                  <div className="font-medium text-slate-900">{t("services.requires.validationTitle")}</div>
                  <div className="text-sm text-slate-600">{t("services.requires.validation.desc")}</div>
                </div>
              </label>
            </div>

            <div className="flex flex-col gap-4">
              <div className="min-w-0">
                <label className="block text-slate-700 mb-2">{t("services.price")} (€)</label>
                <input
                  type="number"
                  value={getNumberInputValue(formData.price)}
                  onChange={(e) => {
                    const nextPrice = Number.parseFloat(e.target.value);
                    setFormData({ ...formData, price: Number.isNaN(nextPrice) ? undefined : nextPrice });
                  }}
                  placeholder="50"
                  disabled={formData.isFree}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.isFree}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isFree: e.target.checked,
                      price: e.target.checked ? 0 : formData.price,
                    })
                  }
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-slate-700 whitespace-nowrap">{t("services.freeService")}</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-700 mb-2">{t("services.imageUrl")}</label>
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
              <h3 className="text-lg font-bold text-slate-900">{t("services.availabilityTitle")}</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              {t("services.availability.instructions")}
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
                    <div key={day.key} className="bg-slate-100 p-2 text-center">
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
                        const isClosed = isSlotClosed(day.key, time);

                        return (
                          <div
                            key={`${day.key}-${time}`}
                            onMouseDown={() => handleSlotMouseDown(day.key, time)}
                            onMouseEnter={() => handleSlotMouseEnter(day.key, time)}
                            className={`p-2 cursor-pointer transition-all select-none relative ${
                              isClosed ? "bg-slate-100 hover:bg-slate-200" : "bg-white hover:bg-slate-50"
                            }`}
                            style={{ userSelect: "none" }}
                          >
                            {isClosed && (
                              <div
                                className="absolute inset-0"
                                style={{
                                  backgroundImage: `repeating-linear-gradient(
                                    45deg,
                                    transparent,
                                    transparent 10px,
                                    #cbd5e1 10px,
                                    #cbd5e1 11px
                                  )`,
                                  backgroundColor: "#f1f5f9",
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-slate-300 rounded"></div>
                <span className="text-slate-600">{t("public.time.available")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 border border-slate-300 rounded"
                  style={{
                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, #cbd5e1 3px, #cbd5e1 4px)",
                    backgroundColor: "#f1f5f9",
                  }}
                />
                <span className="text-slate-600">{t("calendar.hours.closed")}</span>
              </div>
              <div className="ml-auto text-slate-600">
                {t(
                  (formData.availableSlots?.size || 0) > 1 ? "public.time.selectedPlural" : "public.time.selected",
                  { count: formData.availableSlots?.size || 0 },
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={isAdding ? handleAdd : handleUpdate}
              className="h-11 px-6 rounded-xl"
            >
              {isAdding ? t("services.save") : t("common.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="h-11 px-6 rounded-xl"
            >
              {t("common.cancel")}
            </Button>
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
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => handleEdit(service)}
                  className="text-slate-600 hover:bg-slate-100"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => handleDelete(service.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
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
                  <span>{service.packSize} {t("services.sessions")}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              {service.isFree ? (
                <div className="text-lg font-bold text-green-600">{t("services.free")}</div>
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
