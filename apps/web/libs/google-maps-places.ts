export type GoogleAutocompletePlaceResult = {
  formatted_address?: string;
  name?: string;
};

export type GoogleMapsEventListener = {
  remove: () => void;
};

type GoogleMapsAutocomplete = {
  addListener: (eventName: "place_changed", handler: () => void) => GoogleMapsEventListener;
  getPlace: () => GoogleAutocompletePlaceResult;
};

type GoogleMapsPlacesNamespace = {
  Autocomplete: new (
    input: HTMLInputElement,
    options?: { fields?: string[]; types?: string[] },
  ) => GoogleMapsAutocomplete;
};

type GoogleMapsNamespace = {
  places?: GoogleMapsPlacesNamespace;
};

export type GoogleWindow = Window & {
  google?: {
    maps?: GoogleMapsNamespace;
  };
};

let googleMapsScriptPromise: Promise<void> | null = null;

export function loadGoogleMapsPlacesScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  const googleWindow = window as GoogleWindow;
  if (googleWindow.google?.maps?.places?.Autocomplete) {
    return Promise.resolve();
  }
  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise;
  }
  googleMapsScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("GOOGLE_MAPS_SCRIPT_LOAD_FAILED"));
    document.head.appendChild(script);
  });
  return googleMapsScriptPromise;
}

const PAC_STYLE_ID = "google-places-pac-zindex-fix";

export function ensureGooglePlacesPacZIndexStyle(): void {
  if (typeof document === "undefined") {
    return;
  }
  if (document.getElementById(PAC_STYLE_ID)) {
    return;
  }
  const styleElement = document.createElement("style");
  styleElement.id = PAC_STYLE_ID;
  styleElement.textContent = ".pac-container { z-index: 9999 !important; }";
  document.head.appendChild(styleElement);
}
