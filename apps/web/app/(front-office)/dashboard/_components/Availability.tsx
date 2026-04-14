// @ts-nocheck
import { useState } from "react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

interface DayAvailability {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

type WeekAvailability = Record<string, DayAvailability>;

const initialAvailability: WeekAvailability = {
  Monday: { enabled: true, startTime: "09:00", endTime: "18:00" },
  Tuesday: { enabled: true, startTime: "09:00", endTime: "18:00" },
  Wednesday: { enabled: true, startTime: "09:00", endTime: "18:00" },
  Thursday: { enabled: true, startTime: "09:00", endTime: "18:00" },
  Friday: { enabled: true, startTime: "09:00", endTime: "17:00" },
  Saturday: { enabled: false, startTime: "09:00", endTime: "13:00" },
  Sunday: { enabled: false, startTime: "09:00", endTime: "13:00" },
};

export default function Availability() {
  const [availability, setAvailability] = useState<WeekAvailability>(initialAvailability);
  const [saved, setSaved] = useState(false);

  const toggleDay = (day: string) => {
    setAvailability({
      ...availability,
      [day]: { ...availability[day], enabled: !availability[day].enabled },
    });
  };

  const updateTime = (day: string, field: "startTime" | "endTime", value: string) => {
    setAvailability({
      ...availability,
      [day]: { ...availability[day], [field]: value },
    });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Availability</h1>
        <p className="text-slate-600">Set your weekly working hours for each day</p>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl mb-6">
          ✓ Availability saved successfully!
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-200">
        {days.map((day) => (
          <div key={day} className={`p-6 transition-colors ${availability[day].enabled ? "bg-white" : "bg-slate-50"}`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4 min-w-[200px]">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={availability[day].enabled}
                    onChange={() => toggleDay(day)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className="text-lg font-medium text-slate-900">{day}</span>
              </div>

              {availability[day].enabled && (
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600 font-medium">Opens at:</label>
                    <select
                      value={availability[day].startTime}
                      onChange={(e) => updateTime(day, "startTime", e.target.value)}
                      className="px-4 py-2.5 rounded-lg border-2 border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium"
                    >
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-slate-400 text-xl">→</div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600 font-medium">Closes at:</label>
                    <select
                      value={availability[day].endTime}
                      onChange={(e) => updateTime(day, "endTime", e.target.value)}
                      className="px-4 py-2.5 rounded-lg border-2 border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium"
                    >
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="ml-auto">
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                      Open
                    </span>
                  </div>
                </div>
              )}

              {!availability[day].enabled && (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-sm font-medium">
                    Closed all day
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button onClick={handleSave} className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
          Save Availability
        </button>
        <p className="text-sm text-slate-500">Changes will be reflected on your public booking page</p>
      </div>
    </div>
  );
}
