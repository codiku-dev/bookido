"use client";

import { Fragment, useEffect, useState } from "react";
import { X, Check, Plus, User, Package, CalendarPlus } from "lucide-react";
import { useTranslations } from "next-intl";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "#/components/ui/hover-card";

export type BookingModalService = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  imageUrl: string | null;
};

export type BookingModalClient = {
  id: string;
  name: string;
  email: string;
};

export type BookingModalSlotBookability = {
  contiguousMinutes: number;
  nextUnavailableFrom: string | null;
  nextUnavailableTo: string | null;
};

type BookingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  slot: { dayLabel: string; date: string; time: string; dateIso: string } | null;
  services: BookingModalService[];
  slotBookability?: BookingModalSlotBookability | null;
  clients: BookingModalClient[];
  onCreateClient: () => void;
  /** After inline client creation, parent passes the new id once so we can pre-select and return to the client step. */
  postCreateClientId?: string | null;
  onPostCreateClientApplied?: () => void;
  onSave: (booking: { serviceId: string; clientId: string }) => void;
};

export default function BookingModal({
  isOpen,
  onClose,
  slot,
  services,
  slotBookability = null,
  clients,
  onCreateClient,
  postCreateClientId = null,
  onPostCreateClientApplied,
  onSave,
}: BookingModalProps) {
  const t = useTranslations();
  const tCommon = useTranslations("common");
  const [step, setStep] = useState<"service" | "client">("service");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [searchClient, setSearchClient] = useState("");

  useEffect(() => {
    if (!isOpen || !postCreateClientId) {
      return;
    }
    setStep("client");
    setSelectedClient(postCreateClientId);
    setSearchClient("");
    onPostCreateClientApplied?.();
  }, [isOpen, postCreateClientId, onPostCreateClientApplied]);

  if (!isOpen || !slot) return null;

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchClient.toLowerCase()) ||
      client.email.toLowerCase().includes(searchClient.toLowerCase()),
  );

  const serviceFitsSlot = (durationMinutes: number) => {
    if (!slotBookability) {
      return true;
    }
    return durationMinutes <= slotBookability.contiguousMinutes;
  };

  const handleContinue = () => {
    if (step === "service" && selectedService) {
      const svc = services.find((s) => s.id === selectedService);
      if (!svc || !serviceFitsSlot(svc.durationMinutes)) {
        return;
      }
      setStep("client");
    } else if (step === "client" && selectedClient) {
      onSave({ serviceId: selectedService!, clientId: selectedClient });
      handleClose();
    }
  };

  const handleClose = () => {
    setStep("service");
    setSelectedService(null);
    setSelectedClient(null);
    setSearchClient("");
    onClose();
  };

  const renderServiceImage = (p: { imageUrl: string | null; name: string }) => (
    <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
      {p.imageUrl ? (
        <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 text-center px-1">
          {p.name.slice(0, 2)}
        </div>
      )}
    </div>
  );

  const renderServiceUnavailableHint = (service: BookingModalService) => {
    if (serviceFitsSlot(service.durationMinutes) || !slotBookability) {
      return null;
    }
    if (slotBookability.nextUnavailableFrom && slotBookability.nextUnavailableTo) {
      return t("calendar.create.serviceUnavailableBetween", {
        from: slotBookability.nextUnavailableFrom,
        to: slotBookability.nextUnavailableTo,
      });
    }
    return t("calendar.create.serviceUnavailableEndOfSchedule");
  };

  const renderServiceRow = (service: BookingModalService) => {
    const fits = serviceFitsSlot(service.durationMinutes);
    const hint = renderServiceUnavailableHint(service);

    const rowButton = (
      <button
        type="button"
        disabled={!fits}
        onClick={() => {
          if (fits) {
            setSelectedService(service.id);
          }
        }}
        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
          selectedService === service.id
            ? "border-blue-600 bg-blue-50"
            : "border-slate-200 hover:border-blue-300"
        } ${!fits ? "opacity-60 cursor-not-allowed hover:border-slate-200 pointer-events-none" : ""}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {renderServiceImage(service)}
            <div className="min-w-0">
              <div className="font-medium text-slate-900 truncate">{service.name}</div>
              <div className="text-sm text-slate-600">
                {t("services.durationValue", { minutes: service.durationMinutes })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xl font-bold text-blue-600">€{service.price}</div>
            {selectedService === service.id && (
              <div className="p-1 bg-blue-600 rounded-full">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>
      </button>
    );

    if (fits) {
      return <Fragment key={service.id}>{rowButton}</Fragment>;
    }

    return (
      <HoverCard key={service.id} openDelay={200} closeDelay={50}>
        <HoverCardTrigger asChild>
          <div className="block w-full rounded-xl cursor-not-allowed">{rowButton}</div>
        </HoverCardTrigger>
        <HoverCardContent side="left" className="max-w-[min(320px,85vw)] p-3 text-sm leading-snug">
          {hint}
        </HoverCardContent>
      </HoverCard>
    );
  };

  const renderServiceStep = () => (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Package className="w-5 h-5" />
        {t("calendar.select.service")}
      </h3>
      <div className="space-y-3">{services.map((service) => renderServiceRow(service))}</div>
    </div>
  );

  const renderClientStep = () => (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <User className="w-5 h-5" />
        {t("calendar.select.client")}
      </h3>

      <button
        type="button"
        onClick={() => {
          onCreateClient();
        }}
        className="w-full mb-4 p-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-blue-700 font-medium"
      >
        <Plus className="w-5 h-5" />
        {t("calendar.create.newClient")}
      </button>

      <input
        type="text"
        placeholder={t("calendar.search.client")}
        value={searchClient}
        onChange={(e) => setSearchClient(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 mb-4"
      />

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {filteredClients.map((client) => (
          <button
            key={client.id}
            type="button"
            onClick={() => setSelectedClient(client.id)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              selectedClient === client.id
                ? "border-blue-600 bg-blue-50"
                : "border-slate-200 hover:border-blue-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900">{client.name}</div>
                <div className="text-sm text-slate-600">{client.email}</div>
              </div>
              {selectedClient === client.id && (
                <div className="p-1 bg-blue-600 rounded-full">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const selectedServiceEntity = services.find((s) => s.id === selectedService);
  const selectedServiceValid =
    Boolean(selectedServiceEntity) &&
    Boolean(selectedService) &&
    serviceFitsSlot(selectedServiceEntity?.durationMinutes ?? 0);

  const renderFooter = () => (
    <div className="mt-6 pt-4 border-t border-slate-100">
      <div className="flex gap-3">
        {step === "client" && (
          <button
            type="button"
            onClick={() => setStep("service")}
            className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-medium"
          >
            {tCommon("previous")}
          </button>
        )}
        <button
          type="button"
          onClick={() => void handleContinue()}
          disabled={(step === "service" && !selectedServiceValid) || (step === "client" && !selectedClient)}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 hover:shadow-md transition-all font-medium disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {step === "service" ? tCommon("next") : t("calendar.create.submit")}
        </button>
      </div>
    </div>
  );

  const renderHeader = () => (
    <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <CalendarPlus className="w-6 h-6 text-blue-600" />
          {t("calendar.create.bookingTitle")}
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          {slot.dayLabel} {slot.date} à {slot.time}
        </p>
      </div>
      <button type="button" onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
        <X className="w-5 h-5" />
      </button>
    </div>
  );

  const renderProgress = () => (
    <div className="flex items-center gap-2 mb-6">
      <div className={`flex-1 h-2 rounded-full ${step === "service" || step === "client" ? "bg-blue-600" : "bg-slate-200"}`} />
      <div className={`flex-1 h-2 rounded-full ${step === "client" ? "bg-blue-600" : "bg-slate-200"}`} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {renderHeader()}

        <div className="p-6">
          {renderProgress()}
          {step === "service" ? renderServiceStep() : renderClientStep()}
          {renderFooter()}
        </div>
      </div>
    </div>
  );
}
