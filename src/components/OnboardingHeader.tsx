"use client";

import { useT, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function OnboardingHeader() {
  const { locale, setLocale } = useT();
  return (
    <div className="flex justify-end px-4 pt-[max(1rem,var(--safe-top))]">
      <div className="inline-flex rounded-full bg-white p-0.5 border border-emerald-100 text-[10px]">
        {(["id", "en"] as Locale[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={cn(
              "px-2 py-0.5 rounded-full font-semibold uppercase",
              locale === l ? "bg-emerald-600 text-white" : "text-slate-500"
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
