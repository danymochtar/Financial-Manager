"use client";

import { formatShort } from "@/lib/currency";
import { useT } from "@/lib/i18n";

export function BorosMeter({
  spent,
  limit,
  currency,
  label,
}: {
  spent: number;
  limit: number;
  currency: "IDR" | "MYR";
  label: string;
}) {
  const { t } = useT();
  const hasLimit = limit > 0;
  const pct = hasLimit ? Math.min(200, Math.round((spent / limit) * 100)) : 0;
  const arcPct = Math.min(100, pct);
  const color = pct >= 100 ? "#ef4444" : pct >= 80 ? "#f97316" : pct >= 50 ? "#eab308" : "#22c55e";
  const tagline = !hasLimit
    ? t("dash.borosNoLimit")
    : pct >= 120
    ? t("dash.borosCrazy")
    : pct >= 100
    ? t("dash.borosOver")
    : pct >= 80
    ? t("dash.borosAlmost")
    : pct >= 50
    ? t("dash.borosOk")
    : t("dash.borosGood");

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (arcPct / 100) * circumference;

  return (
    <div className="card relative overflow-hidden p-5">
      <div className="absolute inset-0 -z-0 bg-gradient-to-br from-pink-50 to-orange-50" />
      <div className="relative flex items-center gap-5">
        <div className="relative h-44 w-44 shrink-0">
          <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
            <circle cx="100" cy="100" r={radius} stroke="#fde8e3" strokeWidth="16" fill="none" />
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke={color}
              strokeWidth="16"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              style={{ transition: "stroke-dasharray 0.8s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
            <div className="text-3xl font-bold leading-none" style={{ color }}>
              {hasLimit ? `${pct}%` : "—"}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {formatShort(spent, currency)}
              {hasLimit && ` / ${formatShort(limit, currency)}`}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-pink-600">
            {t("dash.borosTitle")}
          </div>
          <div className="mt-1 text-lg font-bold leading-tight">{tagline}</div>
          {hasLimit && <div className="mt-2 text-xs text-slate-500">{t("dash.borosSubtitle")}</div>}
        </div>
      </div>
    </div>
  );
}
