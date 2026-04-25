"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

type StoreProduct = {
  id: string;
  name: string;
  description: string | null;
  unitAmount: number | null;
  currency: string | null;
};

export default function ConnectedStorefrontPage() {
  const t = useTranslations("storefront");
  const params = useParams<{ accountId: string }>();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState<string | null>(null);

  const apiBaseUrl = process.env["NEXT_PUBLIC_API_BASE_URL"];
  const accountId = params.accountId;

  const loadProducts = async () => {
    if (!apiBaseUrl) {
      setError(t("errors.missingApiBaseUrl"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/stripe/connect/${accountId}/products`);
      if (!response.ok) {
        throw new Error("LOAD_PRODUCTS_FAILED");
      }
      const payload = (await response.json()) as { products: StoreProduct[] };
      setProducts(payload.products);
    } catch {
      setError(t("errors.loadProducts"));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (productId: string) => {
    if (!apiBaseUrl) {
      setError(t("errors.missingApiBaseUrl"));
      return;
    }
    setCheckoutLoadingId(productId);
    try {
      const response = await fetch(`${apiBaseUrl}/stripe/connect/${accountId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          successUrl: `${window.location.origin}/store/${accountId}?success=1`,
          cancelUrl: `${window.location.origin}/store/${accountId}?cancel=1`,
        }),
      });
      if (!response.ok) {
        throw new Error("CHECKOUT_FAILED");
      }
      const payload = (await response.json()) as { url: string };
      window.location.href = payload.url;
    } catch {
      setError(t("errors.checkout"));
    } finally {
      setCheckoutLoadingId(null);
    }
  };

  const accountCaption = useMemo(
    () => t("accountCaption", { accountId }),
    [accountId, t],
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-sm text-slate-600">{accountCaption}</p>
          <p className="text-xs text-slate-500">{t("accountHint")}</p>
        </div>

        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => {
            void loadProducts();
          }}
        >
          {loading ? t("loading") : t("loadProducts")}
        </button>

        {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-slate-900">{product.name}</h2>
              {product.description ? <p className="mt-1 text-sm text-slate-600">{product.description}</p> : null}
              <p className="mt-2 text-sm text-slate-700">
                {product.unitAmount != null && product.currency
                  ? `${(product.unitAmount / 100).toFixed(2)} ${product.currency.toUpperCase()}`
                  : t("noPrice")}
              </p>
              <button
                type="button"
                className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
                disabled={checkoutLoadingId === product.id}
                onClick={() => {
                  void handleCheckout(product.id);
                }}
              >
                {checkoutLoadingId === product.id ? t("redirecting") : t("buy")}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
