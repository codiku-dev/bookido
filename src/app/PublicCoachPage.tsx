import { useState, Fragment, useEffect } from "react";
import { useIntl } from "react-intl";
import { motion } from "motion/react";
import { Check, Calendar, Clock, Euro, Mail, Phone, User } from "lucide-react";
import BookidoLogo from "./components/BookidoLogo";

const services = [
  { id: 1, name: "1-on-1 Personal Training", duration: "60 min", price: 50 },
  { id: 2, name: "Nutrition Coaching Session", duration: "45 min", price: 40 },
  { id: 3, name: "5-Session Training Pack", duration: "60 min each", price: 200 },
  { id: 4, name: "Monthly Training Plan", duration: "4 sessions", price: 180 },
];

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

const days = [
  { short: "Mon", full: "Monday", date: "Apr 14" },
  { short: "Tue", full: "Tuesday", date: "Apr 15" },
  { short: "Wed", full: "Wednesday", date: "Apr 16" },
  { short: "Thu", full: "Thursday", date: "Apr 17" },
  { short: "Fri", full: "Friday", date: "Apr 18" },
];

// Simulate some blocked slots
const blockedSlots = new Set(["Mon-10:00", "Tue-09:00", "Wed-14:00", "Thu-11:00"]);

type BookingStep = "service" | "time" | "confirmation";

interface TimeSlot {
  day: string;
  date: string;
  time: string;
}

export default function PublicCoachPage() {
  const intl = useIntl();
  const [currentStep, setCurrentStep] = useState<BookingStep>("service");
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const handleServiceSelect = (service: typeof services[0]) => {
    setSelectedService(service);
    setCurrentStep("time");
  };

  useEffect(() => {
    if (currentStep === "time") {
      setTimeout(() => {
        document.getElementById("calendar-section")?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 100);
    }
  }, [currentStep]);

  const handleTimeSelect = (day: string, date: string, time: string) => {
    const slotKey = `${day}-${time}`;
    const existingSlotIndex = selectedSlots.findIndex(
      (slot) => slot.day === day && slot.time === time
    );

    if (existingSlotIndex >= 0) {
      // Deselect
      setSelectedSlots(selectedSlots.filter((_, index) => index !== existingSlotIndex));
    } else {
      // Select
      setSelectedSlots([...selectedSlots, { day, date, time }]);
    }
  };

  const isSlotSelected = (day: string, time: string) => {
    return selectedSlots.some((slot) => slot.day === day && slot.time === time);
  };

  const isSlotBlocked = (day: string, time: string) => {
    return blockedSlots.has(`${day}-${time}`);
  };

  const handleConfirmBooking = () => {
    setCurrentStep("confirmation");
  };

  const removeSlot = (index: number) => {
    setSelectedSlots(selectedSlots.filter((_, i) => i !== index));
  };

  const totalPrice = selectedService ? selectedService.price * selectedSlots.length : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full mb-6">
                Certified Personal Trainer
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Sarah Johnson
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Transform your fitness journey with personalized training programs designed for your goals.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors"
              >
                {intl.formatMessage({ id: "public.hero.cta" })}
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
                  alt="Sarah Johnson - Personal Trainer"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Services */}
      <section id="services" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">{intl.formatMessage({ id: "public.services.title" })}</h2>
            <p className="text-slate-600">{intl.formatMessage({ id: "public.hero.subtitle" })}</p>
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
                  <div className="flex items-center gap-2">
                    <Euro className="w-4 h-4" />
                    <span className="text-2xl font-bold text-slate-900">{service.price}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Calendar & Booking */}
      {currentStep !== "service" && (
        <motion.section
          id="calendar-section"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="py-12 px-6 bg-slate-50"
        >
          <div className="max-w-5xl mx-auto">
            {currentStep === "time" && (
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
                  {intl.formatMessage({ id: "public.time.title" })}
                </h2>

                {/* Mobile View */}
                <div className="lg:hidden">
                  {/* Selected Slots Summary */}
                  {selectedSlots.length > 0 && (
                    <div className="bg-blue-50 rounded-2xl p-6 mb-6 border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-blue-900">{intl.formatMessage({ id: selectedSlots.length > 1 ? "public.time.selected.plural" : "public.time.selected" }, { count: selectedSlots.length })}</h3>
                        <span className="text-lg font-bold text-blue-600">€{totalPrice}</span>
                      </div>
                      <div className="space-y-2">
                        {selectedSlots.map((slot, index) => (
                          <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3">
                            <div>
                              <div className="font-medium text-slate-900">{slot.day} {slot.date}</div>
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
                    <h3 className="font-bold text-slate-900 mb-4">{intl.formatMessage({ id: "public.mobile.select.day" })}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {days.map((day) => {
                        const slotsInDay = selectedSlots.filter(s => s.day === day.short).length;
                        return (
                          <button
                            key={day.short}
                            onClick={() => setSelectedDay(day.short)}
                            className={`p-4 rounded-xl border-2 transition-all relative ${
                              selectedDay === day.short
                                ? "border-blue-600 bg-blue-50"
                                : "border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            <div className="font-bold text-slate-900">{day.short}</div>
                            <div className="text-sm text-slate-600">{day.date}</div>
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
                        {intl.formatMessage({ id: "public.mobile.select.time" })} - {selectedDay} {days.find(d => d.short === selectedDay)?.date}
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {timeSlots.map((time) => {
                          const isBlocked = isSlotBlocked(selectedDay, time);
                          const isSelected = isSlotSelected(selectedDay, time);

                          return (
                            <button
                              key={time}
                              onClick={() => !isBlocked && handleTimeSelect(selectedDay, days.find(d => d.short === selectedDay)?.date || "", time)}
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
                          <div key={day.short} className="bg-slate-50 p-4 text-center">
                            <div className="font-medium text-slate-900">{day.short}</div>
                            <div className="text-sm text-slate-500">{day.date}</div>
                          </div>
                        ))}

                        {/* Time Slots */}
                        {timeSlots.map((time) => (
                          <Fragment key={time}>
                            <div className="bg-white p-4 flex items-center justify-end pr-3">
                              <span className="text-sm text-slate-600">{time}</span>
                            </div>
                            {days.map((day) => {
                              const isBlocked = isSlotBlocked(day.short, time);
                              const isSelected = isSlotSelected(day.short, time);

                              return (
                                <button
                                  key={`${day.short}-${time}`}
                                  onClick={() => !isBlocked && handleTimeSelect(day.short, day.date, time)}
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
                          <span className="text-slate-600">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-slate-200 rounded opacity-50"></div>
                          <span className="text-slate-600">Unavailable</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-600 rounded"></div>
                          <span className="text-slate-600">Selected</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Slots Summary */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="font-bold text-slate-900 mb-4">{intl.formatMessage({ id: "public.payment.slots" })}</h3>

                    {selectedSlots.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-8">
                        {intl.formatMessage({ id: "public.time.subtitle" })}
                      </p>
                    ) : (
                      <>
                        <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
                          {selectedSlots.map((slot, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex-1">
                                <div className="font-medium text-slate-900 text-sm">{slot.day}</div>
                                <div className="text-xs text-slate-600">{slot.date} · {slot.time}</div>
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
                            <span className="text-slate-600">{intl.formatMessage({ id: "public.payment.total" })} ({selectedSlots.length} {intl.formatMessage({ id: selectedSlots.length > 1 ? "public.time.selected.plural" : "public.time.selected" }, { count: selectedSlots.length })})</span>
                            <span className="text-xl font-bold text-blue-600">€{totalPrice}</span>
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
                      {intl.formatMessage({ id: "common.confirm" })}
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

                  <h2 className="text-3xl font-bold text-slate-900 mb-4">
                    Merci !
                  </h2>
                  <p className="text-lg text-slate-600 mb-8">
                    Votre réservation pour <strong>{selectedService.name}</strong> a été prise en compte.
                  </p>
                  <p className="text-md text-slate-600 mb-8">
                    Vous avez reçu un email avec les détails de votre réservation.
                  </p>

                  <button
                    onClick={() => {
                      setCurrentStep("service");
                      setSelectedService(null);
                      setSelectedSlots([]);
                      setSelectedDay(null);
                    }}
                    className="px-8 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    {intl.formatMessage({ id: "public.confirmation.new" })}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-4 mb-6">
            <BookidoLogo className="w-12 h-12 brightness-0 invert opacity-80" />
            <div className="text-xl font-bold text-white">Bookido</div>
          </div>
          <p className="text-sm text-center">© 2026 Sarah Johnson Coaching. Powered by Bookido. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
