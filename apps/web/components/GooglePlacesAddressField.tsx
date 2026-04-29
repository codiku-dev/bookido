"use client";

import { useEffect, useRef, type ChangeEvent, type Ref } from "react";
import { Check } from "lucide-react";
import { FormControl, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import {
  ensureGooglePlacesPacZIndexStyle,
  loadGoogleMapsPlacesScript,
  type GoogleMapsEventListener,
  type GoogleWindow,
} from "#/libs/google-maps-places";

type AddressFieldLike = {
  value: string;
  onChange: (value: string | React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  name: string;
  ref: Ref<HTMLInputElement>;
};

type SetFromPlacesOptions = {
  shouldDirty?: boolean;
  shouldTouch?: boolean;
  shouldValidate?: boolean;
};

export function GooglePlacesAddressField(p: {
  apiKey: string;
  placesActive: boolean;
  addressField: AddressFieldLike;
  fromPlaces: boolean;
  setFromPlaces: (value: boolean, options?: SetFromPlacesOptions) => void;
  label: React.ReactNode;
  hint?: React.ReactNode;
  placeholder: string;
  autoComplete?: string;
  inputId?: string;
  inputClassName?: string;
}) {
  const inputNodeRef = useRef<HTMLInputElement | null>(null);
  const googleInitRef = useRef(false);
  const googleBoundInputRef = useRef<HTMLInputElement | null>(null);
  const placesSuppressClearUntilMsRef = useRef(0);
  const addressFieldRef = useRef(p.addressField);
  const setFromPlacesRef = useRef(p.setFromPlaces);
  addressFieldRef.current = p.addressField;
  setFromPlacesRef.current = p.setFromPlaces;

  const trimmed = (p.addressField.value ?? "").trim();
  const hasGoogle = p.apiKey.trim().length > 0;
  const showValidatedCheckmark = trimmed.length > 0 && (!hasGoogle || p.fromPlaces);

  const validatedIcon = showValidatedCheckmark ? (
    <Check
      className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-emerald-600"
      aria-hidden
    />
  ) : null;

  const mergedInputRef = (node: HTMLInputElement | null) => {
    inputNodeRef.current = node;
    const { ref } = p.addressField;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref && typeof ref === "object" && "current" in ref) {
      (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    }
  };

  useEffect(() => {
    if (!p.placesActive || p.apiKey.trim().length === 0) {
      googleInitRef.current = false;
      googleBoundInputRef.current = null;
      return;
    }
    ensureGooglePlacesPacZIndexStyle();
    const addressInputNode = inputNodeRef.current;
    if (!addressInputNode) {
      return;
    }
    if (googleInitRef.current && googleBoundInputRef.current === addressInputNode) {
      return;
    }

    googleInitRef.current = true;
    googleBoundInputRef.current = addressInputNode;
    let cancelled = false;
    let listener: GoogleMapsEventListener | null = null;

    void loadGoogleMapsPlacesScript(p.apiKey)
      .then(() => {
        if (cancelled) {
          return;
        }
        const googleWindow = window as GoogleWindow;
        const AutocompleteCtor = googleWindow.google?.maps?.places?.Autocomplete;
        if (!AutocompleteCtor) {
          return;
        }

        const autocomplete = new AutocompleteCtor(addressInputNode, {
          fields: ["formatted_address", "name"],
        });

        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const formattedAddress = place.formatted_address?.trim() ?? "";
          const fallbackName = place.name?.trim() ?? "";
          const nextAddress = formattedAddress.length > 0 ? formattedAddress : fallbackName;
          if (nextAddress.length > 0) {
            placesSuppressClearUntilMsRef.current = performance.now() + 750;
            addressFieldRef.current.onChange(nextAddress);
            setFromPlacesRef.current(true, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
          }
        });
      })
      .catch(() => {
        googleInitRef.current = false;
        googleBoundInputRef.current = null;
      });

    return () => {
      cancelled = true;
      listener?.remove();
      googleInitRef.current = false;
      googleBoundInputRef.current = null;
      placesSuppressClearUntilMsRef.current = 0;
    };
  }, [p.placesActive, p.apiKey]);

  const inputRow = (
    <div className="relative w-full">
      <FormControl>
        <Input
          id={p.inputId}
          autoComplete={p.autoComplete ?? "street-address"}
          className={[showValidatedCheckmark ? "rounded-xl pr-9" : "rounded-xl", p.inputClassName]
            .filter(Boolean)
            .join(" ")}
          placeholder={p.placeholder}
          name={p.addressField.name}
          value={p.addressField.value ?? ""}
          onBlur={p.addressField.onBlur}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            p.addressField.onChange(event);
            if (performance.now() >= placesSuppressClearUntilMsRef.current) {
              p.setFromPlaces(false, { shouldDirty: true });
            }
          }}
          ref={mergedInputRef}
        />
      </FormControl>
      {validatedIcon}
    </div>
  );

  const hintBlock = p.hint != null ? <p className="text-xs text-slate-500">{p.hint}</p> : null;

  return (
    <FormItem className="md:col-span-2">
      <FormLabel>{p.label}</FormLabel>
      {inputRow}
      {hintBlock}
      <FormMessage />
    </FormItem>
  );
}
