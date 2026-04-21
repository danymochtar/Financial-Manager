"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

type Option = { id: string; name: string; kind?: string; emoji?: string; currency?: string };

export type TransactionFormValues = {
  type: "income" | "expense";
  accountId: string;
  categoryId: string;
  amount: number;
  currency: "IDR" | "MYR" | "USD" | "SGD";
  date: string;
  merchant: string | null;
  note: string | null;
  isBoros: boolean;
};

export function TransactionForm({
  initial,
  submitLabel = "Simpan",
  txId,
  onSuccess,
}: {
  initial?: Partial<TransactionFormValues>;
  submitLabel?: string;
  txId?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [accounts, setAccounts] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [values, setValues] = useState<TransactionFormValues>({
    type: initial?.type ?? "expense",
    accountId: initial?.accountId ?? "",
    categoryId: initial?.categoryId ?? "",
    amount: initial?.amount ?? 0,
    currency: (initial?.currency as TransactionFormValues["currency"]) ?? "IDR",
    date: initial?.date ?? new Date().toISOString().slice(0, 10),
    merchant: initial?.merchant ?? "",
    note: initial?.note ?? "",
    isBoros: initial?.isBoros ?? false,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/accounts").then((r) => r.json()), fetch("/api/categories").then((r) => r.json())]).then(
      ([a, c]) => {
        setAccounts(a.accounts ?? []);
        setCategories(c.categories ?? []);
        setValues((v) => ({
          ...v,
          accountId: v.accountId || (a.accounts?.[0]?.id ?? ""),
          categoryId:
            v.categoryId || ((c.categories ?? []) as Option[]).find((cc) => cc.kind === v.type)?.id || "",
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
    if (!values.accountId || !values.categoryId || !values.amount) {
      toast({ kind: "error", message: "Lengkapi akun, kategori, amount" });
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
        toast({ kind: "error", message: data?.error ?? "Gagal simpan" });
        return;
      }
      toast({ kind: "success", message: "Tercatat 🫠" });
      if (onSuccess) onSuccess();
      else {
        router.push("/tx");
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
            className={`flex-1 rounded-full border px-3 py-2 text-sm font-medium ${
              values.type === t
                ? t === "expense"
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-pink-100 bg-white text-slate-600"
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
          className="input mt-1"
          value={values.date.slice(0, 10)}
          onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Akun</label>
          <select
            required
            className="input mt-1"
            value={values.accountId}
            onChange={(e) => setValues((v) => ({ ...v, accountId: e.target.value }))}
          >
            <option value="">— pilih —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.emoji ?? ""} {a.name} {a.currency ? `(${a.currency})` : ""}
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
                {c.emoji ?? ""} {c.name}
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
          placeholder="Grab, Starbucks, Indomaret..."
        />
      </div>

      <div>
        <label className="label">Catatan</label>
        <textarea
          className="input mt-1 min-h-[64px]"
          value={values.note ?? ""}
          onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))}
        />
      </div>

      {values.type === "expense" && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.isBoros}
            onChange={(e) => setValues((v) => ({ ...v, isBoros: e.target.checked }))}
          />
          <span>🫠 Tandain ini transaksi kalap</span>
        </label>
      )}

      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? "Nyimpen..." : submitLabel}
      </button>
    </form>
  );
}
