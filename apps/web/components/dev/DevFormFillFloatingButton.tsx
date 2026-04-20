"use client";

import { useCallback } from "react";
import { Wand2 } from "lucide-react";
import { fillDevFormFields } from "@web/utils/dev-fill-form-fields";

export function DevFormFillFloatingButton() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const onFill = useCallback(() => {
    fillDevFormFields();
  }, []);

  const button = (
    <button
      type="button"
      onClick={onFill}
      title="Remplir les champs visibles (email robin…+timestamp…, mot de passe Password123!, etc.)"
      className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-amber-700/40 bg-amber-500 px-3 py-2 text-xs font-semibold text-amber-950 shadow-lg ring-1 ring-amber-400/60 transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
    >
      <Wand2 className="size-4 shrink-0" aria-hidden />
      Dev fill
    </button>
  );

  return (
    <div
      data-dev-form-fill-ignore
      className="pointer-events-none fixed right-4 top-4 z-[9999] flex flex-col items-end gap-2"
    >
      {button}
    </div>
  );
}
