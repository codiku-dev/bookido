"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format, isValid, parseISO } from "date-fns";
import { enUS, fr as frLocale } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { useLanguage } from "#/components/use-language";
import { Button } from "#/components/ui/button";
import { Calendar } from "#/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { cn } from "@repo/ui/utils/cn";

export function LocaleDatePicker(p: {
  id: string;
  value: string;
  onChange: (isoDate: string) => void;
  className?: string;
  clearAriaLabel?: string;
}) {
  const t = useTranslations("common.datePicker");
  const { locale } = useLanguage();
  const [open, setOpen] = useState(false);

  const dateFnsLocale = locale === "fr" ? frLocale : enUS;

  const parsed = p.value ? parseISO(p.value) : undefined;
  const selectedDate = parsed && isValid(parsed) ? parsed : undefined;

  const labelText =
    selectedDate !== undefined ? format(selectedDate, "P", { locale: dateFnsLocale }) : t("placeholder");

  const clearFooter = (
    <div className="flex justify-end border-t border-slate-100 px-2 py-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 text-xs text-slate-600"
        onClick={() => {
          p.onChange("");
          setOpen(false);
        }}
      >
        {t("clear")}
      </Button>
    </div>
  );

  const calendarBlock = (
    <Calendar
      mode="single"
      locale={dateFnsLocale}
      selected={selectedDate}
      defaultMonth={selectedDate}
      onSelect={(d) => {
        if (d) {
          p.onChange(format(d, "yyyy-MM-dd"));
        }
        setOpen(false);
      }}
    />
  );

  const trigger = (
    <PopoverTrigger asChild>
      <Button
        id={p.id}
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-between gap-2 px-3 py-2.5 h-auto min-h-[42px] rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-normal shadow-none hover:bg-slate-100",
          selectedDate === undefined && "text-slate-400",
          p.className,
        )}
      >
        <span className="truncate text-left">{labelText}</span>
        <span className="flex items-center gap-1">
          {selectedDate !== undefined ? (
            <span
              role="button"
              tabIndex={0}
              aria-label={p.clearAriaLabel ?? t("clear")}
              className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-700"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                p.onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  p.onChange("");
                }
              }}
            >
              <X className="size-3.5" aria-hidden />
            </span>
          ) : null}
          <CalendarIcon className="size-4 shrink-0 text-slate-800 opacity-80" aria-hidden />
        </span>
      </Button>
    </PopoverTrigger>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {trigger}
      <PopoverContent className="w-auto p-0 overflow-hidden" align="start">
        {calendarBlock}
        {clearFooter}
      </PopoverContent>
    </Popover>
  );
}
