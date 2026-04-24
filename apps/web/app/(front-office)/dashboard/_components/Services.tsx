import { useState } from "react";
import { Plus, Clock, Euro, Pencil, Trash2 } from "lucide-react";

interface Service {
  id: number;
  name: string;
  duration: string;
  price: number;
}

const initialServices: Service[] = [
  { id: 1, name: "1-on-1 Personal Training", duration: "60", price: 50 },
  { id: 2, name: "Nutrition Coaching Session", duration: "45", price: 40 },
  { id: 3, name: "5-Session Training Pack", duration: "60", price: 200 },
  { id: 4, name: "Monthly Training Plan", duration: "240", price: 180 },
];

export default function Services() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", duration: "", price: "" });

  const handleAdd = () => {
    if (formData.name && formData.duration && formData.price) {
      const newService: Service = {
        id: Date.now(),
        name: formData.name,
        duration: formData.duration,
        price: parseFloat(formData.price),
      };
      setServices([...services, newService]);
      setFormData({ name: "", duration: "", price: "" });
      setIsAdding(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      duration: service.duration,
      price: service.price.toString(),
    });
  };

  const handleUpdate = () => {
    if (editingId && formData.name && formData.duration && formData.price) {
      setServices(
        services.map((s) =>
          s.id === editingId
            ? { ...s, name: formData.name, duration: formData.duration, price: parseFloat(formData.price) }
            : s
        )
      );
      setFormData({ name: "", duration: "", price: "" });
      setEditingId(null);
    }
  };

  const handleDelete = (id: number) => {
    setServices(services.filter((s) => s.id !== id));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Services</h1>
          <p className="text-slate-600">Manage your coaching services and pricing</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Service
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            {isAdding ? "Add New Service" : "Edit Service"}
          </h2>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-slate-700 mb-2">Service Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 1-on-1 Personal Training"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-2">Duration (minutes)</label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="60"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-2">Price (€)</label>
              <input
                type="text"
                inputMode="decimal"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="50"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={isAdding ? handleAdd : handleUpdate}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              {isAdding ? "Add Service" : "Update Service"}
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setFormData({ name: "", duration: "", price: "" });
              }}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Services List */}
      <div className="grid md:grid-cols-2 gap-6">
        {services.map((service) => (
          <div key={service.id} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">{service.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4" />
                <span>{service.duration} min</span>
              </div>
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-slate-600" />
                <span className="text-2xl font-bold text-blue-600">{service.price}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
