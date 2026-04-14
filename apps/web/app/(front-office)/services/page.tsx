"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { BackButton } from "../_components/BackButton";
import { FrontOfficePageLayout } from "../_components/FrontOfficePageLayout";

export default function ServicesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const priceFormatter = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });

  const services = [
    {
      id: 1,
      name: t("public.services.items.personalTraining.name"),
      duration: t("public.services.items.personalTraining.duration"),
      price: 50,
    },
    {
      id: 2,
      name: t("public.services.items.nutritionCoaching.name"),
      duration: t("public.services.items.nutritionCoaching.duration"),
      price: 40,
    },
    {
      id: 3,
      name: t("public.services.items.trainingPack.name"),
      duration: t("public.services.items.trainingPack.duration"),
      price: 200,
    },
    {
      id: 4,
      name: t("public.services.items.monthlyPlan.name"),
      duration: t("public.services.items.monthlyPlan.duration"),
      price: 180,
    },
  ];

  return (
    <FrontOfficePageLayout
      rootClassName="min-h-screen bg-white py-12 px-6"
      topAction={<BackButton label={t("common.back")} fallbackHref="/" />}
    >
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">{t("public.services.title")}</h2>
          <p className="text-slate-600">{t("public.hero.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-left p-8 rounded-2xl border-2 border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 hover:scale-[1.005] transition-all duration-300 ease-out"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-4">{service.name}</h3>
              <div className="flex items-center gap-6 text-slate-600 mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{service.duration}</span>
                </div>
                <span className="text-2xl font-bold text-slate-900">{priceFormatter.format(service.price)}</span>
              </div>
              <Link
                href={`/booking?service=${service.id}`}
                className="inline-flex px-5 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {t("public.hero.cta")}
              </Link>
            </motion.div>
          ))}
        </div>
    </FrontOfficePageLayout>
  );
}
