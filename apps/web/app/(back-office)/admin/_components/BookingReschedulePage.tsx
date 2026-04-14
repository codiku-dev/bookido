"use client";

import { Fragment, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

type BookingStatus = "confirmed" | "pending" | "cancelled";
type Booking = {
  id: number;
  day: string;
  date: string;
  time: string;
  client: string;
  service: string;
  status: BookingStatus;
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayNamesShort: Record<string, string> = {
  Monday: "Lun",
  Tuesday: "Mar",
  Wednesday: "Mer",
  Thursday: "Jeu",
  Friday: "Ven",
  Saturday: "Sam",
  Sunday: "Dim",
};

const monthNames = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];

const allTimeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
];

const initialClosedSlots = new Set([
  "Lun-12:00",
  "Lun-12:30",
  "Mar-12:00",
  "Mar-12:30",
  "Mer-12:00",
  "Mer-12:30",
  "Jeu-12:00",
  "Jeu-12:30",
  "Ven-12:00",
  "Ven-12:30",
]);

const initialBookings: Booking[] = [
  { id: 1, day: "Lun", date: "14 avr", time: "09:00", client: "Marie Dupont", service: "1-on-1 Personal Training", status: "confirmed" },
  { id: 2, day: "Lun", date: "14 avr", time: "14:00", client: "Pierre Martin", service: "Nutrition Coaching", status: "confirmed" },
  { id: 3, day: "Mar", date: "15 avr", time: "10:00", client: "Sophie Bernard", service: "1-on-1 Personal Training", status: "pending" },
  { id: 4, day: "Mer", date: "16 avr", time: "15:00", client: "Lucas Petit", service: "Monthly Training Plan", status: "confirmed" },
];

function getWeekDates(date: Date) {
  const currentDay = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
}

function formatDate(date: Date) {
  const day = date.getDate();
  const monthShort = monthNames[date.getMonth()]?.substring(0, 3).toLowerCase() ?? "";
  return `${day} ${monthShort}`;
}

export default function BookingReschedulePage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const bookingId = Number(params.id);

  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 14));
  const [selectedMonth, setSelectedMonth] = useState(3);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [pendingSlot, setPendingSlot] = useState<{ day: string; date: string; time: string } | null>(null);

  const currentBooking = bookings.find((booking) => booking.id === bookingId) ?? bookings[0] ?? null;

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const enabledDays = weekDates.map((date) => {
    const dayName = dayNames[date.getDay()] ?? "Monday";
    return {
      short: dayNamesShort[dayName] ?? "Lun",
      date: formatDate(date),
    };
  });

  const firstDay = weekDates[0];
  const lastDay = weekDates[6];
  const currentWeekDisplay = firstDay && lastDay ? `${firstDay.getDate()} - ${lastDay.getDate()} ${monthNames[lastDay.getMonth()]} ${lastDay.getFullYear()}` : "";

  const getBooking = (day: string, time: string) => {
    return bookings.find((booking) => booking.day === day && booking.time === time && booking.id !== bookingId);
  };

  const isSlotClosed = (day: string, time: string) => {
    return initialClosedSlots.has(`${day}-${time}`);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentDate(newDate);
    setSelectedMonth(newDate.getMonth());
    setSelectedYear(newDate.getFullYear());
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    setCurrentDate(new Date(selectedYear, month, 1));
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setCurrentDate(new Date(year, selectedMonth, 1));
  };

  const handleSlotClick = (day: string, date: string, time: string) => {
    const occupiedByAnotherBooking = !!getBooking(day, time);
    const isClosed = isSlotClosed(day, time);
    if (occupiedByAnotherBooking || isClosed) {
      return;
    }
    setPendingSlot({ day, date, time });
  };

  const handleConfirmReschedule = () => {
    if (!currentBooking || !pendingSlot) {
      return;
    }
    setBookings((previous) =>
      previous.map((booking) =>
        booking.id === currentBooking.id
          ? { ...booking, day: pendingSlot.day, date: pendingSlot.date, time: pendingSlot.time }
          : booking,
      ),
    );
    setPendingSlot(null);
    router.push(`/admin/bookings/${bookingId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-5 h-5" />
          {t("common.back")}
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("booking.reschedule.page.title")}</h1>
          <p className="text-slate-600">{t("booking.reschedule.page.subtitle")}</p>
          {currentBooking && (
            <div className="mt-4 text-sm text-slate-700">
              {t("booking.reschedule.page.currentSlot", {
                client: currentBooking.client,
                service: currentBooking.service,
                day: currentBooking.day,
                date: currentBooking.date,
                time: currentBooking.time,
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-slate-200">
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => navigateWeek("prev")} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="font-medium text-slate-900 min-w-[200px] text-center">{currentWeekDisplay}</div>
                  <button onClick={() => navigateWeek("next")} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <select
                  value={selectedMonth}
                  onChange={(event) => handleMonthChange(Number(event.target.value))}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium"
                >
                  {monthNames.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(event) => handleYearChange(Number(event.target.value))}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium"
                >
                  {Array.from({ length: 10 }, (_, index) => 2020 + index).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <button onClick={goToToday} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm">
                {t("calendar.nav.today")}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div style={{ minWidth: `${enabledDays.length * 120 + 80}px` }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `80px repeat(${enabledDays.length}, 1fr)`,
                  gap: "1px",
                  backgroundColor: "#e2e8f0",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                <div className="bg-slate-50"></div>
                {enabledDays.map((day) => (
                  <div key={`${day.short}-${day.date}`} className="bg-slate-50 p-3 text-center">
                    <div className="font-medium text-slate-900 text-sm md:text-base">{day.short}</div>
                    <div className="text-xs md:text-sm text-slate-500">{day.date}</div>
                  </div>
                ))}

                {allTimeSlots.map((time) => (
                  <Fragment key={time}>
                    <div className="bg-white p-2 md:p-4 flex items-center justify-end pr-2 md:pr-3">
                      <span className="text-xs md:text-sm text-slate-600">{time}</span>
                    </div>
                    {enabledDays.map((day) => {
                      const booking = getBooking(day.short, time);
                      const isClosed = isSlotClosed(day.short, time);
                      const isSelected = pendingSlot?.day === day.short && pendingSlot?.time === time;

                      return (
                        <button
                          key={`${day.short}-${time}`}
                          onClick={() => handleSlotClick(day.short, day.date, time)}
                          className={`group p-2 md:p-4 transition-all text-left relative ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : isClosed
                                ? "bg-slate-100 cursor-not-allowed"
                                : booking
                                  ? booking.status === "confirmed"
                                    ? "bg-blue-50 border-l-4 border-blue-600 cursor-not-allowed"
                                    : booking.status === "pending"
                                      ? "bg-yellow-50 border-l-4 border-yellow-600 cursor-not-allowed"
                                      : "bg-red-50 border-l-4 border-red-600 cursor-not-allowed"
                                  : "bg-white hover:bg-slate-50 cursor-pointer"
                          }`}
                          disabled={isClosed || !!booking}
                        >
                          {isClosed && (
                            <div
                              className="absolute inset-0"
                              style={{
                                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, #cbd5e1 10px, #cbd5e1 11px)`,
                                backgroundColor: "#f1f5f9",
                              }}
                            />
                          )}
                          {booking && !isClosed && (
                            <div className="text-xs relative z-10">
                              <div className="font-medium text-slate-900 truncate">{booking.client}</div>
                              <div className="text-slate-600 truncate">{booking.service}</div>
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

          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="text-sm text-slate-600">
              {pendingSlot
                ? t("booking.reschedule.page.selectedSlot", {
                    day: pendingSlot.day,
                    date: pendingSlot.date,
                    time: pendingSlot.time,
                  })
                : t("booking.reschedule.page.selectPrompt")}
            </div>
          </div>
        </div>
      </div>

      {pendingSlot && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t("booking.reschedule.modal.title")}</h3>
              <p className="text-slate-600">
                {t("booking.reschedule.page.confirmPrompt", {
                  day: pendingSlot.day,
                  date: pendingSlot.date,
                  time: pendingSlot.time,
                })}
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setPendingSlot(null)}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleConfirmReschedule}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                {t("booking.reschedule.modal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
