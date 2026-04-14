import { useState, Fragment, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Check, Calendar, Clock, Mail, Phone, User, ChevronLeft } from "lucide-react";
import BookidoLogo from "#/components/BookidoLogo";

const timeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

const days = [
  { key: "mon", dateIso: "2026-04-14" },
  { key: "tue", dateIso: "2026-04-15" },
  { key: "wed", dateIso: "2026-04-16" },
  { key: "thu", dateIso: "2026-04-17" },
  { key: "fri", dateIso: "2026-04-18" },
];

// Simulate some blocked slots
const blockedSlots = new Set(["mon-10:00", "tue-09:00", "wed-14:00", "thu-11:00"]);

type BookingStep = "intro" | "service" | "time" | "confirmation";

type TimeSlot = {
  dayKey: string;
  dateIso: string;
  time: string;
};

export default function PublicCoachPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dateFormatter = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  const priceFormatter = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });
  const [currentStep, setCurrentStep] = useState<BookingStep>("intro");
  const services = [
    {
      id: 1,
      name: t("public.services.items.personalTraining.name"),
      duration: t("public.services.items.personalTraining.duration"),
      price: 50,
    },
    {
      id: 2,
      name: t("public.services.items.nutritionCoaching.name"),
      duration: t("public.services.items.nutritionCoaching.duration"),
      price: 40,
    },
    {
      id: 3,
      name: t("public.services.items.trainingPack.name"),
      duration: t("public.services.items.trainingPack.duration"),
      price: 200,
    },
    {
      id: 4,
      name: t("public.services.items.monthlyPlan.name"),
      duration: t("public.services.items.monthlyPlan.duration"),
      price: 180,
    },
  ];
  const [selectedService, setSelectedService] = useState<(typeof services)[0] | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState<(typeof days)[number]["key"] | null>(null);

  const getDayShortLabel = (dayKey: string) => t(`public.time.days.${dayKey}.short`);
  const getDayDateLabel = (dateIso: string) => dateFormatter.format(new Date(dateIso));
  const getPriceLabel = (price: number) => priceFormatter.format(price);
  const firstService = services[0];

  const setStepInUrl = (step: BookingStep) => {
    const params = new URLSearchParams(searchParams.toString());
    const stepParam = step === "time" ? "booking" : step;
    params.set("step", stepParam);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleServiceSelect = (service: (typeof services)[0]) => {
    setSelectedService(service);
    setCurrentStep("time");
    setStepInUrl("time");
  };

  useEffect(() => {
    if (currentStep === "time") {
      setTimeout(() => {
        document.getElementById("calendar-section")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [currentStep]);

  const handleTimeSelect = (dayKey: string, dateIso: string, time: string) => {
    const existingSlotIndex = selectedSlots.findIndex((slot) => slot.dayKey === dayKey && slot.time === time);

    if (existingSlotIndex >= 0) {
      // Deselect
      setSelectedSlots(selectedSlots.filter((_, index) => index !== existingSlotIndex));
    } else {
      // Select
      setSelectedSlots([...selectedSlots, { dayKey, dateIso, time }]);
    }
  };

  const isSlotSelected = (dayKey: string, time: string) => {
    return selectedSlots.some((slot) => slot.dayKey === dayKey && slot.time === time);
  };

  const isSlotBlocked = (dayKey: string, time: string) => {
    return blockedSlots.has(`${dayKey}-${time}`);
  };

  const handleConfirmBooking = () => {
    setCurrentStep("confirmation");
    setStepInUrl("confirmation");
  };

  const removeSlot = (index: number) => {
    setSelectedSlots(selectedSlots.filter((_, i) => i !== index));
  };

  const totalPrice = selectedService ? selectedService.price * selectedSlots.length : 0;

  useEffect(() => {
    const stepParam = searchParams.get("step");
    if (!stepParam) {
      return;
    }
    if (stepParam === "booking") {
      setCurrentStep("time");
      if (!selectedService && firstService) {
        setSelectedService(firstService);
      }
      return;
    }
    if (stepParam === "confirmation") {
      setCurrentStep("confirmation");
      if (!selectedService && firstService) {
        setSelectedService(firstService);
      }
      return;
    }
    if (stepParam === "service") {
      setCurrentStep("service");
      return;
    }
    if (stepParam === "intro") {
      setCurrentStep("intro");
    }
  }, [firstService, searchParams, selectedService]);

  return (
    <div className="min-h-screen bg-white">
      <div className="absolute top-6 left-6 z-30 flex items-center gap-3">
        <div className="size-12 rounded-lg bg-blue-600 flex items-center justify-center">
          <BookidoLogo className="size-10 brightness-0 invert" />
        </div>
        <div>
          <div className="text-lg font-bold text-slate-900">Bookido</div>
          <div className="text-sm text-slate-600">{t("public.brand.subtitle")}</div>
        </div>
      </div>

      {/* Hero */}
      {currentStep === "intro" && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative bg-linear-to-br from-slate-50 to-blue-50 overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-6 py-20 md:py-32">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full mb-6 mt-12 mt-0">
                  {t("public.hero.badge")}
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">Sarah Johnson</h1>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">{t("public.hero.description")}</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setCurrentStep("service");
                    setStepInUrl("service");
                  }}
                  className="w-full md:w-44! md:self-start px-8 py-4 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors"
                >
                  {t("public.hero.cta")}
                </motion.button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="relative"
              >
                <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1540206063137-4a88ca974d1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwY29hY2glMjBwZXJzb25hbCUyMHRyYWluZXJ8ZW58MXx8fHwxNzc2MDgxNzY2fDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt={t("public.hero.imageAlt")}
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Services */}
      {currentStep === "service" && (
        <section id="services" className="py-24 px-6 min-h-screen">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => {
                  setCurrentStep("intro");
                  setStepInUrl("intro");
                }}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ChevronLeft className="size-4" /> {t("common.back")}
                </span>
              </button>
            </div>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">{t("public.services.title")}</h2>
              <p className="text-slate-600">{t("public.hero.subtitle")}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service, index) => (
                <motion.button
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
                  onClick={() => handleServiceSelect(service)}
                  className={`text-left p-8 rounded-2xl border-2 transition-all ${
                    selectedService?.id === service.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-900">{service.name}</h3>
                    {selectedService?.id === service.id && (
                      <div className="p-1 bg-blue-600 rounded-full">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{service.duration}</span>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">{getPriceLabel(service.price)}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Calendar & Booking */}
      {(currentStep === "time" || currentStep === "confirmation") && (
        <motion.section
          id="calendar-section"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="min-h-screen py-12 px-6 bg-slate-50"
        >
          <div className="max-w-5xl mx-auto">
            {currentStep === "time" && (
              <div>
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setCurrentStep("service");
                      setStepInUrl("service");
                    }}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {t("common.back")}
                  </button>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">{t("public.time.title")}</h2>

                {/* Mobile View */}
                <div className="lg:hidden">
                  {/* Selected Slots Summary */}
                  {selectedSlots.length > 0 && (
                    <div className="bg-blue-50 rounded-2xl p-6 mb-6 border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-blue-900">
                          {t(selectedSlots.length > 1 ? "public.time.selectedPlural" : "public.time.selected", {
                            count: selectedSlots.length,
                          })}
                        </h3>
                        <span className="text-lg font-bold text-blue-600">{getPriceLabel(totalPrice)}</span>
                      </div>
                      <div className="space-y-2">
                        {selectedSlots.map((slot, index) => (
                          <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3">
                            <div>
                              <div className="font-medium text-slate-900">
                                {getDayShortLabel(slot.dayKey)} {getDayDateLabel(slot.dateIso)}
                              </div>
                              <div className="text-sm text-slate-600">{slot.time}</div>
                            </div>
                            <button
                              onClick={() => removeSlot(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h3 className="font-bold text-slate-900 mb-4">{t("public.mobile.select.day")}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {days.map((day) => {
                        const slotsInDay = selectedSlots.filter((s) => s.dayKey === day.key).length;
                        const dayShortLabel = getDayShortLabel(day.key);
                        const dayDateLabel = getDayDateLabel(day.dateIso);
                        return (
                          <button
                            key={day.key}
                            onClick={() => setSelectedDay(day.key)}
                            className={`p-4 rounded-xl border-2 transition-all relative ${
                              selectedDay === day.key
                                ? "border-blue-600 bg-blue-50"
                                : "border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            <div className="font-bold text-slate-900">{dayShortLabel}</div>
                            <div className="text-sm text-slate-600">{dayDateLabel}</div>
                            {slotsInDay > 0 && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {slotsInDay}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedDay && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl shadow-lg p-6"
                    >
                      <h3 className="font-bold text-slate-900 mb-4">
                        {t("public.mobile.select.time")} - {selectedDay ? getDayShortLabel(selectedDay) : ""}{" "}
                        {selectedDay ? getDayDateLabel(days.find((d) => d.key === selectedDay)?.dateIso ?? "") : ""}
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {timeSlots.map((time) => {
                          const isBlocked = isSlotBlocked(selectedDay, time);
                          const isSelected = isSlotSelected(selectedDay, time);

                          return (
                            <button
                              key={time}
                              onClick={() =>
                                !isBlocked &&
                                handleTimeSelect(
                                  selectedDay,
                                  days.find((d) => d.key === selectedDay)?.dateIso || "",
                                  time,
                                )
                              }
                              disabled={isBlocked}
                              className={`px-4 py-4 rounded-xl transition-all ${
                                isBlocked
                                  ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                                  : isSelected
                                    ? "bg-blue-600 text-white font-medium"
                                    : "bg-slate-50 border-2 border-slate-200 hover:border-blue-300"
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Desktop View */}
                <div className="hidden lg:grid lg:grid-cols-[1fr_280px] gap-6">
                  {/* Calendar Grid */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto">
                    <div className="min-w-[700px]">
                      <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-slate-50"></div>
                        {days.map((day) => (
                          <div key={day.key} className="bg-slate-50 p-4 text-center">
                            <div className="font-medium text-slate-900">{getDayShortLabel(day.key)}</div>
                            <div className="text-sm text-slate-500">{getDayDateLabel(day.dateIso)}</div>
                          </div>
                        ))}

                        {/* Time Slots */}
                        {timeSlots.map((time) => (
                          <Fragment key={time}>
                            <div className="bg-white p-4 flex items-center justify-end pr-3">
                              <span className="text-sm text-slate-600">{time}</span>
                            </div>
                            {days.map((day) => {
                              const isBlocked = isSlotBlocked(day.key, time);
                              const isSelected = isSlotSelected(day.key, time);

                              return (
                                <button
                                  key={`${day.key}-${time}`}
                                  onClick={() => !isBlocked && handleTimeSelect(day.key, day.dateIso, time)}
                                  disabled={isBlocked}
                                  className={`p-4 transition-all ${
                                    isBlocked
                                      ? "bg-white cursor-not-allowed opacity-30"
                                      : isSelected
                                        ? "bg-blue-600 text-white font-medium shadow-sm"
                                        : "bg-white hover:bg-blue-50 cursor-pointer"
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="flex items-center justify-center">
                                      <Check className="w-5 h-5" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </Fragment>
                        ))}
                      </div>

                      <div className="mt-6 flex items-center gap-6 justify-center text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-white border-2 border-slate-200 rounded"></div>
                          <span className="text-slate-600">{t("public.time.available")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-slate-200 rounded opacity-50"></div>
                          <span className="text-slate-600">{t("public.time.unavailable")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-600 rounded"></div>
                          <span className="text-slate-600">{t("public.time.selectedLabel")}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Slots Summary */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="font-bold text-slate-900 mb-4">{t("public.payment.slots")}</h3>

                    {selectedSlots.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-8">{t("public.time.subtitle")}</p>
                    ) : (
                      <>
                        <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
                          {selectedSlots.map((slot, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-slate-900 text-sm">
                                  {getDayShortLabel(slot.dayKey)}
                                </div>
                                <div className="text-xs text-slate-600">
                                  {getDayDateLabel(slot.dateIso)} · {slot.time}
                                </div>
                              </div>
                              <button
                                onClick={() => removeSlot(index)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="pt-4 border-t border-slate-200">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-600">
                              {t("public.payment.total")} (
                              {t(selectedSlots.length > 1 ? "public.time.selectedPlural" : "public.time.selected", {
                                count: selectedSlots.length,
                              })}
                              )
                            </span>
                            <span className="text-xl font-bold text-blue-600">{getPriceLabel(totalPrice)}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {selectedSlots.length > 0 && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={handleConfirmBooking}
                      className="px-8 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg"
                    >
                      {t("common.confirm")}
                    </button>
                  </div>
                )}
              </div>
            )}

            {currentStep === "confirmation" && selectedService && (
              <div>
                <div className="max-w-2xl mx-auto text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <Check className="w-10 h-10 text-green-600" />
                  </motion.div>

                  <h2 className="text-3xl font-bold text-slate-900 mb-4">{t("public.confirmation.title")}</h2>
                  <p className="text-lg text-slate-600 mb-8">
                    {t("public.confirmation.successMessage", { service: selectedService.name })}
                  </p>
                  <p className="text-md text-slate-600 mb-8">{t("public.confirmation.successDetails")}</p>

                  <button
                    onClick={() => {
                      setCurrentStep("service");
                      setSelectedService(null);
                      setSelectedSlots([]);
                      setSelectedDay(null);
                      setStepInUrl("service");
                    }}
                    className="px-8 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    {t("public.confirmation.new")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* Footer */}
      {(currentStep === "intro" || currentStep === "service") && (
        <footer className="py-12 px-6 bg-slate-900 text-slate-300">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center gap-4 mb-6">
              <BookidoLogo className="w-12 h-12 brightness-0 invert opacity-80" />
              <div className="text-xl font-bold text-white">Bookido</div>
            </div>
            <p className="text-sm text-center">{t("public.footer.copyright")}</p>
          </div>
        </footer>
      )}
    </div>
  );
}
