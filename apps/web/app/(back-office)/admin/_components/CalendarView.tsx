// @ts-nocheck
import { useState, Fragment } from "react";
import { useTranslations } from "next-intl";
import { X, Mail, Phone, Clock, Euro, ChevronLeft, ChevronRight, Calendar as CalendarIcon, XCircle, MessageCircle } from "lucide-react";
import ClientFormModal, { ClientFormData } from "#/components/ClientFormModal";
import BookingModal from "#/components/BookingModal";
import { Button } from "#/components/ui/button";

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

const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

function getWeekDates(date: Date) {
  const currentDay = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const monday = new Date(date);
  monday.setDate(date.getDate() - currentDay + (currentDay === 0 ? -6 : 1));

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    weekDates.push(day);
  }
  return weekDates;
}

function formatDate(date: Date) {
  const day = date.getDate();
  const monthShort = monthNames[date.getMonth()].substring(0, 3).toLowerCase();
  return `${day} ${monthShort}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const allTimeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
];

// Track closed time slots (when coach is not available)
const initialClosedSlots = new Set([
  "Lun-12:00",
  "Lun-12:30",
  "Lun-13:00",
  "Mar-12:00",
  "Mar-12:30",
  "Mar-13:00",
  "Mer-12:00",
  "Mer-12:30",
  "Mer-13:00",
  "Jeu-12:00",
  "Jeu-12:30",
  "Jeu-13:00",
  "Ven-12:00",
  "Ven-12:30",
  "Ven-13:00",
]);

interface DayHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

type WeekHours = Record<string, DayHours>;

const initialWeekHours: WeekHours = {
  Monday: { enabled: true, startTime: "09:00", endTime: "18:00" },
  Tuesday: { enabled: true, startTime: "09:00", endTime: "18:00" },
  Wednesday: { enabled: true, startTime: "09:00", endTime: "18:00" },
  Thursday: { enabled: true, startTime: "09:00", endTime: "18:00" },
  Friday: { enabled: true, startTime: "09:00", endTime: "17:00" },
  Saturday: { enabled: false, startTime: "09:00", endTime: "13:00" },
  Sunday: { enabled: false, startTime: "09:00", endTime: "13:00" },
};

const services = [
  {
    id: 1,
    slug: "personalTraining" as const,
    price: 50,
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=240&q=80",
  },
  {
    id: 2,
    slug: "nutrition" as const,
    price: 40,
    imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=240&q=80",
  },
  {
    id: 3,
    slug: "pack5" as const,
    price: 200,
    imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=240&q=80",
  },
  {
    id: 4,
    slug: "monthlyPlan" as const,
    price: 180,
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=240&q=80",
  },
];

const existingClients = [
  { id: 1, name: "Marie Dupont", email: "marie@example.com" },
  { id: 2, name: "Pierre Martin", email: "pierre@example.com" },
  { id: 3, name: "Sophie Bernard", email: "sophie@example.com" },
  { id: 4, name: "Lucas Petit", email: "lucas@example.com" },
  { id: 5, name: "Emma Moreau", email: "emma@example.com" },
];

interface Booking {
  day: string;
  date: string;
  time: string;
  durationMinutes: number;
  client: string;
  email: string;
  phone: string;
  service: string;
  price: number;
  status: "confirmed" | "pending" | "cancelled";
}

const bookings: Booking[] = [
  {
    day: "Lun",
    date: "14 avr",
    time: "09:00",
    durationMinutes: 60,
    client: "Marie Dupont",
    email: "marie@example.com",
    phone: "+33 6 12 34 56 78",
    service: "1-on-1 Personal Training",
    price: 50,
    status: "confirmed",
  },
  {
    day: "Lun",
    date: "14 avr",
    time: "14:00",
    durationMinutes: 60,
    client: "Pierre Martin",
    email: "pierre@example.com",
    phone: "+33 6 98 76 54 32",
    service: "Nutrition Coaching",
    price: 40,
    status: "confirmed",
  },
  {
    day: "Mar",
    date: "15 avr",
    time: "10:00",
    durationMinutes: 60,
    client: "Sophie Bernard",
    email: "sophie@example.com",
    phone: "+33 6 11 22 33 44",
    service: "1-on-1 Personal Training",
    price: 50,
    status: "pending",
  },
  {
    day: "Mer",
    date: "16 avr",
    time: "15:00",
    durationMinutes: 60,
    client: "Lucas Petit",
    email: "lucas@example.com",
    phone: "+33 6 55 66 77 88",
    service: "Monthly Training Plan",
    price: 180,
    status: "confirmed",
  },
];

export default function CalendarView() {
  const t = useTranslations();
  const today = new Date();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [closedSlots, setClosedSlots] = useState<Set<string>>(initialClosedSlots);
  const [isAvailabilityMode, setIsAvailabilityMode] = useState(false);
  const [weekHours, setWeekHours] = useState<WeekHours>(initialWeekHours);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; date: string; time: string } | null>(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 14)); // April 14, 2026
  const [selectedMonth, setSelectedMonth] = useState(3); // April (0-indexed)
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedWeekNumber, setSelectedWeekNumber] = useState(1);

  const weekDates = getWeekDates(currentDate);
  const firstDay = weekDates[0];
  const lastDay = weekDates[6];
  const currentWeekDisplay = `${firstDay.getDate()} - ${lastDay.getDate()} ${monthNames[lastDay.getMonth()]} ${lastDay.getFullYear()}`;

  const getBooking = (day: string, time: string): Booking | undefined => {
    return bookings.find((b) => b.day === day && b.time === time);
  };

  const slotMinutes = 30;
  const confirmedBookings = bookings.filter((booking) => booking.status === "confirmed");
  const timeToMinutes = (timeValue: string) => {
    const [hours, minutes] = timeValue.split(":").map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0);
  };

  const bookingBySlot = new Map<string, { booking: Booking; isContinuation: boolean }>();
  confirmedBookings.forEach((booking) => {
    const baseMinutes = timeToMinutes(booking.time);
    const slotCount = Math.max(1, Math.ceil(booking.durationMinutes / slotMinutes));

    for (let index = 0; index < slotCount; index++) {
      const currentMinutes = baseMinutes + index * slotMinutes;
      const hours = Math.floor(currentMinutes / 60)
        .toString()
        .padStart(2, "0");
      const minutes = (currentMinutes % 60).toString().padStart(2, "0");
      const currentTime = `${hours}:${minutes}`;
      bookingBySlot.set(`${booking.day}-${currentTime}`, { booking, isContinuation: index > 0 });
    }
  });

  const isSlotClosed = (day: string, time: string): boolean => {
    return closedSlots.has(`${day}-${time}`);
  };

  const toggleSlotAvailability = (day: string, time: string) => {
    if (!isAvailabilityMode) return;

    const slotKey = `${day}-${time}`;
    const newClosedSlots = new Set(closedSlots);

    if (newClosedSlots.has(slotKey)) {
      newClosedSlots.delete(slotKey);
    } else {
      newClosedSlots.add(slotKey);
    }

    setClosedSlots(newClosedSlots);
  };

  const toggleDayHours = (day: string) => {
    setWeekHours({
      ...weekHours,
      [day]: { ...weekHours[day], enabled: !weekHours[day].enabled },
    });
  };

  const updateDayTime = (day: string, field: "startTime" | "endTime", value: string) => {
    setWeekHours({
      ...weekHours,
      [day]: { ...weekHours[day], [field]: value },
    });
  };

  const handleSlotClick = (day: string, date: string, time: string, booking?: Booking, isClosed?: boolean) => {
    if (isAvailabilityMode) {
      toggleSlotAvailability(day, time);
    } else if (booking) {
      setSelectedBooking(booking);
    } else if (!isClosed) {
      setSelectedSlot({ day, date, time });
      setShowBookingModal(true);
    }
  };

  const handleSaveNewClient = (clientData: ClientFormData) => {
    // In production, save to backend
    console.log("New client:", clientData);
    setShowNewClientModal(false);
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
    const newDate = new Date(selectedYear, month, 1);
    setCurrentDate(newDate);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    const newDate = new Date(year, selectedMonth, 1);
    setCurrentDate(newDate);
  };

  const handleWeekChange = (weekNum: number) => {
    setSelectedWeekNumber(weekNum);
    // Calculate the first day of that week in the selected month
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
    const newDate = new Date(firstDayOfMonth);
    newDate.setDate(1 + (weekNum - 1) * 7);
    setCurrentDate(newDate);
  };

  const weekdayI18nKey = (dayName: string) => `calendar.weekday.${dayName.toLowerCase()}`;

  // Get enabled days from weekHours and map to actual dates
  const enabledDays = weekDates
    .filter((date) => {
      const dayName = dayNames[date.getDay()];
      return weekHours[dayName]?.enabled;
    })
    .map((date) => {
      const dayName = dayNames[date.getDay()];
      return {
        short: dayNamesShort[dayName],
        full: t(weekdayI18nKey(dayName)),
        date: formatDate(date),
        fullDate: date,
      };
    });

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Calendar */}
      <div className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("calendar.title")}</h1>
            <p className="text-slate-600">{t("calendar.subtitle")}</p>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => setIsAvailabilityMode(!isAvailabilityMode)}
              className={`h-11 px-6 rounded-xl ${
                isAvailabilityMode
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <CalendarIcon className="w-5 h-5" />
              {isAvailabilityMode
                ? t("calendar.exit.availability")
                : t("calendar.define.availability")}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigateWeek("prev")}
                  className="hover:bg-slate-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="font-medium text-slate-900 min-w-[200px] text-center">{currentWeekDisplay}</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigateWeek("next")}
                  className="hover:bg-slate-100"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium"
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium"
              >
                {Array.from({ length: 10 }, (_, i) => 2020 + i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100"
            >
              {t("calendar.nav.today")}
            </Button>
          </div>
        </div>

        {/* Availability Mode - Hours Settings */}
        {isAvailabilityMode && (
          <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {t("calendar.hours.opening")}
            </h3>
            <div className="space-y-3">
              {Object.keys(weekHours).map((day) => (
                <div key={day} className={`p-3 rounded-xl bg-white border ${weekHours[day].enabled ? "border-slate-200" : "border-slate-100"}`}>
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex items-center gap-3 min-w-[120px]">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={weekHours[day].enabled}
                          onChange={() => toggleDayHours(day)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:inset-s-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      <span className="font-medium text-slate-900 text-sm">{t(weekdayI18nKey(day))}</span>
                    </div>

                    {weekHours[day].enabled ? (
                      <div className="flex items-center gap-2 flex-1">
                        <select
                          value={weekHours[day].startTime}
                          onChange={(e) => updateDayTime(day, "startTime", e.target.value)}
                          className="px-2 py-1 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          {allTimeSlots.map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        <span className="text-slate-400">→</span>
                        <select
                          value={weekHours[day].endTime}
                          onChange={(e) => updateDayTime(day, "endTime", e.target.value)}
                          className="px-2 py-1 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          {allTimeSlots.map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic text-sm">{t("calendar.hours.closed")}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Availability Mode Instruction */}
        {isAvailabilityMode && (
          <div className="mb-4 text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              {t("calendar.availability.instruction")}
            </h3>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-2 md:p-3 border border-slate-200">
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${enabledDays.length * 72 + 48}px` }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: `48px repeat(${enabledDays.length}, 1fr)`,
                gap: "1px",
                backgroundColor: "#e2e8f0",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                overflow: "hidden"
              }}>
                {/* Header */}
                <div className="bg-slate-50"></div>
                {enabledDays.map((day) => (
                  <div key={day.short} className="bg-slate-50 p-1.5 text-center">
                    <div className="font-medium text-slate-900 text-xs md:text-sm">{day.short}</div>
                    {!isAvailabilityMode && (
                      <div className="mt-0.5">
                        {isSameDay(day.fullDate, today) ? (
                          <span className="inline-flex px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] md:text-xs font-medium">
                            {day.date}
                          </span>
                        ) : (
                          <span className="text-[10px] md:text-xs text-slate-500">{day.date}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Time Slots */}
                {allTimeSlots.map((time) => (
                  <Fragment key={time}>
                    <div className="bg-white px-1.5 h-8 md:h-8 flex items-center justify-end">
                      <span className="text-[10px] md:text-xs text-slate-600">{time}</span>
                    </div>
                    {enabledDays.map((day) => {
                      const slotBooking = bookingBySlot.get(`${day.short}-${time}`);
                      const booking = slotBooking?.booking;
                      const isContinuation = slotBooking?.isContinuation ?? false;
                      const isClosed = isSlotClosed(day.short, time);

                      return (
                        <button
                          key={`${day.short}-${time}`}
                          onClick={() => handleSlotClick(day.short, day.date, time, booking, isClosed)}
                          className={`group p-1 h-8 md:h-8 transition-all text-left relative ${
                            isClosed
                              ? "bg-slate-100 cursor-pointer hover:bg-slate-200"
                              : isAvailabilityMode
                              ? "bg-white hover:bg-slate-50 cursor-pointer"
                              : booking
                              ? booking.status === "confirmed"
                                ? "bg-blue-50 hover:bg-blue-100 border-l-2 border-blue-600 cursor-pointer"
                                : booking.status === "pending"
                                ? "bg-yellow-50 hover:bg-yellow-100 border-l-2 border-yellow-600 cursor-pointer"
                                : "bg-red-50 hover:bg-red-100 border-l-2 border-red-600 cursor-pointer"
                              : "bg-white hover:bg-slate-50 cursor-pointer"
                          }`}
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
                          {!isAvailabilityMode && booking && !isClosed && !isContinuation && (
                            <div className="text-[10px] relative z-10 leading-tight">
                              <div className="font-medium text-slate-900 truncate">
                                {booking.client}
                              </div>
                              <div className="text-slate-600 truncate text-[9px]">{booking.service}</div>
                            </div>
                          )}
                          {!isAvailabilityMode && booking && !isClosed && isContinuation && (
                            <>
                              <div
                                className={`absolute -top-px left-0 right-0 h-px ${
                                  booking.status === "confirmed"
                                    ? "bg-blue-50"
                                    : booking.status === "pending"
                                      ? "bg-yellow-50"
                                      : "bg-red-50"
                                }`}
                              />
                              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 font-medium">
                                •
                              </div>
                            </>
                          )}
                          {!isAvailabilityMode && !booking && !isClosed && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                +
                              </div>
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
        </div>
      </div>

      {/* Detail Panel */}
      {selectedBooking && !isAvailabilityMode && (
        <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-4 md:p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">{t("booking.detail.title")}</h2>
            <button
              onClick={() => setSelectedBooking(null)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-sm text-slate-600 mb-1">{t("user.detail.statusLabel")}</div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  selectedBooking.status === "confirmed"
                    ? "bg-green-50 text-green-700"
                    : selectedBooking.status === "pending"
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {selectedBooking.status === "confirmed" ? t("user.detail.status.confirmed") : selectedBooking.status === "pending" ? t("user.detail.status.pending") : t("user.detail.status.cancelled")}
              </span>
            </div>

            <div>
              <div className="text-sm text-slate-600 mb-1">{t("booking.detail.clientLabel")}</div>
              <button
                onClick={() => window.location.href = "/admin/users/1"}
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer text-left"
              >
                {selectedBooking.client}
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                <Mail className="w-4 h-4" />
                {t("users.email")}
              </div>
              <div className="text-slate-900">{selectedBooking.email}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                <Phone className="w-4 h-4" />
                {t("users.phone")}
              </div>
              <div className="text-slate-900">{selectedBooking.phone}</div>
            </div>

            <div>
              <div className="text-sm text-slate-600 mb-1">{t("booking.detail.service")}</div>
              <div className="font-medium text-slate-900">{selectedBooking.service}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                <Clock className="w-4 h-4" />
                {t("booking.detail.date.time")}
              </div>
              <div className="text-slate-900">
                {selectedBooking.day} {selectedBooking.date} à {selectedBooking.time}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                <Euro className="w-4 h-4" />
                {t("booking.detail.amount")}
              </div>
              <div className="text-2xl font-bold text-blue-600">€{selectedBooking.price}</div>
            </div>

            <div className="pt-6 border-t border-slate-200 space-y-3">
              <Button className="w-full h-11 rounded-xl">
                <MessageCircle className="w-5 h-5" />
                {t("booking.detail.contact")}
              </Button>
              <Button variant="outline" className="w-full h-11 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200">
                <CalendarIcon className="w-5 h-5" />
                {t("booking.detail.reschedule")}
              </Button>
              <Button variant="destructive" className="w-full h-11 rounded-xl bg-red-50 text-red-600 hover:bg-red-100">
                <XCircle className="w-5 h-5" />
                {t("booking.detail.cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        slot={selectedSlot}
        services={services}
        clients={existingClients}
        onCreateClient={() => {
          setShowBookingModal(false);
          setShowNewClientModal(true);
        }}
        onSave={(booking) => {
          console.log("New booking:", booking);
          setShowBookingModal(false);
        }}
      />

      {/* New Client Modal */}
      <ClientFormModal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
        onSave={handleSaveNewClient}
      />
    </div>
  );
}
