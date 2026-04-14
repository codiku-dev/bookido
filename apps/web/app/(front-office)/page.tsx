"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import BookidoLogo from "#/components/BookidoLogo";

export default function Page() {
  const t = useTranslations();

  const brandHeader = (
    <div className="absolute top-6 left-6 z-30 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
        <BookidoLogo className="w-6 h-6 brightness-0 invert" />
      </div>
      <div>
        <div className="text-lg font-bold text-slate-900">Bookido</div>
        <div className="text-sm text-slate-600">{t("public.brand.subtitle")}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {brandHeader}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative min-h-screen bg-linear-to-br from-slate-50 to-blue-50 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full mb-6 mt-12">{t("public.hero.badge")}</div>
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">Sarah Johnson</h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">{t("public.hero.description")}</p>
              <Link
                href="/services"
                className="inline-flex px-8 py-4 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors"
              >
                {t("public.hero.cta")}
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1540206063137-4a88ca974d1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwY29hY2glMjBwZXJzb25hbCUyMHRyYWluZXJ8ZW58MXx8fHwxNzc2MDgxNzY2fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt={t("public.hero.imageAlt")}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
