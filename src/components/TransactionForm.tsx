"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

type Option = { id: string; name: string; kind?: string };

export type TransactionFormValues = {
  type: "income" | "expense";
  sourceId: string;
  categoryId: string;
  amount: number;
  currency: "IDR" | "MYR" | "USD" | "SGD";
  date: string;
  merchant: string | null;
  note: string | null;
  receiptId?: string | null;
};

export function TransactionForm({
  initial,
  receiptId,
  submitLabel = "Simpan",
  onSuccess,
  txId,
}: {
  initial?: Partial<TransactionFormValues>;
  receiptId?: string | null;
  submitLabel?: string;
  onSuccess?: () => void;
  txId?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [sources, setSources] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [values, setValues] = useState<TransactionFormValues>({
    type: initial?.type ?? "expense",
    sourceId: initial?.sourceId ?? "",
    categoryId: initial?.categoryId ?? "",
    amount: initial?.amount ?? 0,
    currency: (initial?.currency as TransactionFormValues["currency"]) ?? "IDR",
    date: initial?.date ?? new Date().toISOString().slice(0, 10),
    merchant: initial?.merchant ?? "",
    note: initial?.note ?? "",
    receiptId: receiptId ?? initial?.receiptId ?? null,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/sources").then((r) => r.json()), fetch("/api/categories").then((r) => r.json())]).then(
      ([s, c]) => {
        setSources(s.sources ?? []);
        setCategories(c.categories ?? []);
        setValues((v) => ({
          ...v,
          sourceId: v.sourceId || (s.sources?.[0]?.id ?? ""),
          categoryId:
            v.categoryId ||
            ((c.categories ?? []) as Option[]).find((cc) => cc.kind === v.type)?.id ||
            "",
        }));
      }
    );
  }, []);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.kind === values.type),
    [categories, values.type]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.sourceId || !values.categoryId) {
      toast({ kind: "error", message: "Source & kategori wajib dipilih" });
      return;
    }
    if (!values.amount || values.amount <= 0) {
      toast({ kind: "error", message: "Amount harus > 0" });
      return;
    }
    setBusy(true);
    try {
      const endpoint = txId ? `/api/transactions/${txId}` : "/api/transactions";
      const method = txId ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          date: new Date(values.date).toISOString(),
          merchant: values.merchant || null,
          note: values.note || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ kind: "error", message: data?.error?.formErrors?.[0] ?? data?.error ?? "Gagal simpan" });
        return;
      }
      toast({ kind: "success", message: "Transaksi tersimpan" });
      if (onSuccess) onSuccess();
      else {
        router.push("/transactions");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="flex gap-2">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setValues((v) => ({ ...v, type: t, categoryId: "" }))}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              values.type === t
                ? t === "expense"
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t === "expense" ? "Pengeluaran" : "Pemasukan"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            className="input mt-1"
            value={values.amount || ""}
            onChange={(e) => setValues((v) => ({ ...v, amount: Number(e.target.value) }))}
          />
        </div>
        <div>
          <label className="label">Currency</label>
          <select
            className="input mt-1"
            value={values.currency}
            onChange={(e) =>
              setValues((v) => ({ ...v, currency: e.target.value as TransactionFormValues["currency"] }))
            }
          >
            <option value="IDR">IDR</option>
            <option value="MYR">MYR</option>
            <option value="USD">USD</option>
            <option value="SGD">SGD</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Tanggal</label>
        <input
          type="date"
          required
          className="input mt-1"
          value={values.date.slice(0, 10)}
          onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Source</label>
          <select
            required
            className="input mt-1"
            value={values.sourceId}
            onChange={(e) => setValues((v) => ({ ...v, sourceId: e.target.value }))}
          >
            <option value="">— pilih —</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Kategori</label>
          <select
            required
            className="input mt-1"
            value={values.categoryId}
            onChange={(e) => setValues((v) => ({ ...v, categoryId: e.target.value }))}
          >
            <option value="">— pilih —</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Merchant (opsional)</label>
        <input
          className="input mt-1"
          value={values.merchant ?? ""}
          onChange={(e) => setValues((v) => ({ ...v, merchant: e.target.value }))}
          placeholder="Grab, Starbucks, 7-Eleven, dst."
        />
      </div>

      <div>
        <label className="label">Note (opsional)</label>
        <textarea
          className="input mt-1 min-h-[80px]"
          value={values.note ?? ""}
          onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))}
        />
      </div>

      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? "Menyimpan..." : submitLabel}
      </button>
    </form>
  );
}
