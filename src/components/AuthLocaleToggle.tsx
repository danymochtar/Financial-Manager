"use client";

import { useT, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AuthLocaleToggle() {
  const { locale, setLocale } = useT();
  return (
    <div className="inline-flex rounded-full bg-white p-0.5 border border-pink-100 text-[10px]">
      {(["id", "en"] as Locale[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={cn(
            "px-2 py-0.5 rounded-full font-semibold uppercase",
            locale === l ? "bg-pink-600 text-white" : "text-slate-500"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function BrandTitle() {
  const { t } = useT();
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">{t("brand.name")}</h1>
      <p className="mt-1 text-sm text-slate-600">{t("brand.tagline")}</p>
    </>
  );
}
