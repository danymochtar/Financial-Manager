"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { formatShort } from "@/lib/currency";
import { useT } from "@/lib/i18n";

type Tx = {
  id: string;
  type: string;
  amount: string;
  currency: string;
  date: string;
  merchant: string | null;
  isBoros: boolean;
  account: { name: string; emoji: string; color: string };
  category: { name: string; emoji: string; color: string; nature: string };
};

export default function TxPage() {
  const { t, locale } = useT();
  const [items, setItems] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "expense" | "income" | "boros">("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const qs = new URLSearchParams();
      if (filter === "expense") qs.set("type", "expense");
      if (filter === "income") qs.set("type", "income");
      if (filter === "boros") qs.set("boros", "1");
      const res = await fetch(`/api/transactions?${qs}`);
      const data = await res.json();
      setItems(data.transactions ?? []);
      setLoading(false);
    })();
  }, [filter]);

  // Group by date
  const grouped = items.reduce((acc, tx) => {
    const key = new Date(tx.date).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {} as Record<string, Tx[]>);

  const FILTERS = [
    { k: "all" as const, l: t("tx.filter.all") },
    { k: "expense" as const, l: t("tx.filter.expense") },
    { k: "income" as const, l: t("tx.filter.income") },
    { k: "boros" as const, l: t("tx.filter.boros") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("tx.title")}</h1>
        <Link href="/tx/new" className="btn-outline text-xs">
          <Plus className="h-3 w-3" /> {t("tx.manual")}
        </Link>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-full bg-white p-1 border border-emerald-100 text-xs">
        {FILTERS.map(({ k, l }) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 font-medium ${
              filter === k ? "bg-emerald-600 text-white" : "text-slate-600"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-4 text-sm text-slate-500">{t("loading")}</div>
      ) : items.length === 0 ? (
        <div className="card p-6 text-center text-sm text-slate-500">{t("tx.empty")}</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([day, txs]) => (
            <div key={day}>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {day}
              </div>
              <div className="card divide-y divide-emerald-50">
                {txs.map((tx) => (
                  <Link
                    key={tx.id}
                    href={`/tx/${tx.id}`}
                    className="flex items-center gap-3 p-3 active:bg-emerald-50/40"
                  >
                    <span className="text-xl">{tx.category.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium">
                        {tx.merchant ?? tx.category.name}
                        {tx.isBoros && <span className="ml-1 text-xs">🫠</span>}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {tx.account.emoji} {tx.account.name}
                      </div>
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        tx.type === "income" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"} {formatShort(Number(tx.amount), tx.currency)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
