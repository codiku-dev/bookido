const STORAGE_KEY = "bookido.admin.calendar.planningView";

export type AdminCalendarPlanningView = "calendar" | "list";

export function getAdminCalendarPlanningView(): AdminCalendarPlanningView {
  if (typeof window === "undefined") {
    return "calendar";
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "list" || raw === "calendar") {
      return raw;
    }
  } catch {
    /* quota / private mode */
  }
  return "calendar";
}

export function setAdminCalendarPlanningView(value: AdminCalendarPlanningView): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}
