const DEV_PASSWORD = "Password123!";

function devEmail() {
  return `robin.lebhar+${Date.now()}bookido@gmail.com`;
}

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, "value");
  const setter = desc?.set;
  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function isVisible(el: HTMLElement): boolean {
  if (typeof el.checkVisibility === "function") {
    return el.checkVisibility({ checkOpacity: true, contentVisibilityAuto: true });
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function hints(el: HTMLElement): string {
  const id = el.id ?? "";
  const name = el.getAttribute("name") ?? "";
  const ph = el.getAttribute("placeholder") ?? "";
  const ac = el.getAttribute("autocomplete") ?? "";
  return `${id} ${name} ${ph} ${ac}`.toLowerCase();
}

function fillSelect(el: HTMLSelectElement) {
  const options = Array.from(el.options);
  const withValue = options.find((o) => o.value && !o.disabled);
  if (!withValue) {
    return;
  }
  el.value = withValue.value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Fills visible form controls with dev defaults. Uses native value setter + events so React Hook Form / controlled inputs update.
 */
export function fillDevFormFields(): void {
  const email = devEmail();
  const h = hints;

  const nodes = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    [
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]):not([type="file"]):not([disabled]):not([readonly])',
      "textarea:not([disabled]):not([readonly])",
      "select:not([disabled])",
    ].join(", "),
  );

  for (const el of nodes) {
    if (!(el instanceof HTMLElement)) {
      continue;
    }
    if (el.closest("[data-dev-form-fill-ignore]")) {
      continue;
    }
    if (!isVisible(el)) {
      continue;
    }

    if (el instanceof HTMLSelectElement) {
      fillSelect(el);
      continue;
    }

    if (el instanceof HTMLTextAreaElement) {
      setNativeValue(el, "Texte de test (remplissage dev).");
      continue;
    }

    const type = el.type;

    if (type === "checkbox") {
      if (/terms|accept|policy|cgv|newsletter|remember|marketing/i.test(h(el))) {
        if (!el.checked) {
          el.click();
        }
      }
      continue;
    }

    if (type === "radio") {
      continue;
    }

    if (type === "email" || /\bemail\b|e-mail|courriel/.test(h(el))) {
      setNativeValue(el, email);
      continue;
    }

    if (type === "password") {
      setNativeValue(el, DEV_PASSWORD);
      continue;
    }

    if (type === "tel" || /\bphone|tel|mobile|gsm|téléphone\b/.test(h(el))) {
      setNativeValue(el, "+33601020304");
      continue;
    }

    if (type === "url" || /\burl|website|site\b/.test(h(el))) {
      setNativeValue(el, "https://example.com");
      continue;
    }

    if (type === "number" || /\bamount|montant|qty|quantity|nombre\b/.test(h(el))) {
      setNativeValue(el, "42");
      continue;
    }

    if (type === "date") {
      setNativeValue(el, new Date().toISOString().slice(0, 10));
      continue;
    }

    if (type === "text" || type === "search" || type === "") {
      const hint = h(el);
      if (/\bname|nom|fullname|full-name|prenom|prénom|firstname|lastname|surname|displayname|company|société|city|ville|address|adresse\b/.test(hint)) {
        if (/\baddress|adresse|street|rue\b/.test(hint)) {
          setNativeValue(el, "10 rue de la Paix, 75002 Paris");
        } else if (/\bcity|ville\b/.test(hint)) {
          setNativeValue(el, "Paris");
        } else if (/\bcompany|société\b/.test(hint)) {
          setNativeValue(el, "Bookido Dev");
        } else {
          setNativeValue(el, "Robin Lebhar");
        }
        continue;
      }
      setNativeValue(el, "Valeur test (dev)");
      continue;
    }
  }
}
