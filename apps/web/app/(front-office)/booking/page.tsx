"use client";

import { Fragment, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import Link from "next/link";
import { BackButton } from "../_components/BackButton";
import { FrontOfficePageLayout } from "../_components/FrontOfficePageLayout";

type TimeSlot = {
  dayKey: string;
  dateIso: string;
  time: string;
};

const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
const days = [
  { key: "mon", dateIso: "2026-04-14" },
  { key: "tue", dateIso: "2026-04-15" },
  { key: "wed", dateIso: "2026-04-16" },
  { key: "thu", dateIso: "2026-04-17" },
  { key: "fri", dateIso: "2026-04-18" },
];
const blockedSlots = new Set(["mon-10:00", "tue-09:00", "wed-14:00", "thu-11:00"]);

export default function BookingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const dateFormatter = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  const priceFormatter = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });

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

  const defaultService = services[0];
  if (!defaultService) {
    return null;
  }
  const serviceIdParam = Number(searchParams.get("service"));
  const selectedService = services.find((service) => service.id === serviceIdParam) ?? defaultService;
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState<(typeof days)[number]["key"] | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const totalPrice = selectedService.price * selectedSlots.length;

  const dayLabelMap = useMemo(() => {
    return Object.fromEntries(days.map((day) => [day.key, t(`public.time.days.${day.key}.short`)]));
  }, [t]);

  const getDayShortLabel = (dayKey: string) => dayLabelMap[dayKey] ?? dayKey;
  const getDayDateLabel = (dateIso: string) => dateFormatter.format(new Date(dateIso));

  const handleTimeSelect = (dayKey: string, dateIso: string, time: string) => {
    const existingSlotIndex = selectedSlots.findIndex((slot) => slot.dayKey === dayKey && slot.time === time);
    if (existingSlotIndex >= 0) {
      setSelectedSlots(selectedSlots.filter((_, index) => index !== existingSlotIndex));
      return;
    }
    setSelectedSlots([...selectedSlots, { dayKey, dateIso, time }]);
  };

  const isSlotSelected = (dayKey: string, time: string) => selectedSlots.some((slot) => slot.dayKey === dayKey && slot.time === time);
  const isSlotBlocked = (dayKey: string, time: string) => blockedSlots.has(`${dayKey}-${time}`);

  const bookingContent = (
    <>
      <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center">{t("public.time.title")}</h2>
      <p className="text-center text-slate-600 mb-8">{selectedService.name}</p>

      <div className="hidden lg:grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50"></div>
              {days.map((day) => (
                <div key={day.key} className="bg-slate-50 p-4 text-center">
                  <div className="font-medium text-slate-900">{getDayShortLabel(day.key)}</div>
                  <div className="text-sm text-slate-500">{getDayDateLabel(day.dateIso)}</div>
                </div>
              ))}
              {timeSlots.map((time) => (
                <Fragment key={time}>
                  <div className="bg-white p-4 flex items-center justify-end pr-3">
                    <span className="text-sm text-slate-600">{time}</span>
                  </div>
                  {days.map((day) => {
                    const blocked = isSlotBlocked(day.key, time);
                    const selected = isSlotSelected(day.key, time);
                    return (
                      <button
                        key={`${day.key}-${time}`}
                        onClick={() => !blocked && handleTimeSelect(day.key, day.dateIso, time)}
                        disabled={blocked}
                        className={`p-4 transition-all ${
                          blocked
                            ? "bg-white cursor-not-allowed opacity-30"
                            : selected
                              ? "bg-blue-600 text-white font-medium shadow-sm"
                              : "bg-white hover:bg-blue-50 cursor-pointer"
                        }`}
                      >
                        {selected && (
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
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-bold text-slate-900 mb-4">{t("public.payment.slots")}</h3>
          {selectedSlots.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">{t("public.time.subtitle")}</p>
          ) : (
            <>
              <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
                {selectedSlots.map((slot, index) => (
                  <div key={`${slot.dayKey}-${slot.time}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 text-sm">{getDayShortLabel(slot.dayKey)}</div>
                      <div className="text-xs text-slate-600">
                        {getDayDateLabel(slot.dateIso)} · {slot.time}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSlots(selectedSlots.filter((_, slotIndex) => slotIndex !== index))}
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
                  <span className="text-xl font-bold text-blue-600">{priceFormatter.format(totalPrice)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfirmed(true)}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  {t("common.confirm")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="lg:hidden">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="font-bold text-slate-900 mb-4">{t("public.mobile.select.day")}</h3>
          <div className="grid grid-cols-2 gap-3">
            {days.map((day) => {
              const slotsInDay = selectedSlots.filter((slot) => slot.dayKey === day.key).length;
              return (
                <button
                  key={day.key}
                  onClick={() => setSelectedDay(day.key)}
                  className={`p-4 rounded-xl border-2 transition-all relative ${
                    selectedDay === day.key ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div className="font-bold text-slate-900">{getDayShortLabel(day.key)}</div>
                  <div className="text-sm text-slate-600">{getDayDateLabel(day.dateIso)}</div>
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
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-slate-900 mb-4">
              {t("public.mobile.select.time")} - {getDayShortLabel(selectedDay)}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {timeSlots.map((time) => {
                const blocked = isSlotBlocked(selectedDay, time);
                const selected = isSlotSelected(selectedDay, time);
                return (
                  <button
                    key={time}
                    onClick={() => !blocked && handleTimeSelect(selectedDay, days.find((day) => day.key === selectedDay)?.dateIso ?? "", time)}
                    disabled={blocked}
                    className={`px-4 py-4 rounded-xl transition-all ${
                      blocked
                        ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                        : selected
                          ? "bg-blue-600 text-white font-medium"
                          : "bg-slate-50 border-2 border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {selectedSlots.length > 0 && (
          <button
            type="button"
            onClick={() => setIsConfirmed(true)}
            className="w-full mt-6 px-8 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg"
          >
            {t("common.confirm")}
          </button>
        )}
      </div>
    </>
  );

  const confirmationContent = (
    <div className="max-w-2xl mx-auto text-center pt-20">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <Check className="w-10 h-10 text-green-600" />
      </motion.div>
      <h2 className="text-3xl font-bold text-slate-900 mb-4">{t("public.confirmation.title")}</h2>
      <p className="text-lg text-slate-600 mb-8">{t("public.confirmation.successMessage", { service: selectedService.name })}</p>
      <p className="text-md text-slate-600 mb-8">{t("public.confirmation.successDetails")}</p>
      <Link href="/services" className="inline-flex px-8 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
        {t("public.confirmation.new")}
      </Link>
    </div>
  );

  return (
    <FrontOfficePageLayout
      rootClassName="min-h-screen py-12 px-6 bg-slate-50"
      topAction={!isConfirmed ? <BackButton label={t("common.back")} fallbackHref="/services" /> : null}
    >
      {isConfirmed ? confirmationContent : bookingContent}
    </FrontOfficePageLayout>
  );
}
