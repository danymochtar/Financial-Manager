"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatShort } from "@/lib/currency";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { useT } from "@/lib/i18n";

type Receipt = {
  id: string;
  merchant: string | null;
  totalAmount: string | null;
  currency: string | null;
  date: string | null;
  status: string;
  createdAt: string;
};

export default function ReviewPage() {
  const { t, locale } = useT();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/receipts?status=draft")
      .then((r) => r.json())
      .then((data) => {
        setReceipts(data.receipts ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("review.title")}</h1>
        <p className="text-sm text-slate-600">{t("review.desc")}</p>
      </div>

      {loading ? (
        <div className="card p-4 text-sm text-slate-500">{t("loading")}</div>
      ) : receipts.length === 0 ? (
        <div className="card p-6 text-center text-sm text-slate-500">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
          {t("review.empty")}
        </div>
      ) : (
        <div className="space-y-2">
          {receipts.map((r) => (
            <Link
              key={r.id}
              href={`/review/${r.id}`}
              className="card flex items-center gap-3 p-3 active:scale-[0.99]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/receipts/${r.id}/image`}
                alt=""
                className="h-14 w-14 rounded-xl border border-pink-100 object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-semibold">
                  {r.merchant ?? <span className="italic text-slate-400">{t("review.merchantUnknown")}</span>}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {r.date
                    ? new Date(r.date).toLocaleDateString(locale === "en" ? "en-US" : "id-ID")
                    : new Date(r.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "id-ID")}
                  {r.totalAmount && r.currency && (
                    <span> · {formatShort(Number(r.totalAmount), r.currency)}</span>
                  )}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
