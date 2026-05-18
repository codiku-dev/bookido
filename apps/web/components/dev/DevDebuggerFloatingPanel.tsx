"use client";

import { useEffect, useState } from "react";
import { Bug } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "#/components/ui/button";
import { Label } from "#/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { Switch } from "#/components/ui/switch";
import { queryClient } from "@web/libs/trpc-client";
import {
  getDevSimulateStripeReadyFromStorage,
  setDevSimulateStripeReadyInStorage,
} from "@web/utils/dev-simulate-stripe";
import { isDevToolsEnabled } from "@web/utils/is-dev-tools-enabled";

export function DevDebuggerFloatingPanel() {
  const t = useTranslations("dev.debugger");
  const [open, setOpen] = useState(false);
  const [simulateStripe, setSimulateStripe] = useState(false);

  useEffect(() => {
    setSimulateStripe(getDevSimulateStripeReadyFromStorage());
  }, []);

  const triggerButton = (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      title={t("open")}
      className="pointer-events-auto size-11 rounded-full border border-violet-600/40 bg-violet-600 text-white shadow-lg ring-1 ring-violet-400/50 hover:bg-violet-500"
      aria-label={t("open")}
    >
      <Bug className="size-5" />
    </Button>
  );

  const onSimulateStripeChange = (checked: boolean) => {
    setDevSimulateStripeReadyInStorage(checked);
    setSimulateStripe(checked);
    void queryClient.invalidateQueries();
  };

  const stripeRow = (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor="dev-simulate-stripe" className="cursor-pointer text-sm leading-snug font-medium">
        {t("simulateStripe")}
      </Label>
      <Switch
        id="dev-simulate-stripe"
        checked={simulateStripe}
        onCheckedChange={(c) => onSimulateStripeChange(c === true)}
      />
    </div>
  );

  const hint = <p className="text-xs text-muted-foreground">{t("hint")}</p>;

  if (!isDevToolsEnabled()) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[9998] flex flex-col items-end gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          className="pointer-events-auto w-80 space-y-4 border-violet-200/80 bg-background/95 backdrop-blur-md"
        >
          <p className="text-sm font-semibold text-foreground">{t("title")}</p>
          {stripeRow}
          {hint}
        </PopoverContent>
      </Popover>
    </div>
  );
}
