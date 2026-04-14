import { useState } from "react";
import { X, Check, Plus, User, Package, CalendarPlus } from "lucide-react";
import { useIntl } from "react-intl";

interface Service {
  id: number;
  name: string;
  duration: string;
  price: number;
}

interface Client {
  id: number;
  name: string;
  email: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: { day: string; date: string; time: string } | null;
  services: Service[];
  clients: Client[];
  onCreateClient: () => void;
  onSave: (booking: { serviceId: number; clientId: number | null; newClientName?: string }) => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  slot,
  services,
  clients,
  onCreateClient,
  onSave,
}: BookingModalProps) {
  const intl = useIntl();
  const [step, setStep] = useState<"service" | "client">("service");
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [searchClient, setSearchClient] = useState("");

  if (!isOpen || !slot) return null;

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchClient.toLowerCase()) ||
    client.email.toLowerCase().includes(searchClient.toLowerCase())
  );

  const handleContinue = () => {
    if (step === "service" && selectedService) {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <CalendarPlus className="w-6 h-6 text-blue-600" />
              {intl.formatMessage({ id: "calendar.create.booking" })}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {slot.day} {slot.date} à {slot.time}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex-1 h-2 rounded-full ${step === "service" || step === "client" ? "bg-blue-600" : "bg-slate-200"}`} />
            <div className={`flex-1 h-2 rounded-full ${step === "client" ? "bg-blue-600" : "bg-slate-200"}`} />
          </div>

          {step === "service" && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                {intl.formatMessage({ id: "calendar.select.service" })}
              </h3>
              <div className="space-y-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedService === service.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900">{service.name}</div>
                        <div className="text-sm text-slate-600">{service.duration}</div>
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
                ))}
              </div>
            </div>
          )}

          {step === "client" && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                {intl.formatMessage({ id: "calendar.select.client" })}
              </h3>

              <button
                onClick={() => {
                  handleClose();
                  onCreateClient();
                }}
                className="w-full mb-4 p-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-blue-700 font-medium"
              >
                <Plus className="w-5 h-5" />
                {intl.formatMessage({ id: "calendar.create.client" })}
              </button>

              <input
                type="text"
                placeholder={intl.formatMessage({ id: "calendar.search.client" })}
                value={searchClient}
                onChange={(e) => setSearchClient(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 mb-4"
              />

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
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
          )}

          <div className="flex gap-3 mt-6">
            {step === "client" && (
              <button
                onClick={() => setStep("service")}
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
              >
                {intl.formatMessage({ id: "common.previous" })}
              </button>
            )}
            <button
              onClick={handleContinue}
              disabled={
                (step === "service" && !selectedService) ||
                (step === "client" && !selectedClient)
              }
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {step === "service"
                ? intl.formatMessage({ id: "common.next" })
                : intl.formatMessage({ id: "calendar.create.booking" })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
