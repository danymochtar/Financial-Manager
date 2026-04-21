"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { formatMoney } from "@/lib/currency";
import { Check, Trash2 } from "lucide-react";

type ReceiptItem = {
  id: string;
  name: string;
  quantity: string | null;
  unitPrice: string | null;
  total: string | null;
};

type Receipt = {
  id: string;
  merchant: string | null;
  totalAmount: string | null;
  currency: string | null;
  date: string | null;
  status: string;
  items: ReceiptItem[];
  transaction: { id: string } | null;
};

type Option = { id: string; name: string; kind?: string; emoji?: string };
type AccountOption = { id: string; name: string; currency: string; emoji: string };

export default function ReceiptReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [values, setValues] = useState({
    accountId: "",
    categoryId: "",
    amount: 0,
    currency: "IDR" as "IDR" | "MYR" | "USD" | "SGD",
    date: new Date().toISOString().slice(0, 10),
    merchant: "",
    note: "",
    isBoros: false,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [rRes, aRes, cRes] = await Promise.all([
        fetch(`/api/receipts/${id}`),
        fetch("/api/accounts"),
        fetch("/api/categories"),
      ]);
      const r = (await rRes.json()).receipt as Receipt;
      const a = (await aRes.json()).accounts as AccountOption[];
      const c = (await cRes.json()).categories as Option[];
      setReceipt(r);
      setAccounts(a ?? []);
      setCategories(c ?? []);
      setValues((v) => ({
        ...v,
        amount: r.totalAmount ? Number(r.totalAmount) : 0,
        currency: (r.currency as typeof v.currency) || "IDR",
        date: r.date ? new Date(r.date).toISOString().slice(0, 10) : v.date,
        merchant: r.merchant ?? "",
        accountId: a?.find((x) => x.currency === (r.currency ?? "IDR"))?.id ?? a?.[0]?.id ?? "",
        categoryId:
          (c as (Option & { kind: string })[])?.find((cc) => cc.kind === "expense")?.id ?? "",
      }));
    })();
  }, [id]);

  const expenseCategories = useMemo(() => categories.filter((c) => c.kind === "expense"), [categories]);

  async function onConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!values.accountId || !values.categoryId || !values.amount) {
      toast({ kind: "error", message: "Lengkapi akun, kategori, amount" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/receipts/${id}/confirm`, {
        method: "POST",
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
        toast({ kind: "error", message: data?.error ?? "Gagal confirm" });
        return;
      }
      toast({ kind: "success", message: "Masuk catet keborosan 🫠" });
      router.push("/review");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onDiscard() {
    if (!confirm("Buang struk ini?")) return;
    await fetch(`/api/receipts/${id}`, { method: "DELETE" });
    router.push("/review");
  }

  if (!receipt) return <div className="card p-5 text-sm text-slate-500">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Review Struk</h1>
        {receipt.status !== "confirmed" && (
          <button className="btn-ghost text-xs text-rose-600" onClick={onDiscard}>
            <Trash2 className="h-3 w-3" /> Buang
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/receipts/${id}/image`} alt="" className="w-full" />
      </div>

      {receipt.status === "confirmed" ? (
        <div className="card p-5 text-sm text-emerald-700">
          <Check className="h-5 w-5" /> Udah ter-confirm.
        </div>
      ) : (
        <form className="card p-4 space-y-3" onSubmit={onConfirm}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount</label>
              <input
                type="number"
                step="0.01"
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
                onChange={(e) => setValues((v) => ({ ...v, currency: e.target.value as typeof v.currency }))}
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
              value={values.date}
              onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Bayar dari</label>
            <select
              className="input mt-1"
              value={values.accountId}
              onChange={(e) => setValues((v) => ({ ...v, accountId: e.target.value }))}
            >
              <option value="">— pilih —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.emoji} {a.name} ({a.currency})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Kategori</label>
            <select
              className="input mt-1"
              value={values.categoryId}
              onChange={(e) => setValues((v) => ({ ...v, categoryId: e.target.value }))}
            >
              <option value="">— pilih —</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Merchant</label>
            <input
              className="input mt-1"
              value={values.merchant}
              onChange={(e) => setValues((v) => ({ ...v, merchant: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Catatan (opsional)</label>
            <textarea
              className="input mt-1 min-h-[64px]"
              value={values.note}
              onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.isBoros}
              onChange={(e) => setValues((v) => ({ ...v, isBoros: e.target.checked }))}
            />
            <span>🫠 Tandain ini transaksi kalap / boros</span>
          </label>

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Nyimpen..." : "Confirm 🚀"}
          </button>
        </form>
      )}
    </div>
  );
}
