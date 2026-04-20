"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { formatMoney } from "@/lib/currency";
import { Trash2, Play } from "lucide-react";

type Source = { id: string; name: string };
type Category = { id: string; name: string; kind: string };

type Recurring = {
  id: string;
  type: string;
  amount: string;
  currency: string;
  cadence: string;
  dayOfMonth: number | null;
  weekday: number | null;
  nextDueDate: string;
  isActive: boolean;
  note: string | null;
  source: { name: string; color: string };
  category: { name: string; color: string };
};

export default function RecurringPage() {
  const [items, setItems] = useState<Recurring[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const toast = useToast();
  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    sourceId: "",
    categoryId: "",
    amount: 0,
    currency: "MYR" as "IDR" | "MYR" | "USD" | "SGD",
    cadence: "monthly" as "monthly" | "weekly",
    dayOfMonth: 25,
    weekday: 1,
    nextDueDate: new Date().toISOString().slice(0, 10),
    note: "",
  });

  async function load() {
    const [r, s, c] = await Promise.all([
      fetch("/api/recurring").then((r) => r.json()),
      fetch("/api/sources").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]);
    setItems(r.recurring ?? []);
    setSources(s.sources ?? []);
    setCategories(c.categories ?? []);
    setForm((f) => ({
      ...f,
      sourceId: f.sourceId || (s.sources?.[0]?.id ?? ""),
      categoryId:
        f.categoryId ||
        ((c.categories ?? []) as Category[]).find((cc) => cc.kind === f.type)?.id ||
        "",
    }));
  }

  useEffect(() => {
    load();
  }, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      nextDueDate: new Date(form.nextDueDate).toISOString(),
      dayOfMonth: form.cadence === "monthly" ? form.dayOfMonth : null,
      weekday: form.cadence === "weekly" ? form.weekday : null,
      note: form.note || null,
    };
    const res = await fetch("/api/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const d = await res.json();
      toast({ kind: "error", message: d?.error?.formErrors?.[0] ?? d?.error ?? "Gagal" });
      return;
    }
    toast({ kind: "success", message: "Recurring dibuat" });
    setForm((f) => ({ ...f, amount: 0 }));
    load();
  }

  async function onToggle(id: string, active: boolean) {
    await fetch(`/api/recurring/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: active }),
    });
    load();
  }

  async function onDelete(id: string) {
    if (!confirm("Hapus recurring?")) return;
    await fetch(`/api/recurring/${id}`, { method: "DELETE" });
    load();
  }

  async function onRunNow() {
    const res = await fetch("/api/recurring/run", { method: "POST" });
    const d = await res.json();
    toast({ kind: "success", message: `${d.created ?? 0} transaksi ter-generate` });
    load();
  }

  const filteredCategories = categories.filter((c) => c.kind === form.type);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Recurring</h1>
          <p className="text-sm text-slate-500">Gaji & subscription otomatis ter-generate saat jatuh tempo.</p>
        </div>
        <button className="btn-outline" onClick={onRunNow}>
          <Play className="h-4 w-4" /> Run due sekarang
        </button>
      </div>

      <form className="card grid grid-cols-2 gap-3 p-4 md:grid-cols-4" onSubmit={onAdd}>
        <div>
          <label className="label">Type</label>
          <select
            className="input mt-1"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "income" | "expense", categoryId: "" }))}
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <label className="label">Source</label>
          <select
            className="input mt-1"
            value={form.sourceId}
            onChange={(e) => setForm((f) => ({ ...f, sourceId: e.target.value }))}
          >
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
            className="input mt-1"
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          >
            <option value="">— pilih —</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input mt-1"
            value={form.amount || ""}
            onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
          />
        </div>
        <div>
          <label className="label">Currency</label>
          <select
            className="input mt-1"
            value={form.currency}
            onChange={(e) =>
              setForm((f) => ({ ...f, currency: e.target.value as typeof f.currency }))
            }
          >
            <option value="IDR">IDR</option>
            <option value="MYR">MYR</option>
            <option value="USD">USD</option>
            <option value="SGD">SGD</option>
          </select>
        </div>
        <div>
          <label className="label">Cadence</label>
          <select
            className="input mt-1"
            value={form.cadence}
            onChange={(e) => setForm((f) => ({ ...f, cadence: e.target.value as typeof f.cadence }))}
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        {form.cadence === "monthly" ? (
          <div>
            <label className="label">Tanggal tiap bulan</label>
            <input
              type="number"
              min={1}
              max={31}
              className="input mt-1"
              value={form.dayOfMonth}
              onChange={(e) => setForm((f) => ({ ...f, dayOfMonth: Number(e.target.value) }))}
            />
          </div>
        ) : (
          <div>
            <label className="label">Hari (0=Min)</label>
            <input
              type="number"
              min={0}
              max={6}
              className="input mt-1"
              value={form.weekday}
              onChange={(e) => setForm((f) => ({ ...f, weekday: Number(e.target.value) }))}
            />
          </div>
        )}
        <div>
          <label className="label">Next due</label>
          <input
            type="date"
            className="input mt-1"
            value={form.nextDueDate}
            onChange={(e) => setForm((f) => ({ ...f, nextDueDate: e.target.value }))}
          />
        </div>
        <div className="col-span-2 md:col-span-4">
          <label className="label">Note</label>
          <input
            className="input mt-1"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </div>
        <div className="col-span-2 md:col-span-4">
          <button type="submit" className="btn-primary w-full md:w-auto">
            Tambah recurring
          </button>
        </div>
      </form>

      <div className="card">
        {items.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">Belum ada recurring.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((r) => (
              <li key={r.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={r.type === "income" ? "text-emerald-700" : "text-rose-700"}>
                      {r.type === "income" ? "+" : "-"} {formatMoney(r.amount, r.currency)}
                    </span>
                    <span className="chip" style={{ color: r.source.color }}>
                      {r.source.name}
                    </span>
                    <span className="chip" style={{ color: r.category.color }}>
                      {r.category.name}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {r.cadence} · Next: {new Date(r.nextDueDate).toLocaleDateString("id-ID")}
                    {r.note && ` · ${r.note}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={r.isActive}
                      onChange={(e) => onToggle(r.id, e.target.checked)}
                    />
                    active
                  </label>
                  <button className="btn-ghost text-rose-600" onClick={() => onDelete(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
