"use client";

import type { ReactNode } from "react";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "#/components/ui/hover-card";

export type WeeklyTimeGridDay = {
  key: string;
  label: string;
  subLabel?: string;
  isToday?: boolean;
  isCompact?: boolean;
  mutedLabel?: boolean;
};

type WeeklyTimeGridProps = {
  days: WeeklyTimeGridDay[];
  timeSlots: string[];
  renderCell: (p: { day: WeeklyTimeGridDay; time: string; slotIndex: number; isLastVisibleSlot: boolean }) => ReactNode;
  className?: string;
};

export function CalendarSlotHoverHint(p: { label: string; children: ReactNode }) {
  return (
    <HoverCard openDelay={200} closeDelay={50}>
      <HoverCardTrigger asChild>
        <span className="block h-8 w-full max-w-full md:h-8 outline-none">{p.children}</span>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        sideOffset={6}
        className="max-w-[min(280px,85vw)] p-3 text-sm leading-snug"
      >
        {p.label}
      </HoverCardContent>
    </HoverCard>
  );
}

export function WeeklyTimeGrid(p: WeeklyTimeGridProps) {
  const timeColumnWidth = 48;
  const normalDayMinWidth = 108;
  const compactDayMinWidth = 66;
  const gridTemplateColumns = p.days
    .map((day) => (day.isCompact ? `minmax(${compactDayMinWidth}px, 0.62fr)` : `minmax(${normalDayMinWidth}px, 1fr)`))
    .join(" ");
  const minWidth = `${timeColumnWidth + p.days.reduce((sum, day) => sum + (day.isCompact ? compactDayMinWidth : normalDayMinWidth), 0)}px`;

  return (
    <div className={p.className}>
      <div className="overflow-x-auto">
        <div style={{ minWidth }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `${timeColumnWidth}px ${gridTemplateColumns}`,
              gap: "1px",
              backgroundColor: "#e2e8f0",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <div className="bg-slate-50" />
            {p.days.map((day) => (
              <div
                key={day.key}
                className={`bg-slate-50 p-1.5 text-center ${day.isToday ? "border-l-2 border-r-2 border-t-2 border-blue-700" : ""}`}
              >
                <div className={`font-medium text-xs md:text-sm ${day.mutedLabel ? "text-slate-500" : "text-slate-900"}`}>
                  {day.label}
                </div>
                {day.subLabel ? (
                  <div className="mt-0.5">
                    {day.isToday ? (
                      <span className="inline-flex px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] md:text-xs font-medium">
                        {day.subLabel}
                      </span>
                    ) : (
                      <span className="text-[10px] md:text-xs text-slate-500">{day.subLabel}</span>
                    )}
                  </div>
                ) : null}
              </div>
            ))}

            {p.timeSlots.map((time, slotIndex) => {
              const isLastVisibleSlot = slotIndex === p.timeSlots.length - 1;
              return (
                <div key={time} className="contents">
                  <div className="bg-white px-1.5 h-8 md:h-8 flex items-center justify-end">
                    <span className="text-[10px] md:text-xs text-slate-600">{time}</span>
                  </div>
                  {p.days.map((day) => {
                    const body = p.renderCell({ day, time, slotIndex, isLastVisibleSlot });
                    return (
                      <div
                        key={`${day.key}-${time}`}
                        className={`flex h-8 md:h-8 w-full min-h-0 flex-col box-border${day.isToday ? " border-l-2 border-r-2 border-blue-700" : ""}`}
                      >
                        <div className="min-h-0 flex-1 overflow-hidden">{body}</div>
                        {day.isToday && isLastVisibleSlot ? <div className="h-0.5 w-full shrink-0 bg-blue-700" aria-hidden /> : null}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
