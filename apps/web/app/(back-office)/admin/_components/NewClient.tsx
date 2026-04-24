"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import ClientFormModal, { type ClientFormData } from "#/components/ClientFormModal";
import { trpc } from "#/libs/trpc-client";

export default function NewClient() {
  const router = useRouter();
  const t = useTranslations("newClient");
  const tClients = useTranslations("users.clients");
  const utils = trpc.useUtils();

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: async () => {
      await utils.clients.list.invalidate();
      toast.success(tClients("created"));
    },
    onError: (err) => {
      toast.error(err.message || tClients("saveError"));
    },
  });

  const handleSave = async (clientData: ClientFormData) => {
    await createMutation.mutateAsync({
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      address: clientData.address || undefined,
      notes: clientData.notes || undefined,
    });
    router.push("/admin/users");
  };

  const headerBack = (
    <button
      type="button"
      onClick={() => router.push("/admin/users")}
      className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 -ml-1"
    >
      <ArrowLeft className="w-4 h-4 shrink-0" />
      {t("back")}
    </button>
  );

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <ClientFormModal
          isOpen={true}
          onClose={() => router.push("/admin/users")}
          onSubmit={handleSave}
          title={t("title")}
          headerStart={headerBack}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  );
}
